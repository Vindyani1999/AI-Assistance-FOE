import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatInterface />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
