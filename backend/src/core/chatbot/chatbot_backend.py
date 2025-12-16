# #from typing import List, Tuple
# from .load_config import LoadProjectConfig
# from ..agent_graph.load_tools_config import LoadToolsConfig
# from ..agent_graph.build_full_graph import build_graph
# from ..utils.app_utils import create_directory
# from .memory import Memory

# URL = "https://github.com/Farzad-R/LLM-Zero-to-Hundred/tree/master/RAG-GPT"
# hyperlink = f"[RAG-GPT user guideline]({URL})"

# PROJECT_CFG = LoadProjectConfig()
# TOOLS_CFG = LoadToolsConfig()

# graph = build_graph()


# config = {"configurable": {"thread_id": TOOLS_CFG.thread_id}}

# create_directory("memory")


# class ChatBot:
#     """
#     A class to handle chatbot interactions by utilizing a pre-defined agent graph. The chatbot processes
#     user messages, generates appropriate responses, and saves the chat history to a specified memory directory.

#     Attributes:
#         config (dict): A configuration dictionary that stores specific settings such as the `thread_id`.

#     Methods:
#         respond(chatbot: List, message: str) -> Tuple:
#             Processes the user message through the agent graph, generates a response, appends it to the chat history,
#             and writes the chat history to a file.
#     """
#     @staticmethod
#     def respond(chatbot: list, message: str) -> tuple:
#         """
#         Processes a user message using the agent graph, generates a response, and appends it to the chat history.
#         The chat history is also saved to a memory file for future reference.

#         Args:
#             chatbot (List): A list representing the chatbot conversation history. Each entry is a tuple of the user message and the bot response.
#             message (str): The user message to process.

#         Returns:
#             Tuple: Returns an empty string (representing the new user input placeholder) and the updated conversation history.
#         """
#         # The config is the **second positional argument** to stream() or invoke()!
#         events = graph.stream(
#             {"messages": [("user", message)]}, config, stream_mode="values"
#         )
#         for event in events:
#             event["messages"][-1].pretty_print()

#         chatbot.append(
#             (message, event["messages"][-1].content))

#         Memory.write_chat_history_to_file(
#             chat_history=chatbot, folder_path=PROJECT_CFG.memory_dir, thread_id=TOOLS_CFG.thread_id)
#         return "", chatbot



#from typing import List, Tuple
from .load_config import LoadProjectConfig
from ..agent_graph.load_tools_config import LoadToolsConfig
from ..agent_graph.build_full_graph import build_graph
from ..utils.app_utils import create_directory
from .memory import Memory

URL = "https://github.com/Farzad-R/LLM-Zero-to-Hundred/tree/master/RAG-GPT"
hyperlink = f"[RAG-GPT user guideline]({URL})"

PROJECT_CFG = LoadProjectConfig()
TOOLS_CFG = LoadToolsConfig()

# Build separate graphs for each agent
ruhuna_graph = build_graph(agent_type="ruhuna")
ugc_graph = build_graph(agent_type="ugc")

# Config template using the same thread_id for both agents
config_template = {"configurable": {"thread_id": TOOLS_CFG.thread_id}}

# Ensure memory directory exists
create_directory("memory")


class ChatBot:
    """
    Handles chatbot interactions with a specific agent graph.
    """

    @staticmethod
    def respond(chatbot: list, message: str, graph) -> tuple:
        """
        Processes a user message using the given agent graph, generates a response, 
        and appends it to the chat history. Chat history is saved to a memory file.

        Args:
            chatbot (list): Chat history as a list of tuples [(user_msg, bot_msg), ...]
            message (str): User input message
            graph: Agent graph to use (ruhuna_graph or ugc_graph)

        Returns:
            tuple: ("", updated_chat_history)
        """
        from langchain_core.messages import AIMessage
        import logging
        
        logger = logging.getLogger("ai-agent")
        
        # Use the same thread_id for memory
        config = config_template.copy()

        # Collect all messages from the stream
        all_messages = []
        events = list(graph.stream(
            {"messages": [("user", message)]}, config, stream_mode="values"
        ))
        
        # Get all messages from all events
        for event in events:
            all_messages.extend(event["messages"])
            
        logger.info(f"Total messages received: {len(all_messages)}")
        for i, msg in enumerate(all_messages):
            logger.info(f"Message {i}: {type(msg).__name__} - {msg.content[:100] if hasattr(msg, 'content') else 'N/A'}")

        # Find the last AI message (not a tool message)
        last_ai_message = None
        for msg in reversed(all_messages):
            if isinstance(msg, AIMessage) and not msg.tool_calls:
                last_ai_message = msg
                logger.info(f"Found final AI message: {msg.content}")
                break

        # Use the last AI message, or empty string if none found
        bot_response = last_ai_message.content if last_ai_message else ""
        logger.info(f"Final bot_response: '{bot_response}'")

        chatbot.append(
            (message, bot_response)
        )

        Memory.write_chat_history_to_file(
            chat_history=chatbot, folder_path=PROJECT_CFG.memory_dir, thread_id=TOOLS_CFG.thread_id
        )

        return "", chatbot
