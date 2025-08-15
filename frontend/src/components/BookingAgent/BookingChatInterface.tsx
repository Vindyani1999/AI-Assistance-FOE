import axios from "axios";
import "./BookingChatInterface.css";
import FullCalendarComponent from "./FullCalendarComponent";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from '../../context/ThemeContext';
import ChatUI from "../ChatUIComponent/ChatUI";

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
  const [sessionId] = useState("");

  const { theme } = useTheme();

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
    <div style={{ display: 'flex', gap: '2rem', width: '100%', height: '100vh' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
      </div>
  <div style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <h4>Booking Calendar</h4>
        <div className="calendar-scroll-container" style={theme === 'dark' ? { background: '#383838' } : {}}>
              <style>{`
                .calendar-scroll-container .MuiInputLabel-root {
                  color: ${theme === 'dark' ? '#e0baba' : '#5A3232'} !important;
                }
                .calendar-scroll-container .fc,
                .calendar-scroll-container .fc .fc-col-header-cell,
                .calendar-scroll-container .fc .fc-timegrid-axis,
                .calendar-scroll-container .fc .fc-event {
                  color: ${theme === 'dark' ? '#f3f3f3' : '#5A3232'} !important;
                }
              `}</style>
          <FullCalendarComponent refreshKey={refreshCalendar} onCellClick={setCalendarCellInfo} />
        </div>
        {calendarCellInfo ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <div
              className={`calendar-status-card${theme === 'dark' ? ' dark' : ' light'}`}
              style={{
                borderRadius: 10,
                boxShadow: theme === 'dark'
                  ? '0 2px 12px rgba(30,30,60,0.25)'
                  : '0 2px 12px rgba(90,50,50,0.10)',
                padding: '1.2rem 2rem',
                minWidth: 260,
                border: theme === 'dark' ? '1px solid #333' : '1px solid #e1e1e1',
                background: theme === 'dark' ? '#23232b' : '#fff',
                color: theme === 'dark' ? '#f3f3f3' : '#222',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              <div style={{marginBottom: 8, fontWeight: 700, fontSize: '1.08rem', color: theme === 'dark' ? '#e0baba' : '#5A3232'}}>Selected Cell</div>
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
                <div style={{marginTop: 8, color: theme === 'dark' ? '#aaa' : '#888'}}>No booking yet for this slot.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default BookingChatInterface;
