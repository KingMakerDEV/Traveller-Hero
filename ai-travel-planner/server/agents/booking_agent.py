"""
booking_agent.py — Flight search agent using Duffel API via raw HTTP.
Takes destination, country, and travel dates.
Returns top 3 flight options with prices and booking links.
Uses direct HTTP calls — SDK v0.6.2 has incompatible method signatures.
"""

import os
import logging
import requests
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

DUFFEL_BASE_URL = "https://api.duffel.com"
DUFFEL_VERSION = "v2"

# Major Indian departure cities with IATA codes
INDIAN_ORIGIN_CITIES = [
    {"code": "DEL", "name": "New Delhi"},
    {"code": "BOM", "name": "Mumbai"},
    {"code": "BLR", "name": "Bangalore"},
]

# IATA codes for common international destinations
# Used to map country/city names to airport codes
DESTINATION_IATA_MAP = {
    # India
    "leh": "IXL", "ladakh": "IXL",
    "spiti": "KUU", "manali": "KUU",
    "shimla": "SLV",
    "goa": "GOI",
    "kochi": "COK", "cochin": "COK",
    "chennai": "MAA", "madras": "MAA",
    "kolkata": "CCU", "calcutta": "CCU",
    "varanasi": "VNS",
    "jaipur": "JAI",
    "udaipur": "UDR",
    "bagdogra": "IXB", "darjeeling": "IXB", "sikkim": "IXB",
    "guwahati": "GAU", "meghalaya": "GAU",
    "shillong": "SHL",
    "thiruvananthapuram": "TRV", "trivandrum": "TRV",
    "coimbatore": "CJB", "ooty": "CJB", "wayanad": "CJB",
    # International
    "bali": "DPS", "denpasar": "DPS",
    "bangkok": "BKK",
    "singapore": "SIN",
    "dubai": "DXB",
    "london": "LHR",
    "paris": "CDG",
    "tokyo": "NRT",
    "new york": "JFK",
    "annecy": "GNB", "france": "CDG",
    "switzerland": "ZRH",
    "nepal": "KTM", "kathmandu": "KTM",
    "sri lanka": "CMB", "colombo": "CMB",
    "maldives": "MLE", "male": "MLE",
    "vietnam": "HAN",
    "cambodia": "PNH",
    "malaysia": "KUL", "kuala lumpur": "KUL",
    "australia": "SYD", "sydney": "SYD",
    "japan": "NRT",
    "germany": "FRA", "frankfurt": "FRA",
    "italy": "FCO", "rome": "FCO",
    "spain": "MAD", "madrid": "MAD",
    "portugal": "LIS",
    "greece": "ATH", "athens": "ATH",
    "turkey": "IST", "istanbul": "IST",
    "egypt": "CAI", "cairo": "CAI",
    "kenya": "NBO", "nairobi": "NBO",
    "south africa": "JNB",
    "usa": "JFK", "new york": "JFK",
    "canada": "YYZ", "toronto": "YYZ",
    "mexico": "MEX",
    "peru": "LIM", "machu picchu": "LIM",
    "argentina": "EZE", "buenos aires": "EZE",
    "brazil": "GRU", "sao paulo": "GRU",
}


def _get_headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('DUFFEL_API_KEY')}",
        "Duffel-Version": DUFFEL_VERSION,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


def _resolve_iata_code(destination: str, country: str) -> str | None:
    """
    Resolve destination/country name to IATA airport code.
    Checks destination name first then country name.
    Returns None if no match found.
    """
    dest_lower = destination.lower().strip()
    country_lower = country.lower().strip()

    # Check full destination name
    if dest_lower in DESTINATION_IATA_MAP:
        return DESTINATION_IATA_MAP[dest_lower]

    # Check first word of destination
    first_word = dest_lower.split()[0]
    if first_word in DESTINATION_IATA_MAP:
        return DESTINATION_IATA_MAP[first_word]

    # Check country name
    if country_lower in DESTINATION_IATA_MAP:
        return DESTINATION_IATA_MAP[country_lower]

    logger.warning("No IATA code found for: %s, %s", destination, country)
    return None


def _get_departure_date(best_season: str) -> str:
    """
    Convert best season string to a specific departure date.
    Falls back to 3 months from today if parsing fails.
    """
    today = datetime.now()

    season_month_map = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4,
        "may": 5, "jun": 6, "jul": 7, "aug": 8,
        "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }

    if best_season:
        season_lower = best_season.lower()
        for month_name, month_num in season_month_map.items():
            if month_name in season_lower:
                year = today.year
                # If month has passed use next year
                if month_num <= today.month:
                    year += 1
                target_date = datetime(year, month_num, 15)
                return target_date.strftime("%Y-%m-%d")

    # Default: 3 months from today
    fallback = today + timedelta(days=90)
    return fallback.strftime("%Y-%m-%d")


