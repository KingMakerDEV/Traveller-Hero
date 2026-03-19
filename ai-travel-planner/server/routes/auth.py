"""
auth.py — Auth verification endpoint.
Frontend sends its Supabase JWT token to this endpoint.
Backend verifies it and returns the user profile.
Used to confirm the user is logged in before sensitive operations.
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/verify", methods=["POST", "OPTIONS"])
def verify_token():
    """
    Verifies a Supabase JWT token sent from the frontend.
    Creates a profile row in public.profiles if first login.
    Returns the user profile data.

    Expects: { token: string }
    Returns: { ok: true, user: { id, email, full_name, avatar_url } }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- AUTH VERIFY ROUTE HIT ---")

    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        token = data.get("token", "").strip()

        if not token:
            return jsonify({"ok": False, "error": "Token is required"}), 400

        supabase = get_supabase()

        # Verify the JWT token with Supabase Auth
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            return jsonify({"ok": False, "error": "Invalid or expired token"}), 401

        user = user_response.user
        user_id = user.id
        email = user.email
        full_name = user.user_metadata.get("full_name", "") or user.user_metadata.get("name", "")
        avatar_url = user.user_metadata.get("avatar_url", "") or user.user_metadata.get("picture", "")

        print(f"AUTH: Verified user {email} ({user_id})")

        # Upsert profile — creates on first login, updates on subsequent logins
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "updated_at": "now()"
        }

        supabase.table("profiles").upsert(profile_data).execute()
        print(f"AUTH: Profile upserted for {email}")

        return jsonify({
            "ok": True,
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "avatar_url": avatar_url
            }
        }), 200

    except Exception as e:
        print("AUTH VERIFY ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": "Authentication failed"}), 500


@auth_bp.route("/auth/profile", methods=["GET", "OPTIONS"])
def get_profile():
    """
    Returns the full profile for a verified user including their trips.
    Expects Authorization header: Bearer <token>
    Returns: { ok: true, profile: {...}, trips: [...] }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- AUTH PROFILE ROUTE HIT ---")

    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"ok": False, "error": "Authorization header required"}), 401

        token = auth_header.split("Bearer ")[1].strip()

        supabase = get_supabase()

        # Verify token
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            return jsonify({"ok": False, "error": "Invalid or expired token"}), 401

        user_id = user_response.user.id

        # Fetch profile
        profile_result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        if not profile_result.data:
            return jsonify({"ok": False, "error": "Profile not found"}), 404

        # Fetch user's saved trips
        trips_result = supabase.table("trips").select(
            "id, slug, title, destination, country, duration_days, summary, intent, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()

        print(f"PROFILE: Loaded {len(trips_result.data)} trips for user {user_id}")

        return jsonify({
            "ok": True,
            "profile": profile_result.data,
            "trips": trips_result.data or []
        }), 200

    except Exception as e:
        print("AUTH PROFILE ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": "Failed to load profile"}), 500