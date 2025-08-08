# Setup and Run Instructions for React + FastAPI Integration

## Architecture
```
React Frontend (http://localhost:3000) ↔ FastAPI Backend (http://localhost:8000) ↔ ChatBot Logic
```

## Setup Instructions

### 1. Backend Setup (Python)

1. **Install FastAPI dependencies:**
   ```bash
   pip install fastapi uvicorn
   ```

2. **Run the FastAPI backend:**
   ```bash
   cd src
   python api_backend.py
   ```
   This will start the API server at `http://localhost:8000`

### 2. Frontend Setup (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install React dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```
   This will start the React app at `http://localhost:3000`

## How the Integration Works

### 1. **FastAPI Backend (`api_backend.py`)**
   - Creates REST API endpoints that wrap your existing ChatBot logic
   - Handles CORS to allow React frontend communication
   - Manages chat sessions and conversation history
   - Endpoints:
     - `POST /chat` - Send messages to the chatbot
     - `POST /feedback` - Send like/dislike feedback
     - `DELETE /chat/{session_id}` - Clear chat history
     - `GET /chat/{session_id}/history` - Get chat history
     - `GET /health` - Health check

### 2. **React Frontend**
   - **API Service (`services/api.ts`)**: Handles all HTTP requests to the backend
   - **Chat Interface (`components/ChatInterface.tsx`)**: Main chat UI component
   - **Real-time Communication**: Uses fetch API to communicate with FastAPI backend

### 3. **Data Flow**
   1. User types message in React frontend
   2. Frontend sends POST request to `/chat` endpoint
   3. FastAPI backend calls your existing `ChatBot.respond()` method
   4. Backend returns response to frontend
   5. Frontend displays the response in the chat interface

## Key Features Implemented

✅ **Chat Interface**: Real-time messaging with typing indicators
✅ **Message History**: Persistent conversation history per session
✅ **Feedback System**: Like/dislike buttons for messages
✅ **Clear Chat**: Clear conversation history
✅ **External Links**: Booking and Planner agent buttons
✅ **Chat Statistics**: Message counts and session info
✅ **Error Handling**: Proper error messages and loading states
✅ **Responsive Design**: Works on desktop and mobile

## Environment Variables

Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8000
```

## Production Deployment

### Backend:
```bash
uvicorn api_backend:app --host 0.0.0.0 --port 8000
```

### Frontend:
```bash
npm run build
# Serve the build folder with any static file server
```

## Troubleshooting

1. **CORS Issues**: Make sure FastAPI backend is running and CORS is properly configured
2. **Module Import Errors**: Ensure all Python dependencies are installed in your virtual environment
3. **React Build Issues**: Run `npm install` to ensure all dependencies are installed
4. **Port Conflicts**: Change ports in the respective configuration files if needed

## Testing the Integration

1. Start the FastAPI backend: `python src/api_backend.py`
2. Start the React frontend: `cd frontend && npm start`
3. Open `http://localhost:3000` in your browser
4. Test sending messages and using all features

The React frontend will communicate with your existing ChatBot backend through the FastAPI wrapper, maintaining all the original functionality while providing a modern web interface.
