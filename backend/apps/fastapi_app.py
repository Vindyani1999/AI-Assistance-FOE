
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
import sys
import os
from datetime import datetime
import re

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from src.core.chatbot.chatbot_backend import ChatBot
from src.core.chatbot.load_config import LoadProjectConfig
from src.core.agent_graph.load_tools_config import LoadToolsConfig

# Initialize FastAPI app
app = FastAPI(title="AI Agent API", version="1.0.0")

# Add CORS middleware to allow React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configurations
PROJECT_CFG = LoadProjectConfig()
TOOLS_CFG = LoadToolsConfig()

# In-memory storage for chat sessions (in production, use a database)
# Structure: {user_id: {session_id: List[tuple]}}
user_chat_sessions: Dict[str, Dict[str, List[tuple]]] = {}
# Structure: {user_id: {session_id: Dict}}
user_session_metadata: Dict[str, Dict[str, Dict]] = {}

def extract_topic_from_messages(messages: List[tuple]) -> str:
    """Extract a meaningful topic from the first user message"""
    if not messages:
        return "New Chat"
    
    first_message = messages[0][0]  # First user message
    
    # Remove common words and extract key terms
    words = re.findall(r'\b\w+\b', first_message.lower())
    stop_words = {'i', 'am', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'can', 'you', 'help', 'me', 'my', 'what', 'how', 'when', 'where', 'why', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
    
    meaningful_words = [word for word in words if len(word) > 3 and word not in stop_words]
    
    if meaningful_words:
        # Take first 2-3 meaningful words and capitalize
        topic_words = meaningful_words[:3]
        topic = ' '.join(word.capitalize() for word in topic_words)
        return topic if len(topic) <= 50 else topic[:47] + "..."
    
    # Fallback: Use first few words of the message
    words = first_message.split()[:4]
    topic = ' '.join(words)
    return topic if len(topic) <= 50 else topic[:47] + "..."

def update_session_metadata(user_id: str, session_id: str, messages: List[tuple]):
    """Update metadata for a specific user's session"""
    if user_id not in user_session_metadata:
        user_session_metadata[user_id] = {}
    
    if session_id not in user_session_metadata[user_id]:
        user_session_metadata[user_id][session_id] = {
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'message_count': 0,
            'topic': 'New Chat'
        }
    
    user_session_metadata[user_id][session_id].update({
        'updated_at': datetime.now().isoformat(),
        'message_count': len(messages),
        'topic': extract_topic_from_messages(messages)
    })

# Pydantic models for request/response
class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"
    user_id: str = "anonymous"

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Dict[str, str]]
    session_id: str

class FeedbackRequest(BaseModel):
    session_id: str
    message_index: int
    feedback_type: str  # "like" or "dislike"
    user_id: str = "anonymous"

class ChatSession(BaseModel):
    session_id: str
    topic: str
    message_count: int
    created_at: str
    updated_at: str

class ChatSessionsResponse(BaseModel):
    sessions: List[ChatSession]
    total_count: int

class CreateSessionRequest(BaseModel):
    user_id: str = "anonymous"

