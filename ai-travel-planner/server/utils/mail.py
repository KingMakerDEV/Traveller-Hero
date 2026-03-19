import os
import threading
import logging
import requests

logger = logging.getLogger(__name__)


def _send_email_via_api(name: str, email: str, message: str) -> bool:
    """
    Sends feedback email using Brevo HTTP API.
    Not affected by IP restrictions unlike SMTP.
    """
    api_key = os.environ.get("BREVO_API_KEY")
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    receiver = os.environ.get("FEEDBACK_RECEIVER_EMAIL")

    if not all([api_key, sender_email, receiver]):
        print("ERROR: Missing BREVO_API_KEY, SMTP_SENDER_EMAIL, or FEEDBACK_RECEIVER_EMAIL")
        return False

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }

    payload = {
        "sender": {
            "name": "TravellerHero Feedback",
            "email": sender_email
        },
        "to": [
            {"email": receiver}
        ],
        "replyTo": {
            "email": email,
            "name": name
        },
        "subject": f"New Feedback from {name}",
        "textContent": f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
    }

    try:
        print(f"SENDING EMAIL VIA API: To={receiver}, From={sender_email}")
        response = requests.post(url, json=payload, headers=headers, timeout=15)

        if response.status_code in (200, 201):
            print("EMAIL SENT SUCCESSFULLY via Brevo API")
            return True
        else:
            print(f"BREVO API ERROR: {response.status_code} — {response.text}")
            return False

    except requests.Timeout:
        print("BREVO API ERROR: Request timed out after 15s")
        return False
    except Exception as e:
        print(f"BREVO API GENERAL ERROR: {e}")
        return False


def send_feedback_email(name: str, email: str, message: str) -> bool:
    """
    Entry point to send feedback email via Brevo HTTP API.
    Validates environment BEFORE spawning thread.
    Returns False if misconfigured, allowing the route to return 503.
    """
    api_key = os.environ.get("BREVO_API_KEY")
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    receiver = os.environ.get("FEEDBACK_RECEIVER_EMAIL")

    missing = []
    if not api_key: missing.append("BREVO_API_KEY")
    if not sender_email: missing.append("SMTP_SENDER_EMAIL")
    if not receiver: missing.append("FEEDBACK_RECEIVER_EMAIL")

    if missing:
        print(f"CRITICAL: Missing config: {', '.join(missing)}")
        return False

    thread = threading.Thread(
        target=_send_email_via_api,
        args=(name, email, message),
        daemon=True
    )
    thread.start()
    return True
