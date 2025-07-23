# React Frontend for Guidance Agent

This is a React.js frontend version of the Guidance Agent application that provides the same functionality as the original Gradio version but with a modern web interface.

## Features

- **Chat Interface**: Interactive chat with the AI agent
- **Real-time Responses**: Streaming responses from the backend
- **Feedback System**: Like/dislike feedback on AI responses
- **Session Management**: Maintains chat history per session
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling and user feedback

## Getting Started

### Prerequisites

Make sure you have Python 3.8+ installed and all the required dependencies.

### Installation

1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Make sure your environment variables are set up (API keys, etc.) as required by the original application.

### Running the Application

1. Navigate to the `src` directory:
   ```bash
   cd src
   ```

2. Run the React-based application:
   ```bash
   python app_react.py
   ```

3. Open your browser and go to: `http://localhost:5000`

## API Endpoints

The Flask backend provides the following REST API endpoints:

### `POST /api/chat`
Send a message to the chatbot and receive a response.

**Request Body:**
```json
{
    "message": "Your question here",
    "session_id": "unique_session_id",
    "chat_history": [
        {"type": "user", "content": "Previous message", "id": 123},
        {"type": "bot", "content": "Previous response", "id": 124}
    ]
}
```

**Response:**
```json
{
    "response": "AI response here",
    "session_id": "unique_session_id"
}
```

### `POST /api/feedback`
Send feedback on a bot response.

**Request Body:**
```json
{
    "message_content": "The bot response",
    "liked": true,
    "session_id": "unique_session_id"
}
```

### `POST /api/clear`
Clear the chat history for a session.

**Request Body:**
```json
{
    "session_id": "unique_session_id"
}
```

### `GET /health`
Health check endpoint.

## Frontend Components

The React frontend includes:

- **ChatApp**: Main component handling the chat interface
- **Message Display**: Shows user and bot messages with avatars
- **Input System**: Text input with keyboard shortcuts (Enter to send)
- **Feedback Buttons**: Like/dislike buttons for each bot response
- **Loading States**: Shows when the bot is thinking
- **Auto-scroll**: Automatically scrolls to new messages

## Key Features

### Chat Interface
- Clean, modern design similar to popular chat applications
- User messages appear on the right with blue styling
- Bot messages appear on the left with avatars
- Real-time message streaming

### Feedback System
- Users can provide feedback on each bot response
- Visual feedback (thumbs up/down buttons)
- Feedback is sent to the backend for processing

### Session Management
- Each browser session gets a unique session ID
- Chat history is maintained per session
- Sessions can be cleared individually

### Error Handling
- Network errors are caught and displayed to users
- Graceful degradation when the backend is unavailable
- User-friendly error messages

## Customization

### Styling
The CSS is embedded in the HTML template and can be customized by modifying the `<style>` section in `app_react.py`.

### Backend Integration
The application uses the same backend logic as the original Gradio version:
- `ChatBot.respond()` method for processing messages
- `UISettings.feedback()` method for handling feedback
- Same memory and configuration systems

### React Components
The React code is written in JSX and uses React Hooks. You can modify the component structure by editing the JavaScript section in the HTML template.

## Differences from Gradio Version

1. **Technology Stack**: Uses Flask + React instead of Gradio
2. **API-based**: RESTful API architecture instead of Gradio's built-in handling
3. **Customizable UI**: Full control over the user interface design
4. **Session Management**: Explicit session handling with unique IDs
5. **Modern Web Standards**: Uses modern HTML5, CSS3, and ES6+ JavaScript

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `app.run()` if 5000 is occupied
2. **CORS errors**: Make sure Flask-CORS is installed and configured
3. **Backend not responding**: Check that all dependencies are installed and API keys are configured

### Development Mode

The Flask app runs in debug mode by default, which provides:
- Automatic reloading on code changes
- Detailed error messages
- Debug console access

## Future Enhancements

Potential improvements could include:

1. **File Upload**: Add support for PDF file uploads
2. **Dark Mode**: Toggle between light and dark themes
3. **Export Chat**: Allow users to export chat history
4. **Voice Input**: Add speech-to-text functionality
5. **Multi-language**: Support for multiple languages
6. **Rich Text**: Support for markdown rendering in messages
