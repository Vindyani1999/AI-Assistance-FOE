import axios from "axios";
import "./BookingChatInterface.css";
import FullCalendarComponent from "./FullCalendarComponent";
import React, { useEffect, useRef, useState } from "react";
import ChatUI from "../ChatUIComponent/ChatUI";
import QuickActions, { getQuickActionsExceptAgent } from "../QuickActions/QuickActions";

interface Message {
  role: "user" | "assistant";
  content: string;
}


const BookingChatInterface: React.FC = () => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  //remove
  const [sessionId, setSessionId] = useState("");

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [refreshCalendar, setRefreshCalendar] = useState(0);
  const [calendarCellInfo, setCalendarCellInfo] = useState<any>(null);

  // Called when chat updates
  const handleChatUpdate = () => {
    setRefreshCalendar(prev => prev + 1); // increment to trigger refresh
  };
  const sendMessage = async () => {
    
    if (!inputValue.trim()) return;
    const newMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {

      const response = await axios.post(
      "http://127.0.0.1:8000/ask_llm/",
       { question: inputValue, session_id: sessionId }
    );


      // Fake API call
      setTimeout(() => {
        const responseMessage: Message = {
          role: "assistant",
          content: `${response.data.message}`,
        };
        setMessages((prev) => [...prev, responseMessage]);
        setIsLoading(false);
      }, 1000);
      handleChatUpdate();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  const formatMessage = (text: string): string => {
    return text; // Modify if you need to style/format
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div
        className={`chat-interface ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}
        style={isDarkTheme ? { background: '#383838' } : {}}
      >
        <div
          className="left-sidebar-header"
          style={isDarkTheme ? { background: '#383838' } : {}}
        >
          <button
            className="back-btn"
            title="Back to home"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src="/guidance.png"
            alt="Guidance Agent"
            className="guidance-agent-image"
            onError={(e) => {
              console.error("Failed to load Guidance Agent image");
              e.currentTarget.style.display = "none";
            }}
          />
          <h1>Booking Agent</h1>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
          >
            {isDarkTheme ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <QuickActions actions={getQuickActionsExceptAgent("booking")} />
        </div>

        <ChatUI
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          onClear={clearChat}
          onKeyPress={handleKeyPress}
          formatMessage={formatMessage}
          agentName="Booking Agent" 
        />
        <div
          className="left-sidebar-booking"
          style={isDarkTheme ? { background: '#383838' } : {}}
        >
          <h4>Booking Calendar</h4>
          <div className="calendar-scroll-container" style={isDarkTheme ? { background: '#383838' } : {}}>
            {/* Style the select room label for dark theme */}
            <style>{`
              .left-sidebar-booking .MuiInputLabel-root {
                color: ${isDarkTheme ? '#e0baba' : '#5A3232'} !important;
              }
            `}</style>
            <FullCalendarComponent refreshKey={refreshCalendar} onCellClick={setCalendarCellInfo} />
          </div>
          {calendarCellInfo ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <div
                className={`calendar-status-card${isDarkTheme ? ' dark' : ' light'}`}
                style={{
                  borderRadius: 10,
                  boxShadow: isDarkTheme
                    ? '0 2px 12px rgba(30,30,60,0.25)'
                    : '0 2px 12px rgba(90,50,50,0.10)',
                  padding: '1.2rem 2rem',
                  minWidth: 260,
                  border: isDarkTheme ? '1px solid #333' : '1px solid #e1e1e1',
                  background: isDarkTheme ? '#23232b' : '#fff',
                  color: isDarkTheme ? '#f3f3f3' : '#222',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                <div style={{marginBottom: 8, fontWeight: 700, fontSize: '1.08rem', color: isDarkTheme ? '#e0baba' : '#5A3232'}}>Selected Cell</div>
                {/* <div>Date: <b>{calendarCellInfo.date}</b></div>
                <div>All Day: <b>{calendarCellInfo.allDay ? 'Yes' : 'No'}</b></div> */}
                {calendarCellInfo.resource && <div>Resource: <b>{calendarCellInfo.resource}</b></div>}
                {calendarCellInfo.booking ? (
                  <>
                    <div>Lecturer: <b>{calendarCellInfo.booking.lecturer || 'N/A'}</b></div>
                    <div>Hall: <b>{calendarCellInfo.booking.hall || 'N/A'}</b></div>
                    <div>Duration: <b>{calendarCellInfo.booking.duration || 'N/A'}</b></div>
                    <div>Description: <b>{calendarCellInfo.booking.description || 'N/A'}</b></div>
                  </>
                ) : (
                  <div style={{marginTop: 8, color: isDarkTheme ? '#aaa' : '#888'}}>No booking yet for this slot.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
export default BookingChatInterface;
