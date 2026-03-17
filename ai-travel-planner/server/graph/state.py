"""
TripState — the central data contract for the AI Travel Planner.

Every agent in the graph reads from and writes to this shared state.
Uses LangGraph's Annotated reducer pattern for the `messages` channel.
"""

from __future__ import annotations

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


# ── Coordinates ──────────────────────────────────────────────────────
class Coordinates(TypedDict):
    latitude: float
    longitude: float


# ── Activity Metadata ────────────────────────────────────────────────
class ActivityMetadata(TypedDict):
    coordinates: Coordinates
    price: float            # estimated cost in USD
    duration: int           # duration in minutes
    currency: str           # ISO 4217 currency code, e.g. "USD"


# ── Activity ─────────────────────────────────────────────────────────
class Activity(TypedDict):
    name: str
    description: str
    category: str           # e.g. "sightseeing", "dining", "adventure", "culture"
    time_slot: str          # e.g. "morning", "afternoon", "evening"
    metadata: ActivityMetadata


# ── Day Plan ─────────────────────────────────────────────────────────
class DayPlan(TypedDict):
    day_number: int
    date: str               # ISO 8601 date string, e.g. "2026-04-10"
    activities: list[Activity]


# ── Itinerary ────────────────────────────────────────────────────────
class Itinerary(TypedDict):
    destination: str
    start_date: str         # ISO 8601
    end_date: str           # ISO 8601
    days: list[DayPlan]


# ── User Preferences ────────────────────────────────────────────────
class UserPreferences(TypedDict):
    destination: str
    travel_dates: dict      # {"start": str, "end": str}
    budget: str             # "budget" | "mid-range" | "luxury"
    interests: list[str]    # e.g. ["history", "food", "nightlife"]
    group_size: int
    accommodation_type: str  # "hotel" | "hostel" | "airbnb" | "resort"


# ── Wildcard Suggestion (from Instigator / "Spice" agent) ───────────
class WildcardSuggestion(TypedDict):
    suggestion: str
    category: str           # e.g. "hidden-gem", "adrenaline", "local-secret"
    reason: str
    risk_level: str         # "low" | "medium" | "high"


# ── Central Graph State ─────────────────────────────────────────────
class TripState(TypedDict):
    """Root state shared across all agents in the LangGraph StateGraph."""

    messages: Annotated[list[BaseMessage], add_messages]
    itinerary: Itinerary
    user_preferences: UserPreferences
    wildcard_suggestions: list[WildcardSuggestion]
    
    # Strict contract fields
    intent: str
    intent_group: str
    preferences: list[str]
    status: str | None
    agent_logs: list[str] | None
    context: dict | None
