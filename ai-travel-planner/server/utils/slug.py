"""
slug.py — Generates a unique URL-safe slug from a trip title.
Used when saving a trip to Supabase so the frontend can route to /trip/:slug
"""

import re
import uuid
import logging
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    """
    Convert a trip title to a URL-safe slug.
    Example: "Vibrant Peaks and Trails in Annecy" → "vibrant-peaks-and-trails-in-annecy"
    """
    # Lowercase
    text = text.lower().strip()

    # Replace spaces and underscores with hyphens
    text = re.sub(r'[\s_]+', '-', text)

    # Remove all characters that are not alphanumeric or hyphens
    text = re.sub(r'[^a-z0-9-]', '', text)

    # Remove leading and trailing hyphens
    text = text.strip('-')

    # Collapse multiple hyphens into one
    text = re.sub(r'-+', '-', text)

    return text


def generate_unique_slug(title: str) -> str:
    """
    Generates a slug from the title and checks Supabase to ensure
    it is unique. Appends a short UUID suffix if a collision is found.
    """
    base_slug = slugify(title)

    if not base_slug:
        base_slug = "trip"

    slug = base_slug

    try:
        supabase = get_supabase()

        # Check if slug already exists
        result = supabase.table("trips").select("slug").eq("slug", slug).execute()

        if len(result.data) == 0:
            # Slug is unique
            return slug

        # Collision found — append short UUID suffix
        short_id = str(uuid.uuid4())[:8]
        slug = f"{base_slug}-{short_id}"
        logger.info("Slug collision on '%s', using '%s' instead.", base_slug, slug)
        return slug

    except Exception as e:
        # If Supabase check fails, fall back to UUID suffix to be safe
        short_id = str(uuid.uuid4())[:8]
        fallback_slug = f"{base_slug}-{short_id}"
        logger.error("Slug uniqueness check failed: %s. Using fallback: %s", e, fallback_slug)
        return fallback_slug