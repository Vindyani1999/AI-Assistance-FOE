


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_history: ChatMessage[];
  session_id: string;
}

export interface FeedbackRequest {
  session_id: string;
  message_index: number;
  feedback_type: 'like' | 'dislike';
  user_id?: string;
}

export interface ChatSession {
  session_id: string;
  topic: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total_count: number;
}



class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  // Send a chat message to the backend
  async sendMessage(message: string, sessionId: string = 'default', userId?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send feedback for a message
  async sendFeedback(sessionId: string, messageIndex: number, feedbackType: 'like' | 'dislike', userId?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_index: messageIndex,
          feedback_type: feedbackType,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      throw error;
    }
  }

  // Clear chat history
  async clearChat(sessionId: string = 'default', userId?: string): Promise<void> {
    try {
      const url = new URL(`${this.baseUrl}/chat/${sessionId}`);
      if (userId) {
        url.searchParams.append('user_id', userId);
      }
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  }

  // Get chat history
  async getChatHistory(sessionId: string = 'default', userId?: string): Promise<{ conversation_history: ChatMessage[]; session_id: string }> {
    try {
      const url = new URL(`${this.baseUrl}/chat/${sessionId}/history`);
      if (userId) {
        url.searchParams.append('user_id', userId);
      }
      
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; active_sessions: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // Get all chat sessions
  async getChatSessions(userId?: string): Promise<ChatSessionsResponse> {
    try {
      const url = new URL(`${this.baseUrl}/chat/sessions`);
      if (userId) {
        url.searchParams.append('user_id', userId);
      }
      
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
