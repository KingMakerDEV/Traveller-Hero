"""
conversation.py — Conversational agent that generates follow-up questions.
Uses Nvidia NIM (google/gemma-2-27b-it) via OpenAI-compatible endpoint.
Decides when enough context has been gathered to build the trip plan.
"""

import json
import logging
import os
from openai import OpenAI
from graph.planner_state import PlannerState, Question

logger = logging.getLogger(__name__)

# Nvidia NIM uses an OpenAI-compatible API
def _get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ.get("NVIDIA_API_KEY")
    )

# Maximum questions before forcing trip generation
MAX_QUESTIONS = 5

SYSTEM_PROMPT = """
You are TravellerHero's AI travel intent analyst. Your job is to ask the user
focused follow-up questions to understand exactly what kind of trip will make
them feel the way they want to feel — not just where they want to go.

You receive the user's travel intent, their previous answers, and how many
questions have already been asked. Based on this you do one of two things:

1. Ask ONE more follow-up question with exactly 4 options for the user to pick from.
2. Decide you have enough context and signal that the trip plan can be generated.

Rules:
- Ask questions that reveal psychological preference, not just logistics.
- Each question must narrow down the destination or experience meaningfully.
- Never repeat a question already asked.
- After 4 or more questions, only ask another if it is truly essential.
- If you have enough context after any question (minimum 3 answered), you may signal ready.
- Options must be concrete and distinct — no vague options like "somewhere nice".
- Always respond in valid JSON only. No extra text, no markdown, no explanation.

Response format when asking a question:
{
  "ready_to_plan": false,
  "question": {
    "text": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  },
  "context_summary": "Brief internal note about what you now know about the user."
}

Response format when ready to plan:
{
  "ready_to_plan": true,
  "question": null,
  "context_summary": "Full summary of everything learned about the user's ideal trip."
}
"""


def build_user_message(state: PlannerState) -> str:
    """Build the message describing the current conversation state to the LLM."""
    lines = [
        f"Travel Intent: {state['intent']}",
        f"Intent Group: {state['intent_group']}",
    ]

    if state["preferences"]:
        lines.append(f"User Preferences: {', '.join(state['preferences'])}")
    else:
        lines.append("User Preferences: None provided")

    lines.append(f"Questions asked so far: {state['question_count']}")

    if state["questions_asked"]:
        lines.append("\nConversation so far:")
        for i, (q, a) in enumerate(
            zip(state["questions_asked"], state["answers_given"])
        ):
            lines.append(f"Q{i+1}: {q['text']}")
            lines.append(f"A{i+1}: {a}")

    if state["context_summary"]:
        lines.append(f"\nContext so far: {state['context_summary']}")

    # Force ready signal if max questions reached
    if state["question_count"] >= MAX_QUESTIONS:
        lines.append(
            "\nIMPORTANT: You have reached the maximum number of questions. "
            "You MUST respond with ready_to_plan: true now."
        )

    return "\n".join(lines)


def run_conversation_agent(state: PlannerState) -> PlannerState:
    """
    Main entry point called by the workflow.
    Calls the LLM and updates state with either a new question or ready_to_plan=True.
    """
    logger.info(
        "Conversation agent running. Session: %s, Q count: %d",
        state["session_id"],
        state["question_count"]
    )

    client = _get_client()
    user_message = build_user_message(state)

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=600
        )

        raw = response.choices[0].message.content.strip()
        logger.info("Conversation agent raw response: %s", raw)

        # Strip markdown code fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

    except json.JSONDecodeError as e:
        logger.error("Failed to parse conversation agent JSON: %s", e)
        # Fallback question to avoid crashing the session
        parsed = {
            "ready_to_plan": False,
            "question": {
                "text": "What type of environment makes you feel most at peace?",
                "options": [
                    "Mountains and forests",
                    "Ocean and beaches",
                    "Countryside and open fields",
                    "Cities with culture and history"
                ]
            },
            "context_summary": state["context_summary"]
        }

    except Exception as e:
        logger.error("Conversation agent error: %s", e)
        raise

    # Update state
    updated_state = dict(state)
    updated_state["ready_to_plan"] = parsed.get("ready_to_plan", False)
    updated_state["context_summary"] = parsed.get("context_summary", state["context_summary"])

    if not parsed["ready_to_plan"] and parsed.get("question"):
        question: Question = {
            "text": parsed["question"]["text"],
            "options": parsed["question"]["options"]
        }
        updated_state["questions_asked"] = list(state["questions_asked"]) + [question]
        updated_state["question_count"] = state["question_count"] + 1
        logger.info("New question generated: %s", question["text"])

    return updated_state