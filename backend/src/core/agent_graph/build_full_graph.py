from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START
from langchain_openai import ChatOpenAI
from .tool_chinook_sqlagent import query_chinook_sqldb
from .tool_travel_sqlagent import query_travel_sqldb
from .tool_lookup_policy_rag import lookup_swiss_airline_policy
from .tool_tavily_search import load_tavily_search_tool
from .tool_stories_rag import lookup_stories
from .load_tools_config import LoadToolsConfig
from .agent_backend import State, BasicToolNode, route_tools, plot_agent_schema
from .tool_exam_manual_rag import lookup_exam_manual
from .tool_student_handbook_rag import lookup_student_handbook
from .tool_by_law_rag import lookup_by_law

TOOLS_CFG = LoadToolsConfig()


def build_graph():
    """
    Builds an agent decision-making graph by combining an LLM with various tools
    and defining the flow of interactions between them.

    This function sets up a state graph where a primary language model (LLM) interacts
    with several predefined tools (e.g., databases, search functions, policy lookup, etc.).
    The agent can invoke tools based on conditions and use their outputs to inform
    further decisions. The flow involves conditional tool invocation, returning back
    to the chatbot after tool execution to guide the next step.

    Steps:
    1. Initializes the primary language model (LLM) with tool-binding functionality.
    2. Defines nodes in the graph where each node represents a specific action:
       - Chatbot node: Executes the LLM with the given state and messages.
       - Tools node: Runs the tool invocations based on the last message in the input state.
    3. Implements conditional routing between the chatbot and tools:
       - If a tool is required, it routes to the tools node.
       - Otherwise, the flow ends.
    4. Establishes connections between the chatbot and tools nodes to form the agent loop.
    5. Uses a memory-saving mechanism to track and save checkpoints in the graph.

    Returns:
        graph (StateGraph): The compiled state graph that represents the decision-making process
        of the agent, integrating the chatbot, tools, and conditional routing.

    Components:
        - `primary_llm`: The primary language model responsible for generating responses.
        - `tools`: A list of tools including SQL queries, search functionalities, policy lookups, etc.
        - `tool_node`: A node responsible for handling tool execution based on the chatbot's request.
        - `chatbot`: A function that takes the state as input and returns a message generated by the LLM.
        - `route_tools`: A conditional function to determine whether the chatbot should call a tool.
        - `graph`: The complete graph with nodes and conditional edges.
    """
    primary_llm = ChatOpenAI(model=TOOLS_CFG.primary_agent_llm,
                             temperature=TOOLS_CFG.primary_agent_llm_temperature)
    graph_builder = StateGraph(State)
    # Load tools with their proper configs
    search_tool = load_tavily_search_tool(TOOLS_CFG.tavily_search_max_results)
    tools = [search_tool,
             lookup_swiss_airline_policy,
             lookup_stories,
             query_travel_sqldb,
             #query_chinook_sqldb,
                # lookup_exam_manual,
                # lookup_student_handbook,
                # lookup_by_law
             ]
    # Tell the LLM which tools it can call
    primary_llm_with_tools = primary_llm.bind_tools(tools)

    def chatbot(state: State):
        """Executes the primary language model with tools bound and returns the generated message."""
        return {"messages": [primary_llm_with_tools.invoke(state["messages"])]}

    graph_builder.add_node("chatbot", chatbot)
    tool_node = BasicToolNode(
        tools=[
            search_tool,
            lookup_swiss_airline_policy,
            lookup_stories,
            query_travel_sqldb,
            #query_chinook_sqldb,
            # lookup_exam_manual,
            # lookup_student_handbook,
            # lookup_by_law
        ])
    graph_builder.add_node("tools", tool_node)
    # The `tools_condition` function returns "tools" if the chatbot asks to use a tool, and "__end__" if
    # it is fine directly responding. This conditional routing defines the main agent loop.
    graph_builder.add_conditional_edges(
        "chatbot",
        route_tools,
        # The following dictionary lets you tell the graph to interpret the condition's outputs as a specific node
        # It defaults to the identity function, but if you
        # want to use a node named something else apart from "tools",
        # You can update the value of the dictionary to something else
        # e.g., "tools": "my_tools"
        {"tools": "tools", "__end__": "__end__"},
    )

    # Any time a tool is called, we return to the chatbot to decide the next step
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_edge(START, "chatbot")
    memory = MemorySaver()
    graph = graph_builder.compile(checkpointer=memory)
    plot_agent_schema(graph)
    return graph
