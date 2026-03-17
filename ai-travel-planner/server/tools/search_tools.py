"""
search_tools.py — LangChain tools for the travel planner agents.

Tools are decorated with ``@tool`` so the LLM can discover and invoke
them via their name + docstring.  Each tool returns a plain string that
the calling agent can fold into the conversation.
"""

from __future__ import annotations

import os
import random
from typing import Optional

from dotenv import load_dotenv
from langchain_core.tools import tool

# Load environment variables (.env must live in the /server directory)
load_dotenv()


# ═══════════════════════════════════════════════════════════════════════
# Tool 1 — General travel search (Tavily API)
# ═══════════════════════════════════════════════════════════════════════

@tool
def search_general(query: str) -> str:
    """Search the web for general travel information.

    Use this tool whenever you need up-to-date, factual information about
    a travel destination that is NOT specific to a single place or venue.

    Good examples of queries:
      • "Best time to visit Kyoto Japan weather and seasons"
      • "Visa requirements for US citizens traveling to Vietnam"
      • "Average daily budget for backpacking in Portugal"
      • "Safety tips for solo travelers in Colombia"
      • "Local customs and etiquette in Morocco"

    Do NOT use this tool for individual venue details (hours, pricing,
    reviews) — use ``search_places`` for that instead.

    Args:
        query: A natural-language search query about travel information,
               weather, seasons, visa requirements, budgets, or cultural
               tips.  Be as specific as possible for better results.

    Returns:
        A string containing the top search results summarised for the
        agent to reason over.
    """
    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        return (
            "[search_general] TAVILY_API_KEY is not set. "
            "Please add it to the server/.env file. "
            "Returning empty results."
        )

    try:
        from tavily import TavilyClient  # lazy import to avoid load-time errors

        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )

        # Build a compact summary the LLM can digest
        parts: list[str] = []

        answer = response.get("answer")
        if answer:
            parts.append(f"**Summary:** {answer}\n")

        for idx, result in enumerate(response.get("results", []), start=1):
            title = result.get("title", "No title")
            url = result.get("url", "")
            snippet = result.get("content", "")[:300]
            parts.append(f"{idx}. [{title}]({url})\n   {snippet}")

        return "\n".join(parts) if parts else "No results found."

    except Exception as e:
        return f"[search_general] Error performing search: {e}"


# ═══════════════════════════════════════════════════════════════════════
# Tool 2 — Place details (mock Google Places API)
# ═══════════════════════════════════════════════════════════════════════

# Mock data bank — realistic enough for agent development & testing
_MOCK_PLACES: dict[str, list[dict]] = {
    "default": [
        {
            "name": "Central Museum of Art",
            "opening_hours": "09:00 – 17:00 (Tue–Sun, closed Mon)",
            "price_range": "$12 – $18 adult admission",
            "rating": 4.6,
            "popular_times": "Late morning to early afternoon",
        },
        {
            "name": "Riverside Night Market",
            "opening_hours": "18:00 – 23:00 (Thu–Sun)",
            "price_range": "$5 – $15 per stall",
            "rating": 4.3,
            "popular_times": "Evening, peaks around 20:00",
        },
        {
            "name": "Historic Old Town Walking District",
            "opening_hours": "Open 24 hours (shops open 10:00 – 20:00)",
            "price_range": "Free (self-guided), $25 guided tour",
            "rating": 4.7,
            "popular_times": "Mid-morning and late afternoon",
        },
        {
            "name": "Sky Deck Observation Tower",
            "opening_hours": "10:00 – 22:00 daily",
            "price_range": "$20 – $30 adult admission",
            "rating": 4.5,
            "popular_times": "Sunset hours (17:00 – 19:00)",
        },
        {
            "name": "Botanical Garden & Tea House",
            "opening_hours": "07:00 – 18:00 daily",
            "price_range": "$8 entry, $15 with tea ceremony",
            "rating": 4.8,
            "popular_times": "Early morning for fewest crowds",
        },
    ],
}


@tool
def search_places(location: str, category: Optional[str] = None) -> str:
    """Look up specific place details for a destination.

    Use this tool when you need granular information about individual
    venues, attractions, or points of interest at a particular location.
    It returns opening hours, pricing, ratings, and popular visiting times.

    Good examples of usage:
      • search_places("Tokyo")        → returns top venues in Tokyo
      • search_places("Paris", "museum")  → returns museums in Paris
      • search_places("Bali", "dining")   → returns restaurants in Bali

    Do NOT use this tool for broad research questions (weather, visas,
    budgets) — use ``search_general`` for those.

    Note: This is currently a **mock implementation** that returns
    realistic simulated data.  It will be replaced with the Google
    Places API in production.

    Args:
        location:  The city or area to search for places in.
                   Example: "Kyoto", "Barcelona", "Cape Town".
        category:  Optional filter — e.g. "museum", "restaurant",
                   "adventure", "nightlife".  When omitted, returns a
                   mix of top-rated places.

    Returns:
        A formatted string listing places with their opening hours,
        pricing, rating, and best times to visit.
    """
    # Select places from the mock bank (in production, call Google Places API)
    places = _MOCK_PLACES.get(location.lower(), _MOCK_PLACES["default"])

    # If a category filter is provided, lightly simulate filtering
    if category:
        # Shuffle to give a sense of variety per category
        places = random.sample(places, k=min(3, len(places)))

    lines: list[str] = [f"📍 **Places in {location}**" + (f" ({category})" if category else "")]
    lines.append("—" * 40)

    for place in places:
        lines.append(
            f"• **{place['name']}**\n"
            f"  Hours: {place['opening_hours']}\n"
            f"  Price: {place['price_range']}\n"
            f"  Rating: {'⭐' * int(place['rating'])} ({place['rating']})\n"
            f"  Best time: {place['popular_times']}"
        )

    lines.append(
        "\n_Note: Data is simulated. Production will use the Google Places API._"
    )

    return "\n".join(lines)