# Endpoint to create a new chat session for a user
@app.post("/chat/session")
async def create_chat_session(request: CreateSessionRequest):
    """
    Create a new chat session for a user and return session_id and topic
    """
    try:
        user_id = request.user_id or "anonymous"
        session_id = str(uuid4())
        # Initialize chat history and metadata
        if user_id not in user_chat_sessions:
            user_chat_sessions[user_id] = {}
        user_chat_sessions[user_id][session_id] = []
        update_session_metadata(user_id, session_id, [])
        topic = user_session_metadata[user_id][session_id]['topic']
        return {"session_id": session_id, "topic": topic}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chat session: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Agent API is running", "status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    """
    Main chat endpoint that processes user messages and returns AI responses
    """
    try:
        session_id = chat_message.session_id
        user_id = chat_message.user_id
        user_message = chat_message.message
        print(f"[CHAT] user_id={user_id}, session_id={session_id}, message={user_message}")

        # Initialize user storage if needed
        if user_id not in user_chat_sessions:
            user_chat_sessions[user_id] = {}

        # Get or create chat history for this user's session
        if session_id not in user_chat_sessions[user_id]:
            user_chat_sessions[user_id][session_id] = []

        current_history = user_chat_sessions[user_id][session_id]

        # Use the existing ChatBot.respond method
        _, updated_chatbot = ChatBot.respond(current_history, user_message)

        # Update session history and metadata
        user_chat_sessions[user_id][session_id] = updated_chatbot
        update_session_metadata(user_id, session_id, updated_chatbot)

        # Format response for React frontend
        conversation_history = []
        for user_msg, bot_msg in updated_chatbot:
            conversation_history.extend([
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": bot_msg}
            ])

        # Get the latest bot response
        latest_response = updated_chatbot[-1][1] if updated_chatbot else "Sorry, I couldn't process your message."

        return ChatResponse(
            response=latest_response,
            conversation_history=conversation_history,
            session_id=session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@app.post("/feedback")
async def feedback_endpoint(feedback: FeedbackRequest):
    """
    Endpoint to handle user feedback (like/dislike)
    """
    try:
        # In a real application, you'd store this feedback in a database
        # For now, we'll just log it with user information
        print(f"Feedback received from user {feedback.user_id} for session {feedback.session_id}: "
              f"Message {feedback.message_index} was {feedback.feedback_type}d")
        
        return {"message": "Feedback received", "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

@app.delete("/chat/{session_id}")
async def clear_chat(session_id: str, user_id: str = "anonymous"):
    """
    Clear chat history for a specific user's session
    """
    try:
        if user_id in user_chat_sessions and session_id in user_chat_sessions[user_id]:
            del user_chat_sessions[user_id][session_id]
        if user_id in user_session_metadata and session_id in user_session_metadata[user_id]:
            del user_session_metadata[user_id][session_id]
        
        return {"message": f"Chat history cleared for session {session_id}", "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat: {str(e)}")

@app.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str, user_id: str = "anonymous"):
    """
    Get chat history for a specific user's session
    """
    try:
        print(f"[HISTORY] user_id={user_id}, session_id={session_id}")
        if user_id not in user_chat_sessions or session_id not in user_chat_sessions[user_id]:
            return {"conversation_history": [], "session_id": session_id}

        current_history = user_chat_sessions[user_id][session_id]
        conversation_history = []

        for user_msg, bot_msg in current_history:
            conversation_history.extend([
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": bot_msg}
            ])

        return {"conversation_history": conversation_history, "session_id": session_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat history: {str(e)}")

@app.get("/chat/sessions", response_model=ChatSessionsResponse)
async def get_chat_sessions(user_id: str = "anonymous"):
    """
    Get all chat sessions for a specific user with metadata (topic, timestamps, message count)
    """
    try:
        print(f"[SESSIONS] user_id={user_id}")
        sessions = []
        if user_id in user_session_metadata:
            for session_id, metadata in user_session_metadata[user_id].items():
                # Only include sessions that still have chat data
                if user_id in user_chat_sessions and session_id in user_chat_sessions[user_id]:
                    sessions.append(ChatSession(
                        session_id=session_id,
                        topic=metadata['topic'],
                        message_count=metadata['message_count'],
                        created_at=metadata['created_at'],
                        updated_at=metadata['updated_at']
                    ))

        # Sort by updated_at (most recent first)
        sessions.sort(key=lambda x: x.updated_at, reverse=True)

        return ChatSessionsResponse(
            sessions=sessions,
            total_count=len(sessions)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat sessions: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    # Count total active sessions across all users
    total_sessions = sum(len(sessions) for sessions in user_chat_sessions.values())
    
    return {
        "status": "healthy",
        "message": "AI Agent API is running",
        "active_sessions": total_sessions,
        "total_users": len(user_chat_sessions)
    }

if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        "apps.fastapi_app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

    
