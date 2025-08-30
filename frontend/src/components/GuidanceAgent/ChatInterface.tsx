import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, ChatMessage, ChatSession, fetchUserEmailFromProfile } from '../../services/api';
import './ChatInterface.css';
import { useTheme } from '../../context/ThemeContext';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';

interface ChatInterfaceProps {
  sessionId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId = 'default' }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
    // Create a new chat session for the user
    const handleNewChat = async () => {
      if (!currentUser) return;
      try {
        // Call API to create a new chat session with user email
        const newSession = await apiService.createNewChatSession(currentUser.email);
        // Use backend session_id directly
        setUserSpecificSessionId(newSession.session_id);
        setMessages([]);
        loadChatSessions();
      } catch (error) {
        console.error('Error creating new chat session:', error);
        setError('Failed to start a new chat.');
      }
    };
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSpecificSessionId, setUserSpecificSessionId] = useState<string>(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user email from /auth/me endpoint
  useEffect(() => {
    async function fetchUser() {
      const email = await fetchUserEmailFromProfile();
      if (email) {
        setCurrentUser({ email });
      } else {
        setCurrentUser(null);
      }
    }
    fetchUser();
    // Use backend sessionId directly
    setUserSpecificSessionId(sessionId);
  }, [sessionId, navigate]);

  const loadChatHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      const history = await apiService.getChatHistory(userSpecificSessionId, userId);
      setMessages(history.conversation_history);
    } catch (error) {
      setError('Failed to load chat history');
    }
  }, [currentUser, userSpecificSessionId]);

  const loadChatSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const userId = currentUser.email; // Use email as user identifier
      const sessionsData = await apiService.getChatSessions(userId);
      setChatSessions(sessionsData.sessions);
    } catch (error) {
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

  // const formatTimeAgo = (timestamp: string): string => {
  //   const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  //   const messageTime = new Date(new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  //   const diffInMs = now.getTime() - messageTime.getTime();
  //   const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  //   if (diffInHours < 1) {
  //     return 'Just now';
  //   } else if (diffInHours < 24) {
  //     return `${diffInHours}h ago`;
  //   } else {
  //     const diffInDays = Math.floor(diffInHours / 24);
  //     return `${diffInDays}d ago`;
  //   }
  // };

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

    // Debugging: log userId and sessionId before sending

    try {
      const response = await apiService.sendMessage(userMessage, userSpecificSessionId);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
      loadChatSessions();
    } catch (error) {
      setError('Failed to send message. Please try again.');
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

  // const clearChat = async () => {
  //   if (!currentUser) return;
  //   try {
  //     const userId = currentUser.email; // Use email as user identifier
  //     console.log('[FRONTEND] Sending userId for clearChat:', userId);
  //     await apiService.clearChat(userSpecificSessionId, userId);
  //     setMessages([]);
  //     setError(null);
  //     // Refresh chat sessions to update metadata
  //     loadChatSessions();
  //   } catch (error) {
  //     console.error('Error clearing chat:', error);
  //     setError('Failed to clear chat');
  //   }
  // };

  const handleFeedback = async (messageIndex: number, feedbackType: 'like' | 'dislike') => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      await apiService.sendFeedback(userSpecificSessionId, messageIndex, feedbackType, userId);
      // You could add UI feedback here, like showing a success message
      // console.log(`Feedback sent: ${feedbackType} for message ${messageIndex}`);
    } catch (error) {
      // console.error('Error sending feedback:', error);
    }
  };

  return (
  <div className={`chat-interface ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}> 
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
                onClick={handleNewChat}
                className="input-btn new-chat-btn"
                title="Start a new chat"
              >
                <LibraryAddIcon />
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="sidebar">
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
              [...chatSessions].map((session) => (
                <div 
                  key={session.session_id}
                  className={`chat-history-item ${session.session_id === userSpecificSessionId ? 'active' : ''}`}
                  onClick={() => {
                    if (session.session_id !== userSpecificSessionId) {
                      setUserSpecificSessionId(session.session_id);
                      setMessages([]);
                      // Chat history will reload automatically via useEffect
                    }
                  }}
                >
                  <div className="chat-title">{session.topic.split(' ').slice(0, 4).join(' ')}{session.topic.split(' ').length > 4 ? '...' : ''}</div>
                  {/* <div className="chat-timestamp">
                    {session.message_count} messages • {formatTimeAgo(session.updated_at)}
                  </div> */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
