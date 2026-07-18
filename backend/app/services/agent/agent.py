"""
LangGraph Multi-Agent Blog Generation Engine.
This module compiles a StateGraph that orchestrates the execution of multiple
specialized AI agents to produce SEO-optimized, technical blog posts.
"""
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from app.services.agent.state import BlogState
from app.services.agent.nodes import (
    router_node, route_next, research_node, orchestrator_node,
    fanout, worker_node, decide_images, merge_content,
    generate_and_place_images, editor_node
)

# Compile Main Agent Graph
# ---------------------------------------------------------------------
builder = StateGraph(BlogState)

# Add all agent nodes to StateGraph
builder.add_node("router", router_node)
builder.add_node("research", research_node)
builder.add_node("orchestrator", orchestrator_node)
builder.add_node("worker", worker_node)
builder.add_node("decide_images", decide_images)
builder.add_node("merge_content", merge_content)
builder.add_node("generate_and_place_images", generate_and_place_images)
builder.add_node("editor", editor_node)

# Set up flow edges and conditional routing
builder.add_edge(START, "router")
builder.add_conditional_edges("router", route_next, {"research": "research", "orchestrator": "orchestrator"})
builder.add_edge("research", "orchestrator")
builder.add_conditional_edges("orchestrator", fanout, ["worker"])
builder.add_edge("worker", "decide_images")
builder.add_edge("decide_images", "merge_content")
builder.add_edge("merge_content", "generate_and_place_images")
builder.add_edge("generate_and_place_images", "editor")
builder.add_edge("editor", END)

# In-memory checkpointer to persist state and checkpoints for resume functionalities
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)
