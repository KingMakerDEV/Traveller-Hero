

import concurrent.futures
import logging
import os
import traceback

# Load environment variables FIRST before anything else reads os.getenv()
from dotenv import load_dotenv
load_dotenv()

print("\n--- BACKEND INSTANCE STARTED ---")
print("__file__:", __file__)
print("CWD:", os.getcwd())
print("PID:", os.getpid())
print("--------------------------------\n")

from flask import Flask, jsonify, request
from flask_cors import CORS
from langchain_core.messages import HumanMessage

from graph.state import TripState
from graph.workflow import build_graph
from routes.feedback import feedback_bp
from routes.planner import planner_bp

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

print("--- ENVIRONMENT VERIFICATION ---")
print("ENV SMTP_USER =", os.getenv("SMTP_USER"))
print("ENV SMTP_PASS =", os.getenv("SMTP_PASS")[:10] + "..." if os.getenv("SMTP_PASS") else None)
print("ENV SMTP_SENDER_EMAIL =", os.getenv("SMTP_SENDER_EMAIL"))
print("--------------------------------")

# Initialize Flask
app = Flask(__name__)

# Enable Universal CORS — supports_credentials must NOT be used with wildcard origin
# CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, resources={r"/*": {"origins": [
    "https://traveller-hero.vercel.app",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080"
]}})
# Register Blueprints
app.register_blueprint(feedback_bp)
app.register_blueprint(planner_bp)


# Compile the LangGraph workflow once globally
try:
    logger.info("Compiling LangGraph workflow...")
    master_graph = build_graph()
    logger.info("LangGraph workflow compiled successfully.")
except Exception as e:
    logger.error("Failed to compile LangGraph workflow: %s", e)
    master_graph = None

@app.before_request
def log_all_requests():
    print(f"REQUEST: {request.method} {request.path}")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        "status": "healthy",
        "graph_loaded": master_graph is not None,
        "openai_key_set": bool(os.getenv("NVIDIA_API_KEY"))
    }), 200


@app.route("/plan", methods=["POST"])
def plan_trip_new():
    if not master_graph:
        return jsonify({"error": "LangGraph workflow is not initialized."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided."}), 400

    intent = data.get("intent")
    intent_group = data.get("intent_group")
    preferences = data.get("preferences", [])

    if not intent or not intent_group:
        return jsonify({"error": "Missing intent or intent_group"}), 400

    # Verify intent belongs to intent_group
    VALID_GROUPS = {
        "High-Energy & Stimulation": ["Adrenaline", "Discovery", "Social Pulse"],
        "Restoration & Wellness": ["Peace & Serenity", "Digital Detox", "Rejuvenation"],
        "Connection & Kinship": ["Family Bonding", "Romantic Escape", "Heritage & Roots"],
        "Tactical & Pragmatic": ["The Quick Break", "Wanderlust", "Road Trip"]
    }

    if intent_group not in VALID_GROUPS or intent not in VALID_GROUPS[intent_group]:
        return jsonify({"error": f"Intent '{intent}' does not belong to group '{intent_group}'"}), 400

    dummy_response = {
        "intent": intent,
        "intent_group": intent_group,
        "preferences": preferences,
        "itinerary": [
            {"day": 1, "activities": ["Arrival and checking in", f"Explore using {intent} theme"]},
            {"day": 2, "activities": ["Main activity day based on preferences"]}
        ],
        "wildcards": [{"id": "mock-1", "title": "Mock surprise", "description": "This is a mock wildcard"}],
        "status": "completed",
        "agent_logs": ["Mock execution returned immediately."],
        "context": {}
    }

    if os.environ.get("PLANNER_MODE") == "mock":
        return jsonify(dummy_response), 200

    # Build the initial TripState (matching strict contract)
    initial_state = {
        "messages": [HumanMessage(content=f"Please plan a trip based on this intent: {intent}")],
        "itinerary": {"destination": "To Be Decided", "start_date": "", "end_date": "", "days": []},
        "user_preferences": {"destination": "", "travel_dates": {}, "budget": "", "interests": preferences, "group_size": 1, "accommodation_type": ""},
        "wildcard_suggestions": [],
        "intent": intent,
        "intent_group": intent_group,
        "preferences": preferences,
        "status": "running",
        "agent_logs": [],
        "context": {}
    }

    def run_graph():
        return master_graph.invoke(initial_state)

    try:
        logger.info(f"Starting trip generation for intent {intent}...")

        # 10s Timeout Wrapper
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(run_graph)
            final_state = future.result(timeout=10.0)

        logger.info(f"Trip generation completed successfully.")

        serializable_state = {
            "intent": final_state.get("intent", intent),
            "intent_group": final_state.get("intent_group", intent_group),
            "preferences": final_state.get("preferences", preferences),
            "itinerary": final_state.get("itinerary", {}).get("days", []),
            "wildcards": final_state.get("wildcard_suggestions", []),
            "status": "completed",
            "agent_logs": final_state.get("agent_logs", []),
            "context": final_state.get("context", {})
        }
        return jsonify(serializable_state), 200

    except concurrent.futures.TimeoutError:
        logger.warning(f"Timeout of 10s reached. Falling back to mock data.")
        return jsonify(dummy_response), 200
    except Exception as e:
        logger.error(f"Error during graph invocation: {traceback.format_exc()}")
        dummy_response["status"] = "error"
        dummy_response["agent_logs"] = [f"Error: {str(e)}"]
        return jsonify(dummy_response), 500


if __name__ == "__main__":
    # Run the development server
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)