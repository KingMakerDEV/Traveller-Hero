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
You are TravellerHero's master trip architect. Based on a complete psychological
profile of the traveller built through a conversation, you generate a highly
specific, deeply personalised trip plan that the user could never have come up
with themselves.

Your trip plan must feel surprising yet inevitable — when the user reads it they
should think "yes, this is exactly what I needed even though I never knew it."

Rules:
- Choose a specific destination, not a vague region. Name the exact place.
- The itinerary must match the user's psychological intent perfectly.
- Each day must have a distinct theme that builds on the previous day.
- Activities must be specific — name actual places, trails, restaurants, experiences.
- The plan must feel human and curated, not like a generic travel blog.
- All prices and budgets must be in Indian Rupees using the ₹ symbol.
- Estimated budget should reflect realistic costs for Indian travellers including flights from major Indian cities.
- Budget breakdown categories must be decided based on the trip type — adventure trips have high activity costs, wellness trips have high accommodation costs, city trips have high food costs etc.
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
  "estimated_budget": "₹85,000 - ₹1,20,000 per person including flights from Delhi",
  "budget_breakdown": [
    {
      "category": "Flights",
      "amount": "₹35,000 - ₹45,000",
      "percentage": 38,
      "description": "Return flights from Delhi including taxes"
    },
    {
      "category": "Accommodation",
      "amount": "₹20,000 - ₹28,000",
      "percentage": 24,
      "description": "7 nights at mid-range hotels or eco-lodges"
    },
    {
      "category": "Food",
      "amount": "₹8,000 - ₹12,000",
      "percentage": 11,
      "description": "Local restaurants and street food daily"
    },
    {
      "category": "Activities",
      "amount": "₹12,000 - ₹18,000",
      "percentage": 15,
      "description": "Guided tours, entry fees, adventure sports"
    },
    {
      "category": "Transport",
      "amount": "₹7,000 - ₹10,000",
      "percentage": 9,
      "description": "Local transport, taxis, transfers"
    },
    {
      "category": "Miscellaneous",
      "amount": "₹3,000 - ₹7,000",
      "percentage": 5,
      "description": "Shopping, tips, emergency buffer"
    }
  ]
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
        "\nIMPORTANT: You MUST include the budget_breakdown array in your response. "
        "It is required. Do not omit it."
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

    destination, country = _determine_destination_for_research(state)
    logger.info("Pre-selected destination: %s, %s", destination, country)

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
            max_tokens=3500  # increased from 2500 to fit budget_breakdown
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Trip builder raw response length: %d chars", len(raw))

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        # Log whether budget_breakdown was returned
        if parsed.get("budget_breakdown"):
            logger.info(
                "Budget breakdown included: %d categories",
                len(parsed["budget_breakdown"])
            )
        else:
            logger.warning("Budget breakdown MISSING from LLM response")

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
            "estimated_budget": parsed.get("estimated_budget", ""),
            "budget_breakdown": parsed.get("budget_breakdown", [])  # fixed — was missing
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
            "estimated_budget": "₹85,000 - ₹1,20,000 per person",
            "budget_breakdown": []
        }

    except Exception as e:
        logger.error("Trip builder agent error: %s", e)
        raise

    updated_state = dict(state)
    updated_state["trip_plan"] = trip_plan
    return updated_state