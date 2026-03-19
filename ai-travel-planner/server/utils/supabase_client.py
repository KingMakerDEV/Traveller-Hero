"""
supabase_client.py — Singleton Supabase client for backend use.
Uses the service role key which bypasses Row Level Security.
Only used server-side — never expose the service role key to the frontend.
"""

import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    """
    Returns the singleton Supabase client.
    Initializes it on first call.
    """
    global _client

    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables."
        )

    _client = create_client(url, key)
    logger.info("Supabase client initialized successfully.")
    return _client