"""
edit.py — Trip editing endpoint.

POST /trip/edit — Takes existing trip data and a natural language
                  edit request, returns the modified trip plan.
                  Requires user to be logged in.
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from agents.edit_agent import run_edit_agent
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

edit_bp = Blueprint("edit", __name__)


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


@edit_bp.route("/trip/edit", methods=["POST", "OPTIONS"])
def edit_trip():
    """
    Takes an existing trip plan and a natural language edit request.
    Runs the edit agent and returns the modified trip plan.
    Requires Authorization header with valid Supabase JWT.

    Expects: {
        existing_trip: TripPlan object,
        edit_request: string,
        slug: string (optional — if provided, also updates in Supabase)
    }
    Returns: {
        ok: true,
        trip: modified TripPlan object,
        updated_in_db: boolean
    }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- EDIT TRIP ROUTE HIT ---")

    try:
        # Verify user is logged in
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to edit a trip"
            }), 401

        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        existing_trip = data.get("existing_trip")
        edit_request = data.get("edit_request", "").strip()
        slug = data.get("slug", "").strip()

        # Validate inputs
        if not existing_trip:
            return jsonify({
                "ok": False,
                "error": "existing_trip is required"
            }), 400

        if not edit_request:
            return jsonify({
                "ok": False,
                "error": "edit_request is required"
            }), 400

        if len(edit_request) > 500:
            return jsonify({
                "ok": False,
                "error": "edit_request must be under 500 characters"
            }), 400

        print(f"EDIT TRIP: User {user['email']} — request: {edit_request[:100]}")

        # Run the edit agent
        modified_trip = run_edit_agent(existing_trip, edit_request)

        updated_in_db = False

        # If slug provided, verify ownership and update in Supabase
        if slug:
            try:
                supabase = get_supabase()

                # Verify this trip belongs to the requesting user
                trip_result = supabase.table("trips").select(
                    "id, user_id, title"
                ).eq("slug", slug).single().execute()

                if trip_result.data:
                    trip = trip_result.data

                    if trip["user_id"] == user["id"]:
                        # Update the trip in database
                        supabase.table("trips").update({
                            "title": modified_trip.get("title", trip["title"]),
                            "destination": modified_trip.get("destination", ""),
                            "country": modified_trip.get("country", ""),
                            "duration_days": modified_trip.get("duration_days", 7),
                            "best_season": modified_trip.get("best_season", ""),
                            "summary": modified_trip.get("summary", ""),
                            "trip_data": modified_trip,
                            "updated_at": "now()"
                        }).eq("slug", slug).execute()

                        updated_in_db = True
                        print(f"EDIT TRIP: Updated '{slug}' in database")
                    else:
                        print(f"EDIT TRIP: User {user['id']} does not own trip {slug}")

            except Exception as db_error:
                # DB update failure should not block returning the edited trip
                logger.error("Failed to update trip in DB: %s", db_error)
                print(f"EDIT TRIP DB ERROR: {db_error}")

        print(
            f"EDIT TRIP: Complete. "
            f"New title: {modified_trip.get('title')} "
            f"Updated in DB: {updated_in_db}"
        )

        return jsonify({
            "ok": True,
            "trip": modified_trip,
            "updated_in_db": updated_in_db
        }), 200

    except Exception as e:
        print("EDIT TRIP ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500