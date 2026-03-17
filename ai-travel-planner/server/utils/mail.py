import smtplib
import os
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

def _send_email_sync(name, email, message):
    """Internal synchronous function to handle SMTP connection and sending."""
    smtp_host = str(os.environ.get("SMTP_HOST", "smtp-relay.brevo.com"))
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    receiver = os.environ.get("FEEDBACK_RECEIVER_EMAIL")

    if not all([smtp_user, smtp_pass, sender_email, receiver]):
        print("ERROR: SMTP configuration missing in environment variables.")
        return False

    smtp_user = str(smtp_user)
    smtp_pass = str(smtp_pass)
    sender_email = str(sender_email)
    receiver = str(receiver)

    try:
        print(f"SENDING EMAIL: To={receiver}, From={sender_email}")

        msg = MIMEMultipart()
        msg['From'] = f"TravellerHero Feedback <{sender_email}>"
        msg['To'] = receiver
        msg['Subject'] = f"New Feedback from {name}"
        msg['Reply-To'] = email

        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, 'plain'))

        print(f"CONNECTING SMTP: {smtp_host}:{smtp_port} (timeout=15s)")
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.set_debuglevel(1)

            server.ehlo()
            print("STARTING TLS...")
            server.starttls()
            server.ehlo()

            print("LOGIN USER:", smtp_user)
            server.login(smtp_user, smtp_pass)
            print("SMTP LOGIN OK")

            server.send_message(msg)

        print("EMAIL SENT SUCCESSFULLY")
        return True

    except smtplib.SMTPAuthenticationError:
        print("SMTP ERROR: Authentication failed. Check SMTP_USER and SMTP_PASS.")
        return False
    except smtplib.SMTPConnectError:
        print(f"SMTP ERROR: Connection failed to {smtp_host}:{smtp_port}.")
        return False
    except Exception as e:
        print(f"SMTP GENERAL ERROR: {e}")
        return False


def send_feedback_email(name, email, message):
    """
    Entry point to send feedback email.
    Validates environment BEFORE spawning thread.
    Returns False if misconfigured, allowing the route to return 503.
    """
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    sender_email = os.environ.get("SMTP_SENDER_EMAIL")
    receiver = os.environ.get("FEEDBACK_RECEIVER_EMAIL")

    missing = []
    if not smtp_user: missing.append("SMTP_USER")
    if not smtp_pass: missing.append("SMTP_PASS")
    if not sender_email: missing.append("SMTP_SENDER_EMAIL")
    if not receiver: missing.append("FEEDBACK_RECEIVER_EMAIL")

    if missing:
        print(f"CRITICAL: Missing SMTP Config: {', '.join(missing)}")
        return False

    thread = threading.Thread(
        target=_send_email_sync,
        args=(name, email, message),
        daemon=True
    )
    thread.start()
    return True