
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import ChatInterface from './components/GuidanceAgent/ChatInterface';
import './App.css';
import './components/GlobalLoader/GlobalLoader.css';
import BookingChatInterface from './components/BookingAgent/BookingChatInterface';
import GlobalLoader from './components/GlobalLoader/GlobalLoader';
import { GlobalLoaderProvider, useGlobalLoader } from './context/GlobalLoaderContext';


const AppContent = () => {
  const { loading } = useGlobalLoader();
  return (
    <div className="App">
      <GlobalLoader show={loading} />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/guidance-chat" element={<ChatInterface />} />
          <Route path="/booking-chat" element={<BookingChatInterface />} />
        </Routes>
      </Router>
    </div>
  );
};

function App() {
  return (
    <GlobalLoaderProvider>
      <AppContent />
    </GlobalLoaderProvider>
  );
}

export default App;
