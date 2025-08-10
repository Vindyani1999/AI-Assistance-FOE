import axios from "axios";
import "./BookingChatInterface.css";
import FullCalendarComponent from "./FullCalendarComponent";
import React, { useEffect, useRef, useState } from "react";
import ChatUI from "../ChatUIComponent/ChatUI";
import QuickActions, { getQuickActionsExceptAgent } from "../QuickActions/QuickActions";

interface Message {
  role: "user" | "assistant";
  content: string | JSX.Element;
  recommendations?: Recommendation[];
  showRecommendations?: boolean;
}

interface Recommendation {
  type?: string;
  score?: number;
  reason?: string;
  suggestion?: {
    room_id?: string;
    room_name?: string;
    capacity?: number;
    description?: string;
    start_time?: string;
    end_time?: string;
    confidence?: number;
  };
  data_source?: string;
}

const RECOMMENDATION_TYPES = {
  alternative_room: '🏢 Alternative Room',
  proactive: '🎯 Proactive Suggestion',
  smart_scheduling: '🧠 Smart Scheduling',
  default: '💡 Recommendation'
} as const;


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

  const formatDate = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return timeString;
    }
  };

  
  const getDateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return { date: 'N/A', timeRange: 'N/A' };
    
    try {
      const date = formatDate(startTime);
      const startTimeFormatted = formatTime(startTime);
      const endTimeFormatted = formatTime(endTime);
      
      return {
        date,
        timeRange: `${startTimeFormatted} - ${endTimeFormatted}`
      };
    } catch {
      return { date: 'N/A', timeRange: 'N/A' };
    }
  };

  const getRecommendationType = (type: string) => {
    return RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES] || RECOMMENDATION_TYPES.default;
  };


  const bookRecommendation = async (recommendation: Recommendation) => {
    if (!recommendation.suggestion) {
      console.error("No suggestion data available for booking");
      return;
    }

    const { room_name, start_time, end_time } = recommendation.suggestion!;
    
    if (!room_name || !start_time || !end_time) {
      console.error("Missing required booking data:", { room_name, start_time, end_time });
      setError("Incomplete booking information. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      
      const date = startDate.toISOString().split('T')[0]; 
      const startTimeStr = startDate.toTimeString().slice(0, 5);
      const endTimeStr = endDate.toTimeString().slice(0, 5); 

      console.log("Booking details:", { room_name, date, startTimeStr, endTimeStr });

      const bookingMessage: Message = { 
        role: "user", 
        content: `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}` 
      };
      setMessages((prev) => [...prev, bookingMessage]);

      const response = await axios.post(
        "http://127.0.0.1:8000/ask_llm/",
        { 
          question: `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}`,
          session_id: sessionId 
        }
      );

      console.log("Booking API Response:", response.data);

      let responseContent = "";
      
      if (response.data.message) {
        responseContent = response.data.message;
      }

      if (response.data.status === "available" || response.data.booking_id) {
        responseContent = `✅ Successfully booked ${room_name}! ${response.data.message}`;
      } else if (response.data.status === "unavailable") {
        responseContent = `⚠️ ${response.data.message}`;
      } else if (response.data.status === "room_not_found") {
        responseContent = `❌ ${response.data.message}`;
      } else if (response.data.status === "missing_parameters") {
        responseContent = `❓ ${response.data.message}`;
      }

      const responseMessage: Message = {
        role: "assistant",
        content: responseContent || response.data.message || "Booking processed successfully!",
        recommendations: response.data.recommendations || [],
        showRecommendations: false
      };

      setMessages((prev) => [...prev, responseMessage]);
      handleChatUpdate();

    } catch (err) {
      console.error("Booking Error:", err);
      
      let errorMessage = "Failed to book the room. Please try again.";
      
      if (axios.isAxiosError(err) && err.response) {
        console.log("Error response data:", err.response.data);
        
        if (err.response.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            errorMessage = `❌ ${err.response.data.detail}`;
          } else if (err.response.data.detail.message) {
            errorMessage = `❌ ${err.response.data.detail.message}`;
          }
        } else if (err.response.data?.message) {
          errorMessage = `❌ ${err.response.data.message}`;
        }
      }

      const errorResponseMessage: Message = {
        role: "assistant",
        content: errorMessage
      };
      
      setMessages((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRecommendation = async (roomName: string, recommendation?: Recommendation) => {
    if (recommendation) {
      await bookRecommendation(recommendation);
    } else {
      setInputValue(`Book ${roomName}`);
      setTimeout(() => sendMessage(), 100);
    }
  };

  
  const formatMessageWithRecommendations = (text: string, recommendations?: Recommendation[]): JSX.Element => {
    return (
      <div>
        <div className={`recommendation-message-text ${recommendations && recommendations.length > 0 ? 'has-recommendations' : ''}`}>
          {text}
        </div>
        
        {recommendations && recommendations.length > 0 && (
          <div className="inline-recommendations">
            <div className={`recommendations-header ${isDarkTheme ? 'dark' : 'light'}`}>
              📋 Available Options:
            </div>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`inline-recommendation-card ${isDarkTheme ? 'dark' : 'light'}`}
                  onClick={() => handleBookRecommendation(rec.suggestion?.room_name || 'Unknown Room')}
                >
                  <div className="recommendation-header">
                    <span className={`recommendation-type-badge ${isDarkTheme ? 'dark' : 'light'}`}>
                      {getRecommendationType(rec.type || 'recommendation')}
                    </span>
                    {rec.score && (
                      <span className={`score-badge ${rec.score >= 0.8 ? 'high' : rec.score >= 0.6 ? 'medium' : 'low'}`}>
                        {Math.round(rec.score * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="room-header">
                    <h4 className={`room-name ${isDarkTheme ? 'dark' : 'light'}`}>
                      {rec.suggestion?.room_name || 'Unknown Room'}
                    </h4>
                    
                    {rec.suggestion?.description && (
                      <p className={`room-description ${isDarkTheme ? 'dark' : 'light'}`}>
                        {rec.suggestion.description}
                      </p>
                    )}
                  </div>

                  <div className="room-details">
                    {rec.suggestion?.capacity && (
                      <div className={`detail-item ${isDarkTheme ? 'dark' : 'light'}`}>
                        <span className="detail-icon">👥</span>
                        <strong>Capacity : </strong> {rec.suggestion.capacity} people
                      </div>
                    )}

                    {rec.suggestion?.start_time && rec.suggestion?.end_time && (
                      <>
                        <div className={`detail-item date ${isDarkTheme ? 'dark' : 'light'}`}>
                          <span className="detail-icon">📅</span>
                          <strong>Date :</strong> {getDateTimeRange(rec.suggestion.start_time, rec.suggestion.end_time).date}
                        </div>
                        <div className={`detail-item time ${isDarkTheme ? 'dark' : 'light'}`}>
                          <span className="detail-icon">🕐</span>
                          <strong>Time :</strong> {getDateTimeRange(rec.suggestion.start_time, rec.suggestion.end_time).timeRange}
                        </div>
                      </>
                    )}

                    {rec.reason && (
                      <div className={`detail-item reason ${isDarkTheme ? 'dark' : 'light'}`}>
                        <span className="detail-icon">💡</span>
                        <span><strong>Why : </strong> {rec.reason}</span>
                      </div>
                    )}

                    {rec.data_source && (
                      <div className={`detail-item source ${isDarkTheme ? 'dark' : 'light'}`}>
                        <span className="detail-icon">🔍</span>
                        Source: {rec.data_source.replace('mysql_', '').replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  <button
                    className={`book-button ${isDarkTheme ? 'dark' : 'light'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Book button clicked for:', rec.suggestion?.room_name);
                      handleBookRecommendation(rec.suggestion?.room_name || 'Unknown Room', rec);
                    }}
                    disabled={isLoading}
                  >
                    <span className="book-button-icon">📅</span>
                    {isLoading ? 'Booking...' : 'Book This Room'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
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

      console.log("Full API Response:", response.data); 

      let responseContent = "";
      let recommendations: Recommendation[] = [];
      let showRecommendations = false;
      
      if (response.data.message) {
        responseContent = response.data.message;
      }

      if (response.data.recommendations && response.data.recommendations.length > 0) {
        recommendations = response.data.recommendations;
        showRecommendations = true;
      }

      if (response.data.status === "unavailable" || response.data.status === "no_slots_available") {
        if (response.data.message && response.data.message.includes("already booked for that time")) {
          showRecommendations = true;
        }
      }

      if (response.data.status === "room_not_found") {
        responseContent = `❌ ${response.data.message}`;
        showRecommendations = false;
      } else if (response.data.status === "unavailable") {
        responseContent = `⚠️ ${response.data.message}`;
        showRecommendations = response.data.message && 
                             response.data.message.includes("already booked for that time") && 
                             recommendations.length > 0;
      } else if (response.data.status === "available") {
        responseContent = `✅ ${response.data.message}`;
      } else if (response.data.status === "missing_parameters") {
        responseContent = `❓ Please provide more information: ${response.data.message}`;
      } else if (response.data.status === "no_slots_available") {
        responseContent = `⚠️ ${response.data.message}`;
        showRecommendations = response.data.message && 
                             response.data.message.includes("already booked for that time") && 
                             recommendations.length > 0;
      }


      // Fake API call
      setTimeout(() => {
        const responseMessage: Message = {
          role: "assistant",
          content: showRecommendations ? 
            formatMessageWithRecommendations(responseContent || "I couldn't process your request. Please try again.", recommendations) :
            (responseContent || `${response.data.message}`),
          recommendations: recommendations,
          showRecommendations: showRecommendations
        };
        setMessages((prev) => [...prev, responseMessage]);
        setIsLoading(false);
      }, 1000);
      handleChatUpdate();
    } catch (err) {
      console.error("API Error:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        console.log("Error response data:", err.response.data);
        
        if (err.response.data?.detail && typeof err.response.data.detail === 'object') {
          let errorContent = `❌ ${err.response.data.detail.message || err.response.data.detail.error}`;
          let recommendations: Recommendation[] = [];
          let showRecommendations = false;
          
          if (err.response.data.detail.recommendations && err.response.data.detail.recommendations.length > 0) {
            recommendations = err.response.data.detail.recommendations;
            showRecommendations = (errorContent.includes("already booked for that time") || 
                                  errorContent.includes("Here are some available alternatives"));
          }
          
          const errorMessage: Message = {
            role: "assistant",
            content: showRecommendations ? 
              formatMessageWithRecommendations(errorContent, recommendations) :
              errorContent,
            recommendations: recommendations,
            showRecommendations: showRecommendations
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
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
    return text; 
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
