import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ChatInterface from './components/ChatInterface';
import './App.css';
import BookingChatInterface from './components/BookingChatInterface/BookingChatInterface';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/booking-chat" element={<BookingChatInterface />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
