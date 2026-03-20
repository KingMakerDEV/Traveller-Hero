"""
planner_state.py — Shared TypedDict state for the conversational trip planner.
Every agent and the workflow reads and writes to this structure.
"""

from typing import TypedDict, List, Optional, Any


class Question(TypedDict):
    """A single follow-up question with selectable options."""
    text: str
    options: List[str]


class TripDay(TypedDict):
    """A single day in the final trip itinerary."""
    day: int
    location: str
    theme: str
    activities: List[str]
    accommodation: str
    food: str


class BudgetCategory(TypedDict):
    """A single category in the budget breakdown."""
    category: str
    amount: str
    percentage: int
    description: str


class TripPlan(TypedDict):
    """The final completed trip plan returned to the user."""
    title: str
    destination: str
    country: str
    duration_days: int
    best_season: str
    summary: str
    days: List[TripDay]
    packing_tips: List[str]
    estimated_budget: str
    budget_breakdown: List[BudgetCategory]


class PlannerState(TypedDict):
    """
    Full conversation state stored per session.
    Persisted in session_store between round trips.
    """
    session_id: str
    intent: str
    intent_group: str
    preferences: List[str]

    # Conversation history as alternating question/answer pairs
    questions_asked: List[Question]
    answers_given: List[str]

    # How many questions have been asked so far
    question_count: int

    # Set to True by conversation agent when enough context is gathered
    ready_to_plan: bool

    # Populated by trip_builder agent when ready_to_plan is True
    trip_plan: Optional[TripPlan]

    # Internal scratchpad for the conversation agent
    context_summary: str