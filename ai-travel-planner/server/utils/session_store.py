"""
session_store.py — In-memory session store for conversational trip planning.
Holds PlannerState between round trips keyed by session_id.
Uses a thread-safe dictionary with automatic expiry after 2 hours of inactivity.
"""

import threading
import time
import uuid
import logging
from typing import Optional
from graph.planner_state import PlannerState

logger = logging.getLogger(__name__)

# Session expiry in seconds — 2 hours
SESSION_TTL = 60 * 60 * 2


class SessionStore:
    def __init__(self):
        self._store: dict[str, dict] = {}
        self._lock = threading.Lock()

        # Start background cleanup thread
        cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        cleanup_thread.start()
        logger.info("SessionStore initialized with TTL=%ds", SESSION_TTL)

    def create_session(self, initial_state: PlannerState) -> str:
        """
        Create a new session with the given initial state.
        Returns the generated session_id.
        """
        session_id = str(uuid.uuid4())
        with self._lock:
            self._store[session_id] = {
                "state": initial_state,
                "last_accessed": time.time()
            }
        logger.info("Session created: %s", session_id)
        return session_id

    def get_session(self, session_id: str) -> Optional[PlannerState]:
        """
        Retrieve state for a session_id.
        Returns None if session does not exist or has expired.
        """
        with self._lock:
            entry = self._store.get(session_id)
            if not entry:
                logger.warning("Session not found: %s", session_id)
                return None

            # Refresh last accessed timestamp
            entry["last_accessed"] = time.time()
            return entry["state"]

    def update_session(self, session_id: str, updated_state: PlannerState) -> bool:
        """
        Update state for an existing session.
        Returns False if session does not exist.
        """
        with self._lock:
            if session_id not in self._store:
                logger.warning("Update failed — session not found: %s", session_id)
                return False

            self._store[session_id]["state"] = updated_state
            self._store[session_id]["last_accessed"] = time.time()
            return True

    def delete_session(self, session_id: str) -> None:
        """Explicitly delete a session after trip is complete."""
        with self._lock:
            if session_id in self._store:
                del self._store[session_id]
                logger.info("Session deleted: %s", session_id)

    def _cleanup_loop(self) -> None:
        """Background thread that removes expired sessions every 15 minutes."""
        while True:
            time.sleep(60 * 15)
            self._cleanup_expired()

    def _cleanup_expired(self) -> None:
        now = time.time()
        with self._lock:
            expired = [
                sid for sid, entry in self._store.items()
                if now - entry["last_accessed"] > SESSION_TTL
            ]
            for sid in expired:
                del self._store[sid]
                logger.info("Session expired and removed: %s", sid)

        if expired:
            logger.info("Cleanup complete. Removed %d expired sessions.", len(expired))


# Singleton instance — imported by routes and workflow
session_store = SessionStore()