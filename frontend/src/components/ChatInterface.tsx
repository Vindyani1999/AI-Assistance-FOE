import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, ChatMessage, ChatSession } from '../services/api';
import './ChatInterface.css';

interface ChatInterfaceProps {
  sessionId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId = 'default' }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSpecificSessionId, setUserSpecificSessionId] = useState<string>(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate user-specific session ID
  const generateUserSessionId = (baseSessionId: string, userEmail: string) => {
    // Create a unique session ID that includes user identifier
    const userHash = btoa(userEmail).replace(/[+/=]/g, '').substring(0, 8);
    return `${baseSessionId}_user_${userHash}`;
  };

  // Get current user from localStorage
  useEffect(() => {
    const userSession = localStorage.getItem('user_session');
    const authToken = localStorage.getItem('auth_token');
    
    if (!userSession || !authToken) {
      // Redirect to home page if not authenticated
      navigate('/');
      return;
    }
    
    const user = JSON.parse(userSession);
    setCurrentUser(user);
    // Generate user-specific session ID
    const userSessionId = generateUserSessionId(sessionId, user.email);
    setUserSpecificSessionId(userSessionId);
  }, [sessionId, navigate]);

  const loadChatHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      console.log('[FRONTEND] Sending userId for getChatHistory:', userId);
      const history = await apiService.getChatHistory(userSpecificSessionId, userId);
      setMessages(history.conversation_history);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    }
  }, [currentUser, userSpecificSessionId]);

  const loadChatSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const userId = currentUser.email; // Use email as user identifier
      console.log('[FRONTEND] Sending userId for getChatSessions:', userId);
      const sessionsData = await apiService.getChatSessions(userId);
      setChatSessions(sessionsData.sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setSessionsError('Failed to load chat sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, [currentUser]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    if (currentUser && userSpecificSessionId) {
      loadChatHistory();
      loadChatSessions();
    }
  }, [userSpecificSessionId, currentUser, loadChatHistory, loadChatSessions]);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const formatMessage = (content: string): JSX.Element => {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');
    
    return (
      <div className="formatted-message">
        {paragraphs.map((paragraph, index) => {
          // Check if paragraph is a numbered list item (e.g., "1. **Sources**:")
          const numberedListMatch = paragraph.match(/^(\d+)\.\s*\*\*(.*?)\*\*:\s*([\s\S]*)/);
          if (numberedListMatch) {
            const [, number, title, content] = numberedListMatch;
            return (
              <div key={index} className="message-section">
                <div className="section-header">
                  <span className="section-number">{number}.</span>
                  <span className="section-title">{title}</span>
                </div>
                <div className="section-content">{content.trim()}</div>
              </div>
            );
          }

          // Check if paragraph starts with ** (bold heading)
          const boldHeadingMatch = paragraph.match(/^\*\*(.*?)\*\*:\s*([\s\S]*)/);
          if (boldHeadingMatch) {
            const [, title, content] = boldHeadingMatch;
            return (
              <div key={index} className="message-section">
                <div className="section-title-only">{title}</div>
                <div className="section-content">{content.trim()}</div>
              </div>
            );
          }

          // Regular paragraph with inline formatting
          const formattedText = paragraph
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            .replace(/`(.*?)`/g, '<code>$1</code>'); // Code text

          return (
            <div 
              key={index} 
              className="message-paragraph"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          );
        })}
      </div>
    );
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !currentUser) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const userId = currentUser.email; // Use email as user identifier
      console.log('[FRONTEND] Sending userId for sendMessage:', currentUser);
      console.log('[FRONTEND] Sending userId for sendMessage:', userId);
      const response = await apiService.sendMessage(userMessage, userSpecificSessionId, userId);
      // Add assistant response to UI
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
      // Refresh chat sessions to update metadata
      loadChatSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      // Remove the user message that failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      console.log('[FRONTEND] Sending userId for clearChat:', userId);
      await apiService.clearChat(userSpecificSessionId, userId);
      setMessages([]);
      setError(null);
      // Refresh chat sessions to update metadata
      loadChatSessions();
    } catch (error) {
      console.error('Error clearing chat:', error);
      setError('Failed to clear chat');
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'like' | 'dislike') => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      console.log('[FRONTEND] Sending userId for sendFeedback:', userId);
      await apiService.sendFeedback(userSpecificSessionId, messageIndex, feedbackType, userId);
      // You could add UI feedback here, like showing a success message
      console.log(`Feedback sent: ${feedbackType} for message ${messageIndex}`);
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className={`chat-interface ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <div className="left-sidebar">
        <div className="left-sidebar-header">
          <button
            onClick={() => navigate('/')}
            className="back-btn"
            title="Back to home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <img 
            src="/guidance.png" 
            alt="Guidance Agent" 
            className="guidance-agent-image"
            onError={(e) => {
              console.error('Failed to load Guidance Agent image');
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1>Guidance Agent</h1>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
          >
            {isDarkTheme ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
        
        <div className="chat-history-section">
          <h3>Chat History</h3>
          <div className="chat-history-list">
            {sessionsLoading ? (
              <div className="chat-history-loading">
                Loading chat history...
              </div>
            ) : sessionsError ? (
              <div className="chat-history-error">
                {sessionsError}
                <button 
                  onClick={loadChatSessions}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="chat-history-empty">
                No chat history yet. Start a conversation!
              </div>
            ) : (
              chatSessions.map((session) => (
                <div 
                  key={session.session_id}
                  className={`chat-history-item ${session.session_id === sessionId ? 'active' : ''}`}
                  onClick={() => {
                    if (session.session_id !== sessionId) {
                      // Navigate to this session (you might want to implement session switching)
                      window.location.href = `/chat/${session.session_id}`;
                    }
                  }}
                >
                  <div className="chat-title">{session.topic}</div>
                  <div className="chat-timestamp">
                    {session.message_count} messages • {formatTimeAgo(session.updated_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              Welcome! I'm your Guidance Agent. How can I assist you today?
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-container">
                {message.role === 'assistant' && (
                  <div className="message-avatar">
                    <img 
                      src="/openai.png" 
                      alt="AI Assistant" 
                      className="avatar-image"
                      onError={(e) => {
                        console.error('Failed to load OpenAI image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">
                    {message.role === 'assistant' ? formatMessage(message.content) : message.content}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="message-avatar">
                    <img 
                      src="/ai_rt.png" 
                      alt="User" 
                      className="avatar-image"
                      onError={(e) => {
                        console.error('Failed to load AI_RT image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              {message.role === 'assistant' && (
                <div className="message-actions">
                  <button
                    onClick={() => handleFeedback(index, 'like')}
                    className="feedback-btn like-btn"
                    title="Like this response"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleFeedback(index, 'dislike')}
                    className="feedback-btn dislike-btn"
                    title="Dislike this response"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H6.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-container">
                <div className="message-avatar">
                  <img 
                    src="/openai.png" 
                    alt="AI Assistant" 
                    className="avatar-image"
                    onError={(e) => {
                      console.error('Failed to load OpenAI image');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="chat-input-container">
          <div className="input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              rows={3}
              disabled={isLoading}
            />
            <div className="input-buttons">
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="input-btn send-btn"
                title="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </button>
              <button
                onClick={clearChat}
                className="input-btn clear-btn"
                title="Clear chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c-1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Quick Actions</h3>
          
          <button
            onClick={() => openExternalLink('https://www.youtube.com/watch?v=FwOTs4UxQS4')}
            className="agent-btn"
          >
            <img 
              src="/booking.png" 
              alt="Booking" 
              className="agent-btn-icon"
              onError={(e) => {
                console.error('Failed to load Booking image');
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="agent-btn-content">
              <span className="agent-btn-title">Booking Agent</span>
              <span className="agent-btn-description">Book lecture halls & facilities</span>
            </div>
          </button>
          
          <button
            onClick={() => openExternalLink('http://localhost:7862')}
            className="agent-btn"
          >
            <img 
              src="/planner.png" 
              alt="Planner" 
              className="agent-btn-icon"
              onError={(e) => {
                console.error('Failed to load Planner image');
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="agent-btn-content">
              <span className="agent-btn-title">Planner Agent</span>
              <span className="agent-btn-description">Plan academic time tables</span>
            </div>
          </button>
        </div>

        <div className="sidebar-section">
          <h3>Chat Statistics</h3>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Total Messages:</span>
              <span className="stat-value">{messages.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Your Messages:</span>
              <span className="stat-value">{messages.filter(m => m.role === 'user').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bot Responses:</span>
              <span className="stat-value">{messages.filter(m => m.role === 'assistant').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
