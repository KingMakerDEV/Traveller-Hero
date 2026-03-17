import os
import sys
from dotenv import load_dotenv

# Add current dir to path so utils.mail can be imported
sys.path.append(os.getcwd())

load_dotenv()

from utils.mail import _send_email_sync
import traceback

print("Starting SMTP diagnostic...")
print("SMTP_USER:", os.getenv("SMTP_USER"))
print("SMTP_PASS:", os.getenv("SMTP_PASS")[:10] + "..." if os.getenv("SMTP_PASS") else None)
print("SMTP_SENDER_EMAIL:", os.getenv("SMTP_SENDER_EMAIL"))
print("FEEDBACK_RECEIVER_EMAIL:", os.getenv("FEEDBACK_RECEIVER_EMAIL"))
print("---")

try:
    success = _send_email_sync("Diagnostic Bot", "test@bot.com", "Testing SMTP with provided keys.")
    if success:
        print("SUCCESS: SMTP transaction completed.")
    else:
        print("FAILURE: Check above logs.")
except Exception:
    traceback.print_exc()
