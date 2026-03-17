from flask import Blueprint, request, jsonify
import traceback
from utils.mail import send_feedback_email

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/feedback", methods=["POST", "OPTIONS"])
def submit_feedback():
    """
    Endpoint for users to submit feedback.
    Validates input and triggers a non-blocking email.
    """
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    print("\n--- FEEDBACK ROUTE HIT ---")
    print("METHOD:", request.method)
    print("HEADERS:", dict(request.headers))

    try:
        raw_data = request.get_data()
        print("RAW DATA:", raw_data)

        data = request.get_json(force=True, silent=True)
        print("JSON:", data)

        if not data:
            print("ERROR: No JSON payload provided")
            return jsonify({"ok": False, "error": "No payload provided"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        message = data.get("message", "").strip()

        if not all([name, email, message]):
            print(f"ERROR: Missing fields. Name: {bool(name)}, Email: {bool(email)}, Msg: {bool(message)}")
            return jsonify({"ok": False, "error": "Name, email, and message are required"}), 400

        if not send_feedback_email(name, email, message):
            print("ERROR: Mail service not configured on server")
            return jsonify({"ok": False, "error": "Mail service not configured on server"}), 503

        print("FEEDBACK ROUTE SUCCESS: Triggered background thread")
        return jsonify({"ok": True}), 200

    except Exception as e:
        print("FEEDBACK ROUTE ERROR:", e)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500