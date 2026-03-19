"""
trip_builder.py — Agent that generates the final trip plan.
Called only when conversation agent sets ready_to_plan = True.
Uses Nvidia NIM (google/gemma-2-27b-it) via OpenAI-compatible endpoint.
"""

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
        "Specific activity 1",
        "Specific activity 2",
        "Specific activity 3"
      ],
      "accommodation": "Specific type or name of accommodation",
      "food": "Specific local dish or restaurant recommendation"
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


def build_trip_prompt(state: PlannerState) -> str:
    """Build the full context message for the trip builder LLM."""
    lines = [
        f"Travel Intent: {state['intent']}",
        f"Intent Group: {state['intent_group']}",
    ]

    if state["preferences"]:
        lines.append(f"Initial Preferences: {', '.join(state['preferences'])}")

    if state["questions_asked"]:
        lines.append("\nFull conversation:")
        for i, (q, a) in enumerate(
            zip(state["questions_asked"], state["answers_given"])
        ):
            lines.append(f"Q{i+1}: {q['text']}")
            lines.append(f"A{i+1}: {a}")

    if state["context_summary"]:
        lines.append(f"\nPsychological profile summary: {state['context_summary']}")

    lines.append(
        "\nBased on everything above, generate the perfect trip plan for this person."
        " Make it specific, surprising, and emotionally resonant."
        " The destination should not be the most obvious choice for their intent"
        " — find the hidden gem that fits them perfectly."
    )

    return "\n".join(lines)


def run_trip_builder_agent(state: PlannerState) -> PlannerState:
    """
    Main entry point called by the workflow.
    Generates the final TripPlan and stores it in state.
    """
    logger.info(
        "Trip builder agent running. Session: %s",
        state["session_id"]
    )

    client = _get_client()
    user_message = build_trip_prompt(state)

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.8,
            max_tokens=2000
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Trip builder raw response length: %d chars", len(raw))

        # Strip markdown code fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        # Validate and build TripPlan
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
            "destination": parsed.get("destination", ""),
            "country": parsed.get("country", ""),
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
        # Fallback minimal plan to avoid crashing the session
        trip_plan: TripPlan = {
            "title": "Your Personalised Escape",
            "destination": "To be revealed",
            "country": "Unknown",
            "duration_days": 7,
            "best_season": "Year round",
            "summary": "A trip crafted entirely around how you want to feel.",
            "days": [],
            "packing_tips": ["Travel light", "Stay curious"],
            "estimated_budget": "Varies by destination"
        }

    except Exception as e:
        logger.error("Trip builder agent error: %s", e)
        raise

    updated_state = dict(state)
    updated_state["trip_plan"] = trip_plan
    return updated_state