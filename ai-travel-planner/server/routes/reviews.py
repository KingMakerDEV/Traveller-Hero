"""
reviews.py — Review management endpoints.

GET  /reviews/<trip_id>    — Returns all reviews for a trip
POST /reviews              — Submits a new review (no login required)
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.route("/reviews/<trip_id>", methods=["GET", "OPTIONS"])
def get_reviews(trip_id: str):
    """
    Returns all approved reviews for a specific trip.
    Used by the trip detail page to display reviews.

    Returns: { ok: true, reviews: [...], avg_rating: float }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print(f"\n--- GET REVIEWS FOR TRIP: {trip_id} ---")

    try:
        supabase = get_supabase()

        result = supabase.table("reviews").select("*").eq(
            "trip_id", trip_id
        ).eq(
            "is_approved", True
        ).order("created_at", desc=True).execute()

        reviews = result.data or []

        avg_rating = 0.0
        if reviews:
            avg_rating = round(
                sum(r["rating"] for r in reviews) / len(reviews), 1
            )

        print(f"GET REVIEWS: Found {len(reviews)} reviews for trip {trip_id}")

        return jsonify({
            "ok": True,
            "reviews": reviews,
            "avg_rating": avg_rating,
            "review_count": len(reviews)
        }), 200

    except Exception as e:
        print("GET REVIEWS ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@reviews_bp.route("/reviews", methods=["POST", "OPTIONS"])
def submit_review():
    """
    Submits a new review for a trip.
    No login required.

    Expects: {
        trip_id: string,
        reviewer_name: string,
        rating: integer (1-5),
        comment: string,
        trip_image_keyword: string (optional)
    }
    Returns: { ok: true, review_id: string }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- SUBMIT REVIEW ROUTE HIT ---")

    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        trip_id = data.get("trip_id", "").strip()
        reviewer_name = data.get("reviewer_name", "").strip()
        rating = data.get("rating")
        comment = data.get("comment", "").strip()
        trip_image_keyword = data.get("trip_image_keyword", "").strip()

        # Validate required fields
        if not all([trip_id, reviewer_name, comment]):
            return jsonify({
                "ok": False,
                "error": "trip_id, reviewer_name, and comment are required"
            }), 400

        # Validate rating
        if rating is None:
            return jsonify({"ok": False, "error": "rating is required"}), 400

        try:
            rating = int(rating)
        except (ValueError, TypeError):
            return jsonify({"ok": False, "error": "rating must be a number"}), 400

        if rating < 1 or rating > 5:
            return jsonify({
                "ok": False,
                "error": "rating must be between 1 and 5"
            }), 400

        supabase = get_supabase()

        # Confirm trip exists before saving review
        trip_result = supabase.table("trips").select("id").eq(
            "id", trip_id
        ).execute()

        if not trip_result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        # Insert review
        insert_data = {
            "trip_id": trip_id,
            "reviewer_name": reviewer_name,
            "rating": rating,
            "comment": comment,
            "trip_image_keyword": trip_image_keyword or None,
            "is_approved": True
        }

        result = supabase.table("reviews").insert(insert_data).execute()

        if not result.data:
            return jsonify({"ok": False, "error": "Failed to save review"}), 500

        review_id = result.data[0]["id"]
        print(f"SUBMIT REVIEW: Saved review {review_id} for trip {trip_id}")

        return jsonify({
            "ok": True,
            "review_id": review_id
        }), 200

    except Exception as e:
        print("SUBMIT REVIEW ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


@reviews_bp.route("/reviews/seed", methods=["POST", "OPTIONS"])
def seed_reviews():
    """
    Seeds the database with sample reviews for testing.
    Only works if the trip exists in the database.
    Call this once manually via Postman or curl to populate initial reviews.

    Expects: { trip_id: string }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- SEED REVIEWS ROUTE HIT ---")

    try:
        data = request.get_json(force=True, silent=True)
        trip_id = data.get("trip_id", "").strip() if data else ""

        if not trip_id:
            return jsonify({"ok": False, "error": "trip_id is required"}), 400

        supabase = get_supabase()

        # Confirm trip exists
        trip_result = supabase.table("trips").select("id, title").eq(
            "id", trip_id
        ).execute()

        if not trip_result.data:
            return jsonify({"ok": False, "error": "Trip not found"}), 404

        sample_reviews = [
            {
                "trip_id": trip_id,
                "reviewer_name": "Sarah M.",
                "rating": 5,
                "comment": "This trip completely changed my perspective. The AI understood exactly what I needed — a proper escape from routine. Every single recommendation was spot on.",
                "trip_image_keyword": "mountain",
                "is_approved": True
            },
            {
                "trip_id": trip_id,
                "reviewer_name": "James K.",
                "rating": 5,
                "comment": "I told the planner I wanted adventure without the tourist traps and it delivered. Found places I never would have discovered on my own.",
                "trip_image_keyword": "adventure",
                "is_approved": True
            },
            {
                "trip_id": trip_id,
                "reviewer_name": "Priya R.",
                "rating": 4,
                "comment": "The itinerary was incredibly detailed. The food recommendations alone were worth it. Would definitely use TravellerHero again.",
                "trip_image_keyword": "food",
                "is_approved": True
            },
            {
                "trip_id": trip_id,
                "reviewer_name": "Marco T.",
                "rating": 5,
                "comment": "Planned a family trip with three kids and the AI nailed it. Activities for everyone, accommodation that made sense, and a pace that did not exhaust us.",
                "trip_image_keyword": "family",
                "is_approved": True
            },
            {
                "trip_id": trip_id,
                "reviewer_name": "Ananya S.",
                "rating": 4,
                "comment": "Digital detox trip to the mountains was exactly what I needed. No wifi, no stress, just nature. The AI knew before I did.",
                "trip_image_keyword": "nature",
                "is_approved": True
            }
        ]

        result = supabase.table("reviews").insert(sample_reviews).execute()

        print(f"SEED REVIEWS: Inserted {len(result.data)} reviews for trip {trip_id}")

        return jsonify({
            "ok": True,
            "inserted": len(result.data)
        }), 200

    except Exception as e:
        print("SEED REVIEWS ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500