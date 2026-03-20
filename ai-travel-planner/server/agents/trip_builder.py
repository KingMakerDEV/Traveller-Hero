
import json
import logging
import os
from openai import OpenAI
from graph.planner_state import PlannerState, TripPlan, TripDay

logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ.get("NVIDIA_API_KEY")
    )


SYSTEM_PROMPT = """
You are TravellerHero's master trip architect. You receive:
1. A complete psychological profile of the traveller built through conversation
2. Real-time research data from web searches about the destination

Your job is to use BOTH the traveller profile AND the research data to generate
a highly specific, deeply personalised trip plan grounded in real current information.

Rules:
- Choose a specific destination based on the traveller profile and research
- Use the research data to name real places, real restaurants, real activities
- Cross-reference the research with the traveller's psychological intent
- The itinerary must feel surprising yet inevitable
- Each day must have a distinct theme that builds on the previous day
- Activities must be specific — use real place names from the research
- The plan must feel human and curated, not like a generic travel blog
- All prices and budgets must be in Indian Rupees using the ₹ symbol
- Estimated budget should reflect realistic costs for Indian travellers
  including flights from major Indian cities
- Always respond in valid JSON only. No markdown, no explanation, no extra text.

Response format:
{
  "title": "A poetic name for this trip",
  "destination": "Specific city or region name",
  "country": "Country name",
  "duration_days": 7,
  "best_season": "October to March",
  "summary": "2-3 sentence emotional description of what this trip will feel like.",
  "days": [
    {
      "day": 1,
      "location": "Specific location for this day",
      "theme": "One word or short phrase theme for this day",
      "activities": [
        "Specific activity 1 with real place name",
        "Specific activity 2 with real place name",
        "Specific activity 3 with real place name"
      ],
      "accommodation": "Specific type or name of accommodation from research",
      "food": "Specific local dish or restaurant name from research"
    }
  ],
  "packing_tips": [
    "Tip 1",
    "Tip 2",
    "Tip 3",
    "Tip 4"
  ],
  "estimated_budget": "₹85,000 - ₹1,20,000 per person including flights from Delhi"
}
"""


def build_trip_prompt(state: PlannerState, research: dict) -> str:
    """
    Build the full context message for the trip builder LLM.
    Includes conversation history AND real-time research results.
    """
    lines = [
        f"Travel Intent: {state['intent']}",
        f"Intent Group: {state['intent_group']}",
    ]

    if state.get("preferences"):
        lines.append(f"Initial Preferences: {', '.join(state['preferences'])}")

    if state.get("budget_range"):
        lines.append(f"Budget Range: {state['budget_range']}")

    if state.get("group_size"):
        lines.append(f"Group Size: {state['group_size']}")

    if state.get("questions_asked"):
        lines.append("\nFull conversation:")
        for i, (q, a) in enumerate(
            zip(state["questions_asked"], state["answers_given"])
        ):
            lines.append(f"Q{i+1}: {q['text']}")
            lines.append(f"A{i+1}: {a}")

    if state.get("context_summary"):
        lines.append(f"\nPsychological profile summary: {state['context_summary']}")

    # Inject real-time research results
    if research:
        lines.append("\n" + "="*50)
        lines.append("REAL-TIME RESEARCH DATA (use this to ground your recommendations):")
        lines.append("="*50)

        if research.get("destination_overview"):
            lines.append("\nDestination Overview:")
            lines.append(research["destination_overview"][:800])

        if research.get("activities"):
            lines.append("\nActivities and Attractions:")
            lines.append(research["activities"][:800])

        if research.get("accommodation"):
            lines.append("\nAccommodation Options:")
            lines.append(research["accommodation"][:600])

        if research.get("food_and_tips"):
            lines.append("\nLocal Food and Travel Tips:")
            lines.append(research["food_and_tips"][:600])

    lines.append(
        "\nBased on the traveller profile AND the research data above, "
        "generate the perfect trip plan. Use real place names from the research. "
        "The destination should match both the psychological intent and the research findings."
    )

    return "\n".join(lines)


def _determine_destination_for_research(state: PlannerState) -> tuple[str, str]:
    """
    Makes a quick LLM call to determine the best destination
    before running searches, so research is targeted correctly.
    """
    client = _get_client()

    context = f"""
Intent: {state['intent']}
Intent Group: {state['intent_group']}
Preferences: {', '.join(state.get('preferences', []))}
Profile Summary: {state.get('context_summary', '')}
"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a travel expert. Based on the traveller profile, "
                        "suggest the single best destination. "
                        "Respond with ONLY a JSON object: "
                        '{"destination": "city name", "country": "country name"}'
                    )
                },
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_tokens=100
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        return parsed.get("destination", ""), parsed.get("country", "")

    except Exception as e:
        logger.error("Destination pre-selection failed: %s", e)
        return "", ""


def run_trip_builder_agent(state: PlannerState) -> PlannerState:
    """
    Main entry point called by the workflow.
    Step 1: Determine best destination via quick LLM call
    Step 2: Run targeted Tavily searches for that destination
    Step 3: Generate full trip plan using profile + research data
    """
    logger.info(
        "Trip builder agent running. Session: %s",
        state["session_id"]
    )

    # Step 1 — Determine destination for targeted research
    destination, country = _determine_destination_for_research(state)
    logger.info("Pre-selected destination: %s, %s", destination, country)

    # Step 2 — Run real-time research if Tavily is available
    research = {}
    if destination and os.environ.get("TAVILY_API_KEY"):
        try:
            from tools.search_tools import run_trip_research
            research = run_trip_research(
                destination=destination,
                country=country,
                intent=state["intent"],
                budget_range=state.get("budget_range", "mid-range"),
                duration_days=5,
                interests=state.get("preferences", [])
            )
            logger.info("Research complete. Keys: %s", list(research.keys()))
        except Exception as e:
            logger.error("Research failed, proceeding without it: %s", e)
            research = {}
    else:
        logger.warning(
            "Skipping research — destination empty or TAVILY_API_KEY not set"
        )

    # Step 3 — Generate trip plan with research context
    client = _get_client()
    user_message = build_trip_prompt(state, research)

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.8,
            max_tokens=2500
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Trip builder raw response length: %d chars", len(raw))

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        # Build validated TripPlan
        days: list[TripDay] = []
        for d in parsed.get("days", []):
            days.append({
                "day": d.get("day", 0),
                "location": d.get("location", ""),
                "theme": d.get("theme", ""),
                "activities": d.get("activities", []),
                "accommodation": d.get("accommodation", ""),
                "food": d.get("food", "")
            })

        trip_plan: TripPlan = {
            "title": parsed.get("title", "Your Perfect Escape"),
            "destination": parsed.get("destination", destination or ""),
            "country": parsed.get("country", country or ""),
            "duration_days": parsed.get("duration_days", 7),
            "best_season": parsed.get("best_season", ""),
            "summary": parsed.get("summary", ""),
            "days": days,
            "packing_tips": parsed.get("packing_tips", []),
            "estimated_budget": parsed.get("estimated_budget", "")
        }

        logger.info(
            "Trip plan generated: %s in %s",
            trip_plan["title"],
            trip_plan["destination"]
        )

    except json.JSONDecodeError as e:
        logger.error("Failed to parse trip builder JSON: %s", e)
        trip_plan: TripPlan = {
            "title": "Your Personalised Escape",
            "destination": destination or "To be revealed",
            "country": country or "Unknown",
            "duration_days": 7,
            "best_season": "Year round",
            "summary": "A trip crafted entirely around how you want to feel.",
            "days": [],
            "packing_tips": ["Travel light", "Stay curious"],
            "estimated_budget": "₹85,000 - ₹1,20,000 per person"
        }

    except Exception as e:
        logger.error("Trip builder agent error: %s", e)
        raise

    updated_state = dict(state)
    updated_state["trip_plan"] = trip_plan
    return updated_state