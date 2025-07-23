from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
import sys
import os

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
chat_sessions: Dict[str, List[tuple]] = {}

# Pydantic models for request/response
class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Dict[str, str]]
    session_id: str

class FeedbackRequest(BaseModel):
    session_id: str
    message_index: int
    feedback_type: str  # "like" or "dislike"

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
        user_message = chat_message.message
        
        # Get or create chat history for this session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        current_history = chat_sessions[session_id]
        
        # Use the existing ChatBot.respond method
        _, updated_chatbot = ChatBot.respond(current_history, user_message)
        
        # Update session history
        chat_sessions[session_id] = updated_chatbot
        
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
        # For now, we'll just log it
        print(f"Feedback received for session {feedback.session_id}: "
              f"Message {feedback.message_index} was {feedback.feedback_type}d")
        
        return {"message": "Feedback received", "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

@app.delete("/chat/{session_id}")
async def clear_chat(session_id: str):
    """
    Clear chat history for a specific session
    """
    try:
        if session_id in chat_sessions:
            del chat_sessions[session_id]
        
        return {"message": f"Chat history cleared for session {session_id}", "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat: {str(e)}")

@app.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    """
    Get chat history for a specific session
    """
    try:
        if session_id not in chat_sessions:
            return {"conversation_history": [], "session_id": session_id}
        
        current_history = chat_sessions[session_id]
        conversation_history = []
        
        for user_msg, bot_msg in current_history:
            conversation_history.extend([
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": bot_msg}
            ])
        
        return {"conversation_history": conversation_history, "session_id": session_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat history: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "message": "AI Agent API is running",
        "active_sessions": len(chat_sessions)
    }

if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        "api_backend:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
