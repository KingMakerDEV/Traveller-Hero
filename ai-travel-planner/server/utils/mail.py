import os
import threading
import logging
import requests

logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _get_brevo_headers() -> dict:
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": os.environ.get("BREVO_API_KEY", "")
    }


def _send_brevo(payload: dict) -> bool:
    """Core Brevo HTTP API sender used by all email functions."""
    api_key = os.environ.get("BREVO_API_KEY")
    if not api_key:
        print("ERROR: BREVO_API_KEY not set")
        return False

    try:
        response = requests.post(
            BREVO_URL,
            json=payload,
            headers=_get_brevo_headers(),
            timeout=15
        )
        if response.status_code in (200, 201):
            print(f"EMAIL SENT: {payload.get('subject')}")
            return True
        else:
            print(f"BREVO ERROR: {response.status_code} — {response.text}")
            return False
    except requests.Timeout:
        print("BREVO ERROR: Request timed out")
        return False
    except Exception as e:
        print(f"BREVO GENERAL ERROR: {e}")
        return False


# ─────────────────────────────────────────────
# HTML Templates
# ─────────────────────────────────────────────

def _base_html(content: str) -> str:
    """Wraps email content in TravellerHero branded HTML shell."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TravellerHero</title>
</head>
<body style="margin:0;padding:0;background-color:#0A1F1C;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1F1C;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0D2623;border:1px solid rgba(230,196,25,0.15);border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A1F1C;padding:32px 40px;border-bottom:2px solid #e6c419;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#e6c419;font-family:monospace;">Traveller Hero</p>
              <h1 style="margin:8px 0 0;font-size:28px;color:#e6c419;font-style:italic;letter-spacing:-1px;">TravellerHero</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              {content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:11px;color:#4a5568;font-family:monospace;letter-spacing:0.2em;">
                © 2026 TRAVELLERHERO — YOU DON'T KNOW WHERE TO GO. WE DO.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _welcome_html(full_name: str) -> str:
    first_name = full_name.split()[0] if full_name else "Traveller"
    content = f"""
      <h2 style="margin:0 0 8px;font-size:32px;color:#ffffff;font-style:italic;">
        Welcome, {first_name}.
      </h2>
      <p style="margin:0 0 32px;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#e6c419;font-family:monospace;">
        Your expedition begins now
      </p>

      <div style="border-left:3px solid #e6c419;padding-left:20px;margin-bottom:32px;">
        <p style="margin:0;font-size:18px;color:#d1cfc9;font-style:italic;line-height:1.7;font-weight:300;">
          "You don't know where you want to go. That's exactly why you're here."
        </p>
      </div>

      <p style="font-size:16px;color:#a09f9b;line-height:1.8;margin:0 0 16px;">
        TravellerHero uses AI to understand how you want to <em style="color:#e6c419;">feel</em> on your next trip —
        not just where you want to go. Answer a few questions and we'll build a trip plan so specific,
        so personal, you'll wonder how you ever travelled without it.
      </p>

      <p style="font-size:16px;color:#a09f9b;line-height:1.8;margin:0 0 40px;">
        Your first adventure is one click away.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 auto 40px;">
        <tr>
          <td style="background-color:#e6c419;border-radius:50px;padding:18px 48px;text-align:center;">
            <a href="https://traveller-hero.vercel.app/planner"
               style="color:#0A1F1C;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;">
              Start Planning →
            </a>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="text-align:center;padding:20px 10px;border:1px solid rgba(230,196,25,0.1);border-radius:8px;">
            <p style="margin:0 0 4px;font-size:20px;">🗺️</p>
            <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;color:#e6c419;">AI Planning</p>
          </td>
          <td width="4%"></td>
          <td width="33%" style="text-align:center;padding:20px 10px;border:1px solid rgba(230,196,25,0.1);border-radius:8px;">
            <p style="margin:0 0 4px;font-size:20px;">🔍</p>
            <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;color:#e6c419;">Real Research</p>
          </td>
          <td width="4%"></td>
          <td width="33%" style="text-align:center;padding:20px 10px;border:1px solid rgba(230,196,25,0.1);border-radius:8px;">
            <p style="margin:0 0 4px;font-size:20px;">✈️</p>
            <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;color:#e6c419;">Book & Go</p>
          </td>
        </tr>
      </table>
    """
    return _base_html(content)


def _booking_confirmation_html(
    full_name: str,
    trip_title: str,
    destination: str,
    country: str,
    duration_days: int,
    estimated_budget: str,
    slug: str
) -> str:
    first_name = full_name.split()[0] if full_name else "Traveller"
    trip_url = f"https://traveller-hero.vercel.app/trip/{slug}"

    content = f"""
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#e6c419;font-family:monospace;">
        Mission Confirmed
      </p>
      <h2 style="margin:0 0 32px;font-size:32px;color:#ffffff;font-style:italic;">
        Your trip is saved, {first_name}.
      </h2>

      <!-- Trip Summary Card -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#142A27;border:1px solid rgba(230,196,25,0.2);border-radius:12px;margin-bottom:32px;overflow:hidden;">
        <tr>
          <td style="padding:8px 24px;background-color:rgba(230,196,25,0.08);border-bottom:1px solid rgba(230,196,25,0.15);">
            <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:0.3em;text-transform:uppercase;color:#e6c419;">
              Your Expedition
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h3 style="margin:0 0 4px;font-size:24px;color:#ffffff;font-style:italic;">{trip_title}</h3>
            <p style="margin:0 0 24px;font-size:14px;color:#a09f9b;font-family:monospace;">
              {destination}, {country}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:10px;font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;color:#e6c419;">
                    Duration
                  </p>
                  <p style="margin:0;font-size:16px;color:#ffffff;font-weight:bold;">{duration_days} Days</p>
                </td>
                <td width="50%" style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:10px;font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;color:#e6c419;">
                    Est. Budget
                  </p>
                  <p style="margin:0;font-size:16px;color:#ffffff;font-weight:bold;">{estimated_budget}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
        <tr>
          <td style="background-color:#e6c419;border-radius:50px;padding:18px 48px;text-align:center;">
            <a href="{trip_url}"
               style="color:#0A1F1C;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;">
              View Full Itinerary →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:14px;color:#4a5568;text-align:center;margin:0;font-family:monospace;letter-spacing:0.1em;">
        Ready to book hotels and flights? Visit your trip page to get started.
      </p>
    """
    return _base_html(content)


# ─────────────────────────────────────────────
# Public Email Functions
# ─────────────────────────────────────────────

def _send_email_via_api(name: str, email: str, message: str) -> bool:
    """Sends feedback email using Brevo HTTP API."""
    api_key = os.environ.get("BREVO_API_KEY")
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    receiver = os.environ.get("FEEDBACK_RECEIVER_EMAIL")

    if not all([api_key, sender_email, receiver]):
        print("ERROR: Missing BREVO_API_KEY, SMTP_SENDER_EMAIL, or FEEDBACK_RECEIVER_EMAIL")
        return False

    payload = {
        "sender": {"name": "TravellerHero Feedback", "email": sender_email},
        "to": [{"email": receiver}],
        "replyTo": {"email": email, "name": name},
        "subject": f"New Feedback from {name}",
        "textContent": f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
    }

    try:
        print(f"SENDING EMAIL VIA API: To={receiver}, From={sender_email}")
        response = requests.post(
            BREVO_URL,
            json=payload,
            headers=_get_brevo_headers(),
            timeout=15
        )
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
    """Entry point to send feedback email. Validates config before spawning thread."""
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


def send_welcome_email(full_name: str, user_email: str) -> None:
    """
    Sends branded HTML welcome email to a new user.
    Called once on first login. Runs in background thread.
    """
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    if not sender_email:
        print("WELCOME EMAIL: SMTP_SENDER_EMAIL not set")
        return

    payload = {
        "sender": {"name": "TravellerHero", "email": sender_email},
        "to": [{"email": user_email, "name": full_name}],
        "subject": "Welcome to TravellerHero — Your Expedition Begins",
        "htmlContent": _welcome_html(full_name)
    }

    def _send():
        result = _send_brevo(payload)
        if result:
            print(f"WELCOME EMAIL SENT: {user_email}")
        else:
            print(f"WELCOME EMAIL FAILED: {user_email}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()


def send_booking_confirmation_email(
    full_name: str,
    user_email: str,
    trip_title: str,
    destination: str,
    country: str,
    duration_days: int,
    estimated_budget: str,
    slug: str
) -> None:
    """
    Sends branded HTML booking confirmation email after a trip is saved.
    Runs in background thread.
    """
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    if not sender_email:
        print("BOOKING EMAIL: SMTP_SENDER_EMAIL not set")
        return

    payload = {
        "sender": {"name": "TravellerHero", "email": sender_email},
        "to": [{"email": user_email, "name": full_name}],
        "subject": f"Mission Confirmed — {trip_title}",
        "htmlContent": _booking_confirmation_html(
            full_name, trip_title, destination,
            country, duration_days, estimated_budget, slug
        )
    }

    def _send():
        result = _send_brevo(payload)
        if result:
            print(f"BOOKING EMAIL SENT: {user_email} — {trip_title}")
        else:
            print(f"BOOKING EMAIL FAILED: {user_email}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()