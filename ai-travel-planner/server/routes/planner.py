"""
planner.py — Flask Blueprint exposing the conversational trip planner API.

POST /plan/start  — Begin a new planning session with intent and preferences.
POST /plan/answer — Submit a user's answer and get the next question or final plan.
"""

import logging
import traceback
from flask import Blueprint, request, jsonify
from graph.planner_state import PlannerState
from graph.planner_workflow import planner_graph
from utils.session_store import session_store

logger = logging.getLogger(__name__)

planner_bp = Blueprint("planner", __name__)


@planner_bp.route("/plan/start", methods=["POST", "OPTIONS"])
def start_planning():
    """
    Start a new planning conversation.
    Expects: { intent, intent_group, preferences[] }
    Returns: { session_id, type: "question", question: { text, options[] } }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- PLAN START ROUTE HIT ---")

    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        intent = data.get("intent", "").strip()
        intent_group = data.get("intent_group", "").strip()
        preferences = data.get("preferences", [])

        if not intent or not intent_group:
            return jsonify({"error": "intent and intent_group are required"}), 400

        print(f"Starting session: intent={intent}, group={intent_group}")

        # Build fresh initial state
        initial_state: PlannerState = {
            "session_id": "",  # Will be filled after session creation
            "intent": intent,
            "intent_group": intent_group,
            "preferences": preferences if isinstance(preferences, list) else [],
            "questions_asked": [],
            "answers_given": [],
            "question_count": 0,
            "ready_to_plan": False,
            "trip_plan": None,
            "context_summary": ""
        }

        # Create session and get session_id
        session_id = session_store.create_session(initial_state)

        # Inject session_id into state and update
        initial_state["session_id"] = session_id
        session_store.update_session(session_id, initial_state)

        # Run the conversation agent to get the first question
        result_state = planner_graph.invoke(initial_state)

        # Persist updated state
        session_store.update_session(session_id, result_state)

        # Get the last question generated
        if not result_state["questions_asked"]:
            return jsonify({"error": "Agent failed to generate opening question"}), 500

        last_question = result_state["questions_asked"][-1]

        print(f"Session {session_id}: First question generated: {last_question['text']}")

        return jsonify({
            "session_id": session_id,
            "type": "question",
            "question": {
                "text": last_question["text"],
                "options": last_question["options"]
            }
        }), 200

    except Exception as e:
        print("PLAN START ERROR:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@planner_bp.route("/plan/answer", methods=["POST", "OPTIONS"])
def submit_answer():
    """
    Submit the user's answer to the current question.
    Expects: { session_id, answer }
    Returns either:
      { type: "question", question: { text, options[] } }
      { type: "complete", trip: TripPlan }
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- PLAN ANSWER ROUTE HIT ---")

    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        session_id = data.get("session_id", "").strip()
        answer = data.get("answer", "").strip()

        if not session_id or not answer:
            return jsonify({"error": "session_id and answer are required"}), 400

        print(f"Answer received for session {session_id}: {answer}")

        # Load existing session state
        state = session_store.get_session(session_id)

        if state is None:
            return jsonify({
                "error": "Session not found or expired. Please start a new session."
            }), 404

        # Append the user's answer to state
        updated_state = dict(state)
        updated_state["answers_given"] = list(state["answers_given"]) + [answer]

        # Run the graph — conversation agent decides next question or ready_to_plan
        result_state = planner_graph.invoke(updated_state)

        # Persist updated state
        session_store.update_session(session_id, result_state)

        # If trip is complete return it and clean up session
        if result_state.get("trip_plan") is not None:
            trip = result_state["trip_plan"]
            session_store.delete_session(session_id)
            print(f"Session {session_id}: Trip plan complete — {trip['title']}")
            return jsonify({
                "type": "complete",
                "trip": trip
            }), 200

        # Otherwise return the next question
        if not result_state["questions_asked"]:
            return jsonify({"error": "Agent failed to generate next question"}), 500

        last_question = result_state["questions_asked"][-1]
        print(f"Session {session_id}: Next question — {last_question['text']}")

        return jsonify({
            "type": "question",
            "question": {
                "text": last_question["text"],
                "options": last_question["options"]
            }
        }), 200

    except Exception as e:
        print("PLAN ANSWER ERROR:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500