"""
edit_agent.py — Natural language trip editing agent.
Takes an existing trip plan and a user's natural language edit request.
Returns a modified version of the trip plan.
Uses Nvidia NIM (meta/llama-3.3-70b-instruct) via OpenAI-compatible endpoint.
"""

import json
import logging
import os
from openai import OpenAI
from graph.planner_state import TripPlan

logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ.get("NVIDIA_API_KEY")
    )


SYSTEM_PROMPT = """
You are TravellerHero's trip editing assistant. You receive an existing trip plan
in JSON format and a natural language edit request from the user.

Your job is to modify the trip plan according to the user's request while keeping
everything else intact. Be precise and surgical — only change what the user asked
to change. Do not invent new destinations or completely rewrite the plan unless
the user explicitly asks for it.

Examples of edit requests and what to change:
- "make it 5 days instead of 7" → reduce days array to 5, update duration_days
- "add more adventure activities" → update activities arrays in each day
- "change the accommodation to budget hostels" → update accommodation in each day
- "make it more family friendly" → adjust activities to suit families
- "add a beach day" → insert a new day with beach activities
- "remove the city tour on day 3" → modify day 3 activities
- "change destination to Bali" → update destination, country, and all day locations

Rules:
- Always return the complete modified trip plan in the same JSON structure
- Never return partial plans — always return all fields
- If the edit request is unclear, make the most reasonable interpretation
- Keep the same poetic title style unless the destination changed
- Always respond in valid JSON only. No markdown, no explanation, no extra text.
- All prices and budgets must be in Indian Rupees using the ₹ symbol.
- If the existing trip has USD prices, convert them to ₹ at 85 INR per USD.

Return the complete modified trip plan in this exact structure:
{
  "title": "...",
  "destination": "...",
  "country": "...",
  "duration_days": 7,
  "best_season": "...",
  "summary": "...",
  "days": [
    {
      "day": 1,
      "location": "...",
      "theme": "...",
      "activities": ["...", "...", "..."],
      "accommodation": "...",
      "food": "..."
    }
  ],
  "packing_tips": ["...", "...", "...", "..."],
  "estimated_budget": "..."
}
"""


def run_edit_agent(
    existing_trip: dict,
    edit_request: str
) -> dict:
    """
    Main entry point for the edit agent.
    Takes the existing trip plan dict and a natural language edit request string.
    Returns the modified trip plan as a dict.
    """
    logger.info("Edit agent running. Request: %s", edit_request[:100])

    client = _get_client()

    user_message = f"""
Here is the existing trip plan:

{json.dumps(existing_trip, indent=2)}

The user wants to make this change:
"{edit_request}"

Apply the change and return the complete modified trip plan in JSON.
"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            max_tokens=2500
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Edit agent raw response length: %d chars", len(raw))

        # Strip markdown code fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        # Validate all required fields are present
        required_fields = [
            "title", "destination", "country", "duration_days",
            "best_season", "summary", "days", "packing_tips",
            "estimated_budget"
        ]

        missing = [f for f in required_fields if f not in parsed]
        if missing:
            logger.error("Edit agent response missing fields: %s", missing)
            raise ValueError(f"Response missing required fields: {missing}")

        # Ensure duration_days matches actual days array length
        parsed["duration_days"] = len(parsed["days"])

        logger.info(
            "Edit agent complete. New plan: %s in %s (%d days)",
            parsed["title"],
            parsed["destination"],
            parsed["duration_days"]
        )

        return parsed

    except json.JSONDecodeError as e:
        logger.error("Edit agent JSON parse failed: %s", e)
        # Return original plan unchanged on parse failure
        logger.warning("Returning original plan unchanged due to parse error.")
        return existing_trip

    except Exception as e:
        logger.error("Edit agent error: %s", e)
        raise