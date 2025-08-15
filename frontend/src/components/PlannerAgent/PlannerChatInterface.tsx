import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ChatUI from "../ChatUIComponent/ChatUI";
import "../BookingAgent/BookingChatInterface.css";

const semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];
const departments = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
const subjects = ["Mathematics", "Physics", "Chemistry", "AI", "ML", "DS", "DBMS", "OS"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PlannerChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dropdown states
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");
    // Simulate API call
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Planner response for: " + inputValue }]);
      setIsLoading(false);
    }, 1000);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`chat-interface ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}
      style={isDarkTheme ? { background: '#383838', display: 'flex', minHeight: '100vh' } : { display: 'flex', minHeight: '100vh' }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatUI
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          onClear={clearChat}
          onKeyPress={handleKeyPress}
          formatMessage={t => t}
          agentName="Planner Agent"
        />
      </div>
      <div
        className="right-sidebar-planner"
        style={isDarkTheme
          ? { background: '#383838', minWidth: 320, padding: '2rem 1.5rem', borderLeft: '1px solid #444' }
          : { background: '#DDDDDD', minWidth: 320, padding: '2rem 1.5rem', borderLeft: '1px solid #e1e1e1' }}
      >
        <h4 style={{ color: isDarkTheme ? '#e0baba' : '#5A3232', marginBottom: 24 }}>Planner Filters</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: isDarkTheme ? '#e0baba' : '#5A3232', fontWeight: 600 }}>Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #aaa', marginTop: 6, background: isDarkTheme ? '#23232b' : '#fff', color: isDarkTheme ? '#f3f3f3' : '#222' }}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: isDarkTheme ? '#e0baba' : '#5A3232', fontWeight: 600 }}>Department</label>
          <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #aaa', marginTop: 6, background: isDarkTheme ? '#23232b' : '#fff', color: isDarkTheme ? '#f3f3f3' : '#222' }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: isDarkTheme ? '#e0baba' : '#5A3232', fontWeight: 600 }}>Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #aaa', marginTop: 6, background: isDarkTheme ? '#23232b' : '#fff', color: isDarkTheme ? '#f3f3f3' : '#222' }}>
            <option value="">Select Subject</option>
            {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PlannerChatInterface;