def _parse_offer(offer: dict, origin_city: str) -> dict | None:
    """
    Extract clean structured data from a Duffel offer object.
    Returns None if required fields are missing.
    """
    try:
        slices = offer.get("slices", [])
        if not slices:
            return None

        first_slice = slices[0]
        segments = first_slice.get("segments", [])
        if not segments:
            return None

        first_segment = segments[0]
        last_segment = segments[-1]

        airline = first_segment.get("marketing_carrier", {})
        airline_name = airline.get("name", "Unknown Airline")
        airline_code = airline.get("iata_code", "")
        airline_logo = airline.get("logo_symbol_url", "")

        flight_number = (
            f"{airline_code}"
            f"{first_segment.get('marketing_carrier_flight_number', '')}"
        )

        departing_at = first_segment.get("departing_at", "")
        arriving_at = last_segment.get("arriving_at", "")
        duration = first_slice.get("duration", "")

        # Format duration from ISO 8601 (PT2H30M → 2h 30m)
        duration_formatted = duration.replace("PT", "").replace("H", "h ").replace("M", "m").strip()

        origin_airport = first_segment.get("origin", {})
        dest_airport = last_segment.get("destination", {})

        total_amount = offer.get("total_amount", "0")
        total_currency = offer.get("total_currency", "EUR")

        # Convert EUR to INR at approximate rate
        try:
            amount_eur = float(total_amount)
            amount_inr = round(amount_eur * 90)
            price_inr = f"₹{amount_inr:,}"
        except Exception:
            price_inr = f"{total_currency} {total_amount}"

        # Count stops
        stops = len(segments) - 1
        stops_label = "Direct" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}"

        # Baggage info from first passenger
        passengers = first_segment.get("passengers", [])
        baggage = []
        if passengers:
            for bag in passengers[0].get("baggages", []):
                qty = bag.get("quantity", 0)
                bag_type = bag.get("type", "")
                if qty > 0:
                    baggage.append(f"{qty} {bag_type}")

        # Build Google Flights deep link
        dest_iata = dest_airport.get("iata_code", "")
        origin_iata = origin_airport.get("iata_code", "")
        depart_date = departing_at[:10] if departing_at else ""

        google_flights_url = (
            f"https://www.google.com/travel/flights/search?"
            f"tfs=CBwQAhojagwIAxIIL2EvZGVsX2luEgwIAxIIL2EvYm9tX2luQAFIAXACeAGCAQsI____________ARAA"
        )

        # Better deep link using actual airport codes
        if origin_iata and dest_iata and depart_date:
            date_formatted = depart_date.replace("-", "")
            google_flights_url = (
                f"https://www.google.com/travel/flights?"
                f"q=Flights+from+{origin_iata}+to+{dest_iata}+on+{depart_date}"
            )

        return {
            "offer_id": offer.get("id"),
            "airline": airline_name,
            "airline_code": airline_code,
            "airline_logo": airline_logo,
            "flight_number": flight_number,
            "origin_city": origin_city,
            "origin_airport": origin_airport.get("name", ""),
            "origin_iata": origin_iata,
            "destination_city": dest_airport.get("city_name", ""),
            "destination_airport": dest_airport.get("name", ""),
            "destination_iata": dest_iata,
            "departing_at": departing_at,
            "arriving_at": arriving_at,
            "duration": duration_formatted,
            "stops": stops_label,
            "cabin_class": "Economy",
            "baggage": baggage,
            "price_inr": price_inr,
            "price_raw": float(total_amount),
            "currency": total_currency,
            "booking_url": google_flights_url,
            "fare_brand": first_slice.get("fare_brand_name", ""),
            "expires_at": offer.get("expires_at", ""),
        }
    except Exception as e:
        logger.error("Error parsing offer: %s", e)
        return None


