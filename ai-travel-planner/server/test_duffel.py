from duffel_api import Duffel
import os
from dotenv import load_dotenv

load_dotenv()

client = Duffel(access_token=os.getenv("DUFFEL_API_KEY"))

# Inspect available methods on offer_requests
print("Available methods:", [m for m in dir(client.offer_requests) if not m.startswith("_")])

# Try the raw API call directly which works across all versions
import requests

headers = {
    "Authorization": f"Bearer {os.getenv('DUFFEL_API_KEY')}",
    "Duffel-Version": "v2",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

payload = {
    "data": {
        "cabin_class": "economy",
        "passengers": [{"type": "adult"}],
        "slices": [
            {
                "origin": "DEL",
                "destination": "BOM",
                "departure_date": "2026-06-15"
            }
        ]
    }
}

response = requests.post(
    "https://api.duffel.com/air/offer_requests",
    json=payload,
    headers=headers,
    timeout=30
)

print("Status:", response.status_code)
print("Response:", response.json())