import React, { useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { ChatUIProps } from "../../utils/types";

const ChatUI: React.FC<ChatUIProps> = ({
  messages,
  inputValue,
  setInputValue,
  isLoading,
  error,
  onSend,
  onClear,
  onKeyPress,
  formatMessage = (text) => text,
  agentName = "Guidance Agent",
  onAppendMessages,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { theme } = useTheme();
  return (
    <div className={`chat-container${theme === "dark" ? " dark-theme" : ""}`}>
      <div className="chat-messages">
        {messages.length === 0 && (
            <div className="welcome-message">
              Welcome! I'm your {agentName}.
            </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-container">
              {message.role === "assistant" && (
                <div className="message-avatar">
                  <img
                    src="/openai.png"
                    alt="AI Assistant"
                    className="avatar-image"
                    onError={(e) => {
                      console.error("Failed to load OpenAI image");
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </div>
              )}
              <div className="message-content">
                <div className="message-text">
                  {message.role === "assistant"
                    ? typeof message.content === "string"
                      ? formatMessage(message.content)
                      : message.content
                    : message.content}
                </div>
              </div>
              {message.role === "user" && (
                <div className="message-avatar">
                  <img
                    src="/ai_rt.png"
                    alt="User"
                    className="avatar-image"
                    onError={(e) => {
                      console.error("Failed to load AI_RT image");
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </div>
              )}
            </div>
            {message.role === "assistant" && (
              <div className="message-actions">
                <button
                  // onClick={() => console.log("Liked")}
                  className="feedback-btn like-btn"
                  title="Like this response"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <button
                  // onClick={() => console.log("Disliked")}
                  className="feedback-btn dislike-btn"
                  title="Dislike this response"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H6.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
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
                    console.error("Failed to load OpenAI image");
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
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
        {error && <div className="error-message">{error}</div>}
      </div>
      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Type a message..."
            className="chat-input"
            rows={3}
            disabled={isLoading}
          />
          <div className="input-buttons">
            <button
              onClick={onSend}
              disabled={isLoading || !inputValue.trim()}
              className="input-btn send-btn"
              title="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
            </button>
            <button
              onClick={onClear}
              className="input-btn clear-btn"
              title="Clear chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c-1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
