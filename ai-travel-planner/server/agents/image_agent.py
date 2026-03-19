"""
image_agent.py — Generates precise Unsplash search keywords for a trip.
Called once after trip generation. Keywords stored in Supabase trips table.
Ensures every image shown on the site matches the actual destination and vibe.
"""

import json
import logging
import os
from openai import OpenAI

logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ.get("NVIDIA_API_KEY")
    )


SYSTEM_PROMPT = """
You are an expert travel photographer and image curator for TravellerHero.
Your job is to generate precise Unsplash search keywords for a trip plan.

These keywords will be used to fetch real photos from Unsplash API.
The images must be geographically and contextually accurate.

Rules:
- Always include the destination name and country in every keyword set
- Keywords must be specific enough to return photos of the EXACT location
- Never use generic words like "travel", "vacation", "holiday", "trip"
- Hero keywords should return stunning landscape or cityscape photos
- Day keywords should match each day's specific location and theme
- Card keyword is one precise phrase for thumbnail display
- All keywords should be 2-5 words maximum for best Unsplash results

Always respond in valid JSON only. No markdown, no explanation.

Response format:
{
  "hero": [
    "specific location country landscape",
    "specific location country aerial",
    "specific location country landmark"
  ],
  "days": [
    "day 1 specific location activity",
    "day 2 specific location activity",
    "day 3 specific location activity"
  ],
  "card": "destination country most iconic view",
  "intent_mood": "adventure mountains forest"
}
"""


def run_image_agent(trip_plan: dict) -> dict:
    """
    Generates Unsplash keywords for a trip plan.
    Returns a dict with hero, days, card, and intent_mood keyword sets.
    Falls back to destination-based keywords if LLM fails.
    """
    destination = trip_plan.get("destination", "")
    country = trip_plan.get("country", "")
    title = trip_plan.get("title", "")
    days = trip_plan.get("days", [])

    logger.info("Image agent running for: %s, %s", destination, country)

    client = _get_client()

    # Build day summaries for the prompt
    day_summaries = []
    for day in days:
        day_summaries.append(
            f"Day {day.get('day')}: {day.get('location')} — {day.get('theme')}"
        )

    user_message = f"""
Generate Unsplash search keywords for this trip:

Title: {title}
Destination: {destination}
Country: {country}
Duration: {len(days)} days

Day by day locations:
{chr(10).join(day_summaries)}

Generate keywords that will return accurate, beautiful photos of these
exact locations. The hero images must show {destination}, {country}.
Each day keyword must match that day's specific location.
"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            max_tokens=800
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Image agent raw response: %s", raw[:200])

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        # Validate structure
        if "hero" not in parsed or "card" not in parsed:
            raise ValueError("Missing required fields in image agent response")

        # Ensure days array matches trip days length
        if "days" not in parsed or len(parsed["days"]) != len(days):
            parsed["days"] = [
                f"{day.get('location')} {country}"
                for day in days
            ]

        logger.info(
            "Image agent complete. Card keyword: %s",
            parsed.get("card")
        )
        return parsed

    except json.JSONDecodeError as e:
        logger.error("Image agent JSON parse failed: %s", e)
        return _fallback_keywords(destination, country, days)

    except Exception as e:
        logger.error("Image agent error: %s", e)
        return _fallback_keywords(destination, country, days)


def _fallback_keywords(destination: str, country: str, days: list) -> dict:
    """
    Returns safe fallback keywords using destination and country.
    Used when the LLM call fails.
    """
    logger.warning(
        "Using fallback image keywords for %s %s", destination, country
    )
    return {
        "hero": [
            f"{destination} {country} landscape",
            f"{destination} {country} city",
            f"{destination} {country} scenery"
        ],
        "days": [
            f"{day.get('location', destination)} {country}"
            for day in days
        ],
        "card": f"{destination} {country}",
        "intent_mood": f"{destination} {country} travel"
    }