"""
booking.py — Booking search endpoints.

POST /booking/search  — Search flights and get hotel links for a trip
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from agents.booking_agent import search_flights, get_hotel_search_url
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

booking_bp = Blueprint("booking", __name__)


def verify_token_from_header(request) -> dict | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split("Bearer ")[1].strip()
    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {"id": user_response.user.id, "email": user_response.user.email}
        return None
    except Exception:
        return None


@booking_bp.route("/booking/search", methods=["POST", "OPTIONS"])
def search_booking():
    """
    Searches for flights and generates hotel booking links for a trip.
    Requires Authorization header with valid Supabase JWT.

    Expects: {
        destination: string,
        country: string,
        best_season: string (optional),
        passengers: number (optional, default 1)
    }
    Returns: {
        ok: true,
        flights: FlightOffer[],
        hotels: HotelLinks,
        departure_date: string
    }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- BOOKING SEARCH ROUTE HIT ---")

    try:
        user = verify_token_from_header(request)
        if not user:
            return jsonify({
                "ok": False,
                "error": "You must be logged in to search bookings"
            }), 401

        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        destination = data.get("destination", "").strip()
        country = data.get("country", "").strip()
        best_season = data.get("best_season", "")
        passengers = data.get("passengers", 1)

        if not destination or not country:
            return jsonify({
                "ok": False,
                "error": "destination and country are required"
            }), 400

        print(f"BOOKING: Searching for {destination}, {country}")

        # Search flights
        flight_results = search_flights(
            destination=destination,
            country=country,
            best_season=best_season,
            passengers=passengers
        )

        # Get hotel booking links
        hotel_links = get_hotel_search_url(
            destination=destination,
            country=country,
            best_season=best_season
        )

        print(
            f"BOOKING: Found {len(flight_results.get('flights', []))} flights "
            f"and generated hotel links"
        )

        return jsonify({
            "ok": True,
            "flights": flight_results.get("flights", []),
            "flights_available": flight_results.get("ok", False),
            "flights_error": flight_results.get("error"),
            "google_flights_fallback": flight_results.get("google_flights_fallback"),
            "hotels": hotel_links,
            "destination": destination,
            "country": country,
            "departure_date": flight_results.get(
                "departure_date",
                hotel_links.get("checkin", "")
            )
        }), 200

    except Exception as e:
        print("BOOKING SEARCH ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500