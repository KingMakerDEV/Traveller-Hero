"""
planner_workflow.py — LangGraph workflow wiring the conversation
and trip builder agents together into a single executable graph.
"""

import logging
from langgraph.graph import StateGraph, END
from graph.planner_state import PlannerState
from agents.conversation import run_conversation_agent
from agents.trip_builder import run_trip_builder_agent

logger = logging.getLogger(__name__)


def should_build_trip(state: PlannerState) -> str:
    """
    Routing function called after the conversation agent runs.
    Returns 'build_trip' if enough context is gathered,
    otherwise returns 'end' to pause and wait for the next user answer.
    """
    if state.get("ready_to_plan", False):
        logger.info(
            "Session %s: ready_to_plan=True, routing to trip builder.",
            state["session_id"]
        )
        return "build_trip"

    logger.info(
        "Session %s: ready_to_plan=False, returning question to user.",
        state["session_id"]
    )
    return "end"


def build_planner_graph() -> StateGraph:
    """
    Builds and compiles the LangGraph planner workflow.
    
    Graph structure:
        conversation_agent
               |
        [should_build_trip?]
          /           \\
      build_trip      END
          |
         END
    """
    graph = StateGraph(PlannerState)

    # Register nodes
    graph.add_node("conversation_agent", run_conversation_agent)
    graph.add_node("trip_builder_agent", run_trip_builder_agent)

    # Entry point
    graph.set_entry_point("conversation_agent")

    # Conditional routing after conversation agent
    graph.add_conditional_edges(
        "conversation_agent",
        should_build_trip,
        {
            "build_trip": "trip_builder_agent",
            "end": END
        }
    )

    # Trip builder always ends after running
    graph.add_edge("trip_builder_agent", END)

    compiled = graph.compile()
    logger.info("Planner workflow compiled successfully.")
    return compiled


# Singleton compiled graph — imported by routes
planner_graph = build_planner_graph()