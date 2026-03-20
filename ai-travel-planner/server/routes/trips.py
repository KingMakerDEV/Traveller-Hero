"""
trips.py — Trip management endpoints.

GET   /popular-trips          — Returns 8 manually seeded demo trips with ratings
GET   /trip/<slug>            — Returns full trip data by slug
POST  /trip/save              — Saves a user's own generated trip to Supabase
POST  /trip/book/<slug>       — Books an existing public trip to user's profile
DELETE /trip/<slug>           — Deletes a trip (owner only)
PATCH  /trip/<slug>/complete  — Marks a trip as completed
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase
from utils.slug import generate_unique_slug
from utils.mail import send_booking_confirmation_email

logger = logging.getLogger(__name__)

trips_bp = Blueprint("trips", __name__)


def verify_token_from_header(request) -> dict | None:
    """
    Helper to verify Bearer token from Authorization header.
    Returns user dict if valid, None if invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split("Bearer ")[1].strip()

    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email
            }
        return None
    except Exception:
        return None


def _get_user_full_name(user_id: str) -> str:
    """Fetch user's full name from profiles table for email personalisation."""
    try:
        supabase = get_supabase()
        result = supabase.table("profiles").select(
            "full_name"
        ).eq("id", user_id).single().execute()
        if result.data:
            return result.data.get("full_name", "") or ""
        return ""
    except Exception:
        return ""


@trips_bp.route("/popular-trips", methods=["GET", "OPTIONS"])
def get_popular_trips():
    """
    Returns the 8 manually seeded demo trips with average rating.
    Only returns trips where user_id IS NULL — these are the demo trips
    inserted by seed_trips.py. User-generated trips are never shown here.
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- POPULAR TRIPS ROUTE HIT ---")

    try:
        supabase = get_supabase()

        trips_result = supabase.table("trips").select(
            "id, slug, title, destination, country, duration_days, summary, intent, created_at, image_keywords"
        ).eq("is_public", True).is_(
            "user_id", "null"
        ).order(
            "created_at", desc=True
        ).limit(8).execute()

        trips = trips_result.data or []

        enriched_trips = []
        for trip in trips:
            reviews_result = supabase.table("reviews").select(
                "rating"
            ).eq("trip_id", trip["id"]).execute()

            reviews = reviews_result.data or []
            avg_rating = 0.0
            if reviews:
                avg_rating = round(
                    sum(r["rating"] for r in reviews) / len(reviews), 1
                )

            enriched_trips.append({
                **trip,
                "avg_rating": avg_rating,
                "review_count": len(reviews)
            })

        print(f"POPULAR TRIPS: Returning {len(enriched_trips)} demo trips")

        return jsonify({
            "ok": True,
            "trips": enriched_trips
        }), 200

    except Exception as e:
        print("POPULAR TRIPS ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@trips_bp.route("/trip/<slug>", methods=["GET", "OPTIONS"])
def get_trip_by_slug(slug: str):
    """
    Returns full trip data by slug including image_keywords.
    Used by the trip detail page.
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print(f"\n--- GET TRIP BY SLUG: {slug} ---")

    try:
        supabase = get_supabase()

        result = supabase.table("trips").select("*").eq(
            "slug", slug
        ).eq("is_public", True).single().execute()

        if not result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        trip = result.data

        reviews_result = supabase.table("reviews").select("*").eq(
            "trip_id", trip["id"]
        ).order("created_at", desc=True).execute()

        reviews = reviews_result.data or []
        avg_rating = 0.0
        if reviews:
            avg_rating = round(
                sum(r["rating"] for r in reviews) / len(reviews), 1
            )

        print(f"GET TRIP: Found '{trip['title']}' with {len(reviews)} reviews")

        return jsonify({
            "ok": True,
            "trip": {
                **trip,
                "avg_rating": avg_rating,
                "reviews": reviews
            }
        }), 200

    except Exception as e:
        print("GET TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@trips_bp.route("/trip/save", methods=["POST", "OPTIONS"])
def save_trip():
    """
    Saves a user's own AI-generated trip to Supabase.
    Sends booking confirmation email after successful save.
    Requires Authorization header with valid Supabase JWT.

    Expects: {
        trip_data: TripPlan object,
        intent: string,
        intent_group: string,
        image_keywords: dict (optional)
    }
    Returns: { ok: true, slug: string, trip_id: string }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- SAVE TRIP ROUTE HIT ---")

    try:
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to save a trip"
            }), 401

        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        trip_data = data.get("trip_data")
        intent = data.get("intent", "")
        intent_group = data.get("intent_group", "")
        image_keywords = data.get("image_keywords", {})

        if not trip_data:
            return jsonify({"ok": False, "error": "trip_data is required"}), 400

        slug = generate_unique_slug(trip_data.get("title", "my-trip"))

        supabase = get_supabase()

        insert_data = {
            "slug": slug,
            "user_id": user["id"],
            "title": trip_data.get("title", ""),
            "destination": trip_data.get("destination", ""),
            "country": trip_data.get("country", ""),
            "duration_days": trip_data.get("duration_days", 7),
            "best_season": trip_data.get("best_season", ""),
            "summary": trip_data.get("summary", ""),
            "intent": intent,
            "intent_group": intent_group,
            "trip_data": trip_data,
            "image_keywords": image_keywords,
            "booking_source": "generated",
            "source_trip_id": None,
            "is_public": True
        }

        result = supabase.table("trips").insert(insert_data).execute()

        if not result.data:
            return jsonify({"ok": False, "error": "Failed to save trip"}), 500

        saved_trip = result.data[0]
        print(f"SAVE TRIP: Saved '{saved_trip['title']}' with slug '{slug}'")

        # Send booking confirmation email in background thread
        try:
            full_name = _get_user_full_name(user["id"])
            send_booking_confirmation_email(
                full_name=full_name or user["email"].split("@")[0],
                user_email=user["email"],
                trip_title=trip_data.get("title", ""),
                destination=trip_data.get("destination", ""),
                country=trip_data.get("country", ""),
                duration_days=trip_data.get("duration_days", 7),
                estimated_budget=trip_data.get("estimated_budget", ""),
                slug=slug
            )
            print(f"SAVE TRIP: Booking confirmation email queued for {user['email']}")
        except Exception as email_err:
            # Email failure must never block the trip save response
            logger.error("Failed to queue booking confirmation email: %s", email_err)

        return jsonify({
            "ok": True,
            "slug": slug,
            "trip_id": saved_trip["id"]
        }), 200

    except Exception as e:
        print("SAVE TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@trips_bp.route("/trip/book/<source_slug>", methods=["POST", "OPTIONS"])
def book_trip(source_slug: str):
    """
    Books an existing public trip to the logged-in user's profile.
    Sends booking confirmation email after successful booking.
    Requires Authorization header with valid Supabase JWT.

    Returns: { ok: true, slug: string, trip_id: string, already_booked: bool }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print(f"\n--- BOOK TRIP ROUTE HIT: {source_slug} ---")

    try:
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to book a trip"
            }), 401

        supabase = get_supabase()

        source_result = supabase.table("trips").select("*").eq(
            "slug", source_slug
        ).eq("is_public", True).single().execute()

        if not source_result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        source_trip = source_result.data

        duplicate_check = supabase.table("trips").select("id, slug").eq(
            "user_id", user["id"]
        ).eq(
            "source_trip_id", source_trip["id"]
        ).execute()

        if duplicate_check.data and len(duplicate_check.data) > 0:
            existing = duplicate_check.data[0]
            print(f"BOOK TRIP: User {user['id']} already booked '{source_slug}'")
            return jsonify({
                "ok": True,
                "slug": existing["slug"],
                "trip_id": existing["id"],
                "already_booked": True
            }), 200

        slug = generate_unique_slug(source_trip["title"])

        insert_data = {
            "slug": slug,
            "user_id": user["id"],
            "title": source_trip["title"],
            "destination": source_trip["destination"],
            "country": source_trip["country"],
            "duration_days": source_trip["duration_days"],
            "best_season": source_trip.get("best_season", ""),
            "summary": source_trip.get("summary", ""),
            "intent": source_trip.get("intent", ""),
            "intent_group": source_trip.get("intent_group", ""),
            "trip_data": source_trip["trip_data"],
            "image_keywords": source_trip.get("image_keywords", {}),
            "booking_source": "booked",
            "source_trip_id": source_trip["id"],
            "is_public": False
        }

        result = supabase.table("trips").insert(insert_data).execute()

        if not result.data:
            return jsonify({"ok": False, "error": "Failed to book trip"}), 500

        booked_trip = result.data[0]
        print(
            f"BOOK TRIP: User {user['email']} booked "
            f"'{source_trip['title']}' as '{slug}'"
        )

        # Send booking confirmation email in background thread
        try:
            full_name = _get_user_full_name(user["id"])
            send_booking_confirmation_email(
                full_name=full_name or user["email"].split("@")[0],
                user_email=user["email"],
                trip_title=source_trip["title"],
                destination=source_trip["destination"],
                country=source_trip["country"],
                duration_days=source_trip["duration_days"],
                estimated_budget=source_trip.get(
                    "trip_data", {}
                ).get("estimated_budget", ""),
                slug=slug
            )
            print(f"BOOK TRIP: Confirmation email queued for {user['email']}")
        except Exception as email_err:
            logger.error("Failed to queue booking confirmation email: %s", email_err)

        return jsonify({
            "ok": True,
            "slug": slug,
            "trip_id": booked_trip["id"],
            "already_booked": False
        }), 200

    except Exception as e:
        print("BOOK TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@trips_bp.route("/trip/<slug>/complete", methods=["PATCH", "OPTIONS"])
def complete_trip(slug: str):
    """
    Marks a trip as completed.
    Sets is_completed = True and completed_at = now().
    Only the trip owner can mark it as completed.
    Requires Authorization header with valid Supabase JWT.

    Returns: { ok: true }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print(f"\n--- COMPLETE TRIP: {slug} ---")

    try:
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to mark a trip as completed"
            }), 401

        supabase = get_supabase()

        # Verify trip exists and belongs to this user
        trip_result = supabase.table("trips").select(
            "id, user_id, title, is_completed"
        ).eq("slug", slug).single().execute()

        if not trip_result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        trip = trip_result.data

        if trip["user_id"] != user["id"]:
            return jsonify({
                "ok": False,
                "error": "You do not have permission to update this trip"
            }), 403

        if trip.get("is_completed"):
            return jsonify({
                "ok": True,
                "message": "Trip is already marked as completed"
            }), 200

        # Mark as completed
        supabase.table("trips").update({
            "is_completed": True,
            "completed_at": "now()"
        }).eq("slug", slug).execute()

        print(f"COMPLETE TRIP: '{trip['title']}' marked completed by {user['id']}")

        return jsonify({"ok": True}), 200

    except Exception as e:
        print("COMPLETE TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@trips_bp.route("/trip/<slug>", methods=["DELETE", "OPTIONS"])
def delete_trip(slug: str):
    """
    Deletes a trip by slug.
    For generated trips: only the original creator can delete.
    For booked trips: the user who booked it can remove it from their profile.
    The original source trip is never deleted when a booked copy is removed.
    Requires Authorization header with valid Supabase JWT.
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print(f"\n--- DELETE TRIP: {slug} ---")

    try:
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to delete a trip"
            }), 401

        supabase = get_supabase()

        trip_result = supabase.table("trips").select(
            "id, user_id, title, booking_source"
        ).eq("slug", slug).single().execute()

        if not trip_result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        trip = trip_result.data

        if trip["user_id"] != user["id"]:
            return jsonify({
                "ok": False,
                "error": "You do not have permission to delete this trip"
            }), 403

        supabase.table("trips").delete().eq("slug", slug).execute()

        booking_source = trip.get("booking_source", "generated")
        print(
            f"DELETE TRIP: Deleted '{trip['title']}' "
            f"(source: {booking_source}) by user {user['id']}"
        )

        return jsonify({"ok": True}), 200

    except Exception as e:
        print("DELETE TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500