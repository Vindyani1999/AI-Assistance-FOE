import streamlit as st
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.chatbot.chatbot_backend import ChatBot
from src.core.chatbot.load_config import LoadProjectConfig
from src.core.agent_graph.load_tools_config import LoadToolsConfig
from src.core.chatbot.memory import Memory

# Page configuration
st.set_page_config(
    page_title="AI Agent",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 1rem 0;
        color: #1f77b4;
    }
    
    .chat-container {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        margin: 1rem 0;
        border-left: 4px solid #1f77b4;
    }
    
    .user-message {
        background-color: #e3f2fd;
        padding: 0.8rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #2196f3;
    }
    
    .bot-message {
        background-color: #f1f8e9;
        padding: 0.8rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #4caf50;
    }
    
    .sidebar-button {
        margin: 0.5rem 0;
        width: 100%;
    }
    
    .feedback-container {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 10px;
    }
    
    .stButton > button {
        border-radius: 20px;
        border: none;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .primary-button {
        background-color: #1f77b4;
        color: white;
    }
    
    .secondary-button {
        background-color: #6c757d;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

if "chatbot_history" not in st.session_state:
    st.session_state.chatbot_history = []

# Load configurations
@st.cache_resource
def load_configs():
    return LoadProjectConfig(), LoadToolsConfig()

PROJECT_CFG, TOOLS_CFG = load_configs()

# Helper functions
def display_message(message, is_user=True):
    """Display a message with appropriate styling"""
    if is_user:
        st.markdown(f"""
        <div class="user-message">
            <strong>You:</strong> {message}
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div class="bot-message">
            <strong>🤖 AI Agent:</strong> {message}
        </div>
        """, unsafe_allow_html=True)

def handle_feedback(message_index, feedback_type):
    """Handle user feedback (like/dislike)"""
    if message_index < len(st.session_state.messages):
        message_content = st.session_state.messages[message_index]
        if feedback_type == "like":
            st.success(f"👍 You liked: {message_content[:50]}...")
        else:
            st.info(f"👎 You disliked: {message_content[:50]}...")

def clear_chat():
    """Clear the chat history"""
    st.session_state.messages = []
    st.session_state.chatbot_history = []
    st.rerun()

def send_message(user_input):
    """Process user message and get bot response"""
    if user_input.strip():
        # Add user message to history
        st.session_state.messages.append({"role": "user", "content": user_input})
        
        # Get bot response using the existing ChatBot class
        try:
            # Use the existing respond method but adapt for Streamlit
            _, updated_chatbot = ChatBot.respond(st.session_state.chatbot_history, user_input)
            
            # Extract the latest bot response
            if updated_chatbot:
                latest_response = updated_chatbot[-1][1]  # Get the bot's response from the tuple
                st.session_state.messages.append({"role": "assistant", "content": latest_response})
                st.session_state.chatbot_history = updated_chatbot
            
        except Exception as e:
            error_message = f"Sorry, I encountered an error: {str(e)}"
            st.session_state.messages.append({"role": "assistant", "content": error_message})

# Main application layout
def main():
    # Header
    st.markdown('<h1 class="main-header">🤖 AI Guidance Agent</h1>', unsafe_allow_html=True)
    
    # Create main layout with columns
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Chat container
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        
        # Display chat history
        chat_container = st.container()
        with chat_container:
            if st.session_state.messages:
                for i, message in enumerate(st.session_state.messages):
                    if message["role"] == "user":
                        display_message(message["content"], is_user=True)
                    else:
                        display_message(message["content"], is_user=False)
                        
                        # Add feedback buttons for bot messages
                        col_like, col_dislike = st.columns([1, 1])
                        with col_like:
                            if st.button("👍", key=f"like_{i}", help="Like this response"):
                                handle_feedback(i, "like")
                        with col_dislike:
                            if st.button("👎", key=f"dislike_{i}", help="Dislike this response"):
                                handle_feedback(i, "dislike")
            else:
                st.info("👋 Hello! I'm your AI Guidance Agent. How can I help you today?")
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Input area
        st.markdown("### 💬 Send a message")
        
        # Create input form
        with st.form("chat_form", clear_on_submit=True):
            col_input, col_send, col_clear = st.columns([6, 1, 1])
            
            with col_input:
                user_input = st.text_area(
                    "Message",
                    placeholder="Type a message...",
                    height=100,
                    label_visibility="collapsed"
                )
            
            with col_send:
                send_clicked = st.form_submit_button("📤", help="Send message")
            
            with col_clear:
                clear_clicked = st.form_submit_button("🗑️", help="Clear chat")
        
        # Handle form submissions
        if send_clicked and user_input:
            send_message(user_input)
            st.rerun()
        
        if clear_clicked:
            clear_chat()
    
    with col2:
        # Sidebar with additional options
        st.markdown("### 🛠️ Quick Actions")
        
        # Agent buttons
        if st.button("📅 Booking Agent", key="booking_agent", help="Open Booking Agent"):
            st.markdown('[Open Booking Agent](https://www.youtube.com/watch?v=FwOTs4UxQS4)', unsafe_allow_html=True)
        
        if st.button("📋 Planner Agent", key="planner_agent", help="Open Planner Agent"):
            st.markdown('[Open Planner Agent](http://localhost:7862)', unsafe_allow_html=True)
        
        # Chat statistics
        st.markdown("### 📊 Chat Stats")
        total_messages = len(st.session_state.messages)
        user_messages = len([m for m in st.session_state.messages if m["role"] == "user"])
        bot_messages = len([m for m in st.session_state.messages if m["role"] == "assistant"])
        
        st.metric("Total Messages", total_messages)
        st.metric("Your Messages", user_messages)
        st.metric("Bot Responses", bot_messages)
        
        # Export chat history
        if st.button("💾 Export Chat", help="Export chat history"):
            if st.session_state.messages:
                chat_text = ""
                for message in st.session_state.messages:
                    role = "You" if message["role"] == "user" else "AI Agent"
                    chat_text += f"{role}: {message['content']}\n\n"
                
                st.download_button(
                    label="Download Chat History",
                    data=chat_text,
                    file_name="chat_history.txt",
                    mime="text/plain"
                )
            else:
                st.warning("No chat history to export!")
        
        # Clear chat button in sidebar
        if st.button("🗑️ Clear All Chat", key="clear_sidebar", help="Clear entire chat history"):
            clear_chat()

# Add some information in the sidebar
with st.sidebar:
    st.markdown("## About")
    st.info("""
    This is an AI Guidance Agent powered by advanced language models. 
    It can help you with various tasks and questions.
    
    **Features:**
    - Interactive chat interface
    - Message feedback (like/dislike)
    - Chat history export
    - Multiple agent access points
    """)
    
    st.markdown("## How to Use")
    st.markdown("""
    1. Type your message in the text area
    2. Click the 📤 button or press Ctrl+Enter to send
    3. Use 👍/👎 to rate responses
    4. Access other agents via Quick Actions
    5. Export your chat history anytime
    """)

if __name__ == "__main__":
    main()