def search_flights(
    destination: str,
    country: str,
    best_season: str = "",
    passengers: int = 1
) -> dict:
    """
    Search for flights from major Indian cities to the trip destination.
    Returns top 3 cheapest options across all origin cities.

    Args:
        destination: Trip destination name e.g. "Bali"
        country: Country name e.g. "Indonesia"
        best_season: Best travel season from trip plan e.g. "October to March"
        passengers: Number of adult passengers

    Returns:
        {
            "ok": bool,
            "flights": list of flight options,
            "destination_iata": str,
            "departure_date": str,
            "error": str (only if ok is False)
        }
    """
    api_key = os.getenv("DUFFEL_API_KEY")
    if not api_key:
        logger.error("DUFFEL_API_KEY not set")
        return {"ok": False, "flights": [], "error": "Duffel API key not configured"}

    # Resolve destination to IATA code
    dest_iata = _resolve_iata_code(destination, country)
    if not dest_iata:
        logger.warning("Could not resolve IATA for %s, %s", destination, country)
        return {
            "ok": False,
            "flights": [],
            "error": f"Could not find airport code for {destination}, {country}",
            "google_flights_fallback": (
                f"https://www.google.com/travel/flights?"
                f"q=Flights+to+{destination}+{country}"
            )
        }

    departure_date = _get_departure_date(best_season)
    logger.info(
        "Searching flights to %s (%s) on %s",
        destination, dest_iata, departure_date
    )

    all_offers = []

    # Search from each major Indian city
    for origin in INDIAN_ORIGIN_CITIES:
        origin_code = origin["code"]

        # Skip if origin equals destination
        if origin_code == dest_iata:
            continue

        payload = {
            "data": {
                "cabin_class": "economy",
                "passengers": [{"type": "adult"} for _ in range(passengers)],
                "slices": [
                    {
                        "origin": origin_code,
                        "destination": dest_iata,
                        "departure_date": departure_date
                    }
                ]
            }
        }

        try:
            response = requests.post(
                f"{DUFFEL_BASE_URL}/air/offer_requests",
                json=payload,
                headers=_get_headers(),
                timeout=30
            )

            if response.status_code != 200:
                logger.error(
                    "Duffel API error for %s→%s: %s",
                    origin_code, dest_iata, response.text[:200]
                )
                continue

            data = response.json().get("data", {})
            offers = data.get("offers", [])

            logger.info(
                "Got %d offers from %s to %s",
                len(offers), origin_code, dest_iata
            )

            # Parse and collect valid offers
            for offer in offers[:5]:  # Only parse top 5 per origin
                parsed = _parse_offer(offer, origin["name"])
                if parsed:
                    all_offers.append(parsed)

        except requests.Timeout:
            logger.error("Timeout searching flights from %s", origin_code)
            continue
        except Exception as e:
            logger.error("Error searching from %s: %s", origin_code, e)
            continue

    if not all_offers:
        logger.warning("No flight offers found for %s", destination)
        return {
            "ok": False,
            "flights": [],
            "error": "No flights found for this destination",
            "google_flights_fallback": (
                f"https://www.google.com/travel/flights?"
                f"q=Flights+to+{destination}+{country}"
            )
        }

    # Sort by price and return top 3 cheapest
    all_offers.sort(key=lambda x: x["price_raw"])
    top_offers = all_offers[:3]

    logger.info(
        "Returning %d flight options to %s. Cheapest: %s",
        len(top_offers),
        destination,
        top_offers[0]["price_inr"] if top_offers else "N/A"
    )

    return {
        "ok": True,
        "flights": top_offers,
        "destination_iata": dest_iata,
        "departure_date": departure_date,
        "destination": destination,
        "country": country
    }


def get_hotel_search_url(destination: str, country: str, best_season: str = "") -> dict:
    """
    Generates Booking.com and Hotels.com deep link URLs for hotel search.
    Duffel does not have a hotel API in the free tier so we use affiliate links.
    """
    departure_date = _get_departure_date(best_season)
    try:
        checkin = datetime.strptime(departure_date, "%Y-%m-%d")
        checkout = checkin + timedelta(days=7)
        checkin_str = checkin.strftime("%Y-%m-%d")
        checkout_str = checkout.strftime("%Y-%m-%d")
    except Exception:
        checkin_str = departure_date
        checkout_str = departure_date

    destination_encoded = destination.replace(" ", "+")
    country_encoded = country.replace(" ", "+")

    booking_url = (
        f"https://www.booking.com/search.html?"
        f"ss={destination_encoded}+{country_encoded}"
        f"&checkin={checkin_str}"
        f"&checkout={checkout_str}"
        f"&no_rooms=1&group_adults=1"
    )

    hotels_url = (
        f"https://www.hotels.com/search.do?"
        f"q-destination={destination_encoded}+{country_encoded}"
        f"&q-check-in={checkin_str}"
        f"&q-check-out={checkout_str}"
        f"&q-rooms=1&q-room-0-adults=1"
    )

    airbnb_url = (
        f"https://www.airbnb.com/s/{destination_encoded}--{country_encoded}/homes?"
        f"checkin={checkin_str}"
        f"&checkout={checkout_str}"
        f"&adults=1"
    )

    return {
        "booking_com": booking_url,
        "hotels_com": hotels_url,
        "airbnb": airbnb_url,
        "checkin": checkin_str,
        "checkout": checkout_str
    }