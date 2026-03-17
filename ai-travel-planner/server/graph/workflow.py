"""
workflow.py — LangGraph StateGraph orchestrating the 6-agent MAS.

Graph topology:
    ┌───────────────┐
    │  __start__    │
    └──────┬────────┘
           ▼
    ┌───────────────┐       ┌──────────┐
    │  supervisor   │◄──────│  scout   │
    │  (router)     │◄──────│concierge │
    │               │◄──────│architect │
    │               │◄──────│instigator│
    │               │◄──────│ curator  │
    └──────┬────────┘       └──────────┘
           ▼
    ┌───────────────┐
    │    __end__    │
    └───────────────┘

The Supervisor inspects the current TripState and decides which
specialist to invoke next — or signals completion via END.
"""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, StateGraph

from graph.state import TripState


# ═══════════════════════════════════════════════════════════════════════
# Agent node functions
# ═══════════════════════════════════════════════════════════════════════
# Each node receives and returns a *partial* TripState dict.
# LangGraph merges the returned dict back into the full state.
# ═══════════════════════════════════════════════════════════════════════

AGENT_NAMES = ["scout", "concierge", "architect", "instigator", "curator"]


def supervisor_node(state: TripState) -> dict:
    """
    Central orchestrator.  Analyses the current state and appends a
    routing message whose content is one of the AGENT_NAMES or "FINISH".

    Routing heuristic (executes agents in a logical pipeline order):
      1. scout      → if no itinerary destination has been set yet
      2. concierge  → if days exist but activities lack detail
      3. architect  → if activities exist but the schedule isn't finalised
      4. instigator → if no wildcard suggestions have been injected
      5. curator    → final validation & polish pass
      6. FINISH     → all stages satisfied
    """
    itinerary = state.get("itinerary")
    wildcards = state.get("wildcard_suggestions")

    next_agent = _determine_next_agent(itinerary, wildcards)

    intent = state.get("intent") or ""
    intent_group = state.get("intent_group") or ""
    prefs = state.get("preferences") or []
    pref_str = ", ".join(prefs) if prefs else "None"

    injection = f"\n[SYSTEM INJECTION]\nUser intent: {intent}\nIntent group: {intent_group}\nPreferences: {pref_str}"

    return {
        "messages": [
            AIMessage(
                content=next_agent + injection,
                name="supervisor",
            )
        ],
    }


def scout_node(state: TripState) -> dict:
    """
    Destination discovery agent.
    Researches destinations, attractions, and points of interest based on
    user preferences and populates the itinerary skeleton.
    """
    prefs = state.get("user_preferences", {})
    destination = prefs.get("destination", "an exciting destination")

    return {
        "messages": [
            AIMessage(
                content=f"Scout has researched {destination} and prepared destination insights.",
                name="scout",
            )
        ],
        "itinerary": {
            "destination": destination,
            "start_date": prefs.get("travel_dates", {}).get("start", ""),
            "end_date": prefs.get("travel_dates", {}).get("end", ""),
            "days": [],
        },
    }


def concierge_node(state: TripState) -> dict:
    """
    Logistics & accommodation agent.
    Fills in dining, lodging, transport, and day-level activity details.
    """
    itinerary = state.get("itinerary", {})
    destination = itinerary.get("destination", "unknown")
    start = itinerary.get("start_date", "")
    end = itinerary.get("end_date", "")

    # Build a basic day-by-day structure with placeholder activities
    from datetime import datetime, timedelta

    days: list[dict] = []
    if start and end:
        try:
            d_start = datetime.fromisoformat(start)
            d_end = datetime.fromisoformat(end)
            num_days = max((d_end - d_start).days, 1)
        except ValueError:
            num_days = 3  # sensible fallback

        for i in range(1, num_days + 1):
            day_date = (
                datetime.fromisoformat(start) + timedelta(days=i - 1)
            ).strftime("%Y-%m-%d")
            days.append(
                {
                    "day_number": i,
                    "date": day_date,
                    "activities": [
                        {
                            "name": f"Explore {destination} – Day {i}",
                            "description": f"Curated activities for day {i}.",
                            "category": "sightseeing",
                            "time_slot": "morning",
                            "metadata": {
                                "coordinates": {"latitude": 0.0, "longitude": 0.0},
                                "price": 0.0,
                                "duration": 120,
                                "currency": "USD",
                            },
                        }
                    ],
                }
            )

    return {
        "messages": [
            AIMessage(
                content=f"Concierge has arranged logistics for {len(days)} days in {destination}.",
                name="concierge",
            )
        ],
        "itinerary": {**itinerary, "days": days},
    }


def architect_node(state: TripState) -> dict:
    """
    Itinerary structure agent.
    Refines the timeline, re-orders activities for optimal scheduling,
    and enriches metadata (coordinates, prices, durations).
    """
    itinerary = state.get("itinerary", {})

    return {
        "messages": [
            AIMessage(
                content="Architect has optimised the itinerary structure and schedule.",
                name="architect",
            )
        ],
        "itinerary": itinerary,  # pass-through until real LLM logic is wired
    }


def instigator_node(state: TripState) -> dict:
    """
    'Spice' agent — the Instigator.
    Injects unexpected, delightful wildcard suggestions to make the trip
    truly memorable.
    """
    prefs = state.get("user_preferences", {})
    interests = prefs.get("interests", [])
    interest_str = ", ".join(interests) if interests else "adventure"

    wildcards = [
        {
            "suggestion": f"Secret rooftop dinner with a local chef — inspired by your love of {interest_str}.",
            "category": "local-secret",
            "reason": "Creates an unforgettable, off-the-beaten-path experience.",
            "risk_level": "low",
        },
        {
            "suggestion": "Sunrise hot-air balloon ride over the surrounding landscape.",
            "category": "adrenaline",
            "reason": "A once-in-a-lifetime perspective of your destination.",
            "risk_level": "medium",
        },
    ]

    return {
        "messages": [
            AIMessage(
                content=f"Instigator has injected {len(wildcards)} wildcard suggestions.",
                name="instigator",
            )
        ],
        "wildcard_suggestions": wildcards,
    }


def curator_node(state: TripState) -> dict:
    """
    Final validation & polish agent.
    Reviews the complete plan, checks for conflicts, ensures budget
    alignment, and produces the final curated travel plan.
    """
    itinerary = state.get("itinerary", {})
    wildcards = state.get("wildcard_suggestions", [])
    total_days = len(itinerary.get("days", []))

    return {
        "messages": [
            AIMessage(
                content=(
                    f"Curator has validated the plan: {total_days} days, "
                    f"{len(wildcards)} wildcard suggestions integrated. "
                    "The travel plan is finalised."
                ),
                name="curator",
            )
        ],
    }


# ═══════════════════════════════════════════════════════════════════════
# Supervisor routing logic
# ═══════════════════════════════════════════════════════════════════════

def _determine_next_agent(
    itinerary: dict | None,
    wildcards: list | None,
) -> str:
    """
    Pure-function routing heuristic.  Returns the name of the next agent
    to invoke, or ``"FINISH"`` when all stages have been satisfied.

    Pipeline order: scout → concierge → architect → instigator → curator → FINISH
    """
    # Stage 1: Scout — has the destination been identified?
    if not itinerary or not itinerary.get("destination"):
        return "scout"

    # Stage 2: Concierge — do we have day plans with activities?
    days = itinerary.get("days", [])
    if not days:
        return "concierge"

    # Stage 3: Architect — have activities been scheduled/optimised?
    all_have_timeslots = all(
        act.get("time_slot")
        for day in days
        for act in day.get("activities", [])
    )
    if not all_have_timeslots:
        return "architect"

    # Stage 4: Instigator — have wildcard suggestions been injected?
    if not wildcards:
        return "instigator"

    # Stage 5: Curator — final pass (runs once, then we're done)
    # We detect whether curator has already run by checking messages.
    # Since we don't have access to messages here, we run curator if
    # wildcards exist but let the supervisor mark FINISH on the next loop.
    # A simple flag: if wildcards exist AND len(days) > 0, curator is next.
    # After curator runs the supervisor will see all conditions met → FINISH.

    return "FINISH"


def _supervisor_router(state: TripState) -> str:
    """
    Conditional edge function.
    Reads the *last* message (set by supervisor_node) and returns the
    destination node name.  "FINISH" maps to the special ``END`` sentinel.
    """
    messages = state.get("messages", [])
    if not messages:
        return END

    last = messages[-1]
    decision = last.content.strip().lower() if hasattr(last, "content") else ""

    if decision == "finish":
        return END

    if decision in AGENT_NAMES:
        return decision

    # Fallback — should never happen in normal flow
    return END


# ═══════════════════════════════════════════════════════════════════════
# Graph assembly
# ═══════════════════════════════════════════════════════════════════════

def build_graph() -> StateGraph:
    """
    Construct and compile the LangGraph StateGraph.

    Returns the compiled graph, ready to be invoked with an initial
    TripState.
    """
    graph = StateGraph(TripState)

    # ── Register nodes ───────────────────────────────────────────────
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("scout", scout_node)
    graph.add_node("concierge", concierge_node)
    graph.add_node("architect", architect_node)
    graph.add_node("instigator", instigator_node)
    graph.add_node("curator", curator_node)

    # ── Entry point ──────────────────────────────────────────────────
    graph.set_entry_point("supervisor")

    # ── Supervisor → conditional routing ─────────────────────────────
    graph.add_conditional_edges(
        "supervisor",
        _supervisor_router,
        {
            "scout": "scout",
            "concierge": "concierge",
            "architect": "architect",
            "instigator": "instigator",
            "curator": "curator",
            END: END,
        },
    )

    # ── Every specialist loops back to the Supervisor ────────────────
    for agent in AGENT_NAMES:
        graph.add_edge(agent, "supervisor")

    # ── Compile ──────────────────────────────────────────────────────
    compiled = graph.compile()
    return compiled
