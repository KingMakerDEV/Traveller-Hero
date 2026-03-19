"""
search_tools.py — Search tools for the travel planner agents.

search_general  — Real Tavily web search for travel research
search_places   — Location-specific search using Tavily
run_trip_research — Orchestrates multiple searches for trip_builder
"""

from __future__ import annotations

import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def search_general(query: str) -> str:
    """
    Search the web for general travel information using Tavily.
    Returns summarised search results as a string.
    """
    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        logger.warning("TAVILY_API_KEY not set. Returning empty results.")
        return "[search_general] TAVILY_API_KEY is not set. Returning empty results."

    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )

        parts: list[str] = []

        answer = response.get("answer")
        if answer:
            parts.append(f"Summary: {answer}\n")

        for idx, result in enumerate(response.get("results", []), start=1):
            title = result.get("title", "No title")
            url = result.get("url", "")
            snippet = result.get("content", "")[:400]
            parts.append(f"{idx}. {title} ({url})\n   {snippet}")

        return "\n".join(parts) if parts else "No results found."

    except Exception as e:
        logger.error("search_general error: %s", e)
        return f"[search_general] Search failed: {e}"


def search_places(location: str, category: Optional[str] = None) -> str:
    """
    Search for specific places, venues, and attractions at a location.
    Uses Tavily to return real current results instead of mock data.
    """
    if category:
        query = f"best {category} in {location} 2025 recommendations"
    else:
        query = f"top attractions and places to visit in {location} 2025"

    result = search_general(query)
    return f"Places in {location}" + (f" ({category})" if category else "") + ":\n" + result


def run_trip_research(
    destination: str,
    country: str,
    intent: str,
    budget_range: str,
    duration_days: int,
    interests: list[str]
) -> dict:
    """
    Orchestrates multiple targeted searches for trip_builder.
    Runs 4 searches covering destination overview, activities,
    accommodation, and practical travel info.
    Returns a dict with all research results.
    """
    logger.info("Running trip research for %s, %s", destination, country)

    interests_str = ", ".join(interests) if interests else intent

    results = {}

    # Search 1 — Destination overview and best time to visit
    logger.info("Search 1: Destination overview")
    results["destination_overview"] = search_general(
        f"{destination} {country} travel guide best time to visit {intent} 2025"
    )

    # Search 2 — Activities matching the intent
    logger.info("Search 2: Activities")
    results["activities"] = search_general(
        f"best {intent} activities in {destination} {country} {interests_str}"
    )

    # Search 3 — Accommodation options matching budget
    logger.info("Search 3: Accommodation")
    results["accommodation"] = search_general(
        f"best hotels accommodation {destination} {country} {budget_range} {intent}"
    )

    # Search 4 — Local food and practical tips
    logger.info("Search 4: Food and tips")
    results["food_and_tips"] = search_general(
        f"local food restaurants must eat {destination} {country} travel tips safety"
    )

    logger.info("Trip research complete for %s", destination)
    return results