import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes';
import { GlobalLoaderProvider } from './context/GlobalLoaderContext';
import HomePage from './components/HomePage/HomePage';
import ChatInterface from './components/GuidanceAgent/ChatInterface';
import BookingChatInterface from './components/BookingAgent/BookingChatInterface';
import PlannerChatInterface from './components/PlannerAgent/PlannerChatInterface';
import GlobalLoader from './components/GlobalLoader/GlobalLoader';
import './App.css';
import './components/GlobalLoader/GlobalLoader.css';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/MainLayout';

const LoaderOnRouteChange: React.FC = () => {
  const { loading, showLoader, hideLoader } = require('./context/GlobalLoaderContext').useGlobalLoader();
  const location = require('react-router-dom').useLocation();
  React.useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname, showLoader, hideLoader]);
  return <GlobalLoader show={loading} />;
};

function App() {
  return (
    <ThemeProvider>
      <GlobalLoaderProvider>
        <NotificationProvider>
          <Router>
            <LoaderOnRouteChange />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route element={<ProtectedRoute/>}>
                <Route element={<MainLayout />}>
                  <Route path="/guidance-chat" element={<ChatInterface />} />
                  <Route path="/booking-chat" element={<BookingChatInterface />} />
                  <Route path="/planner-chat" element={<PlannerChatInterface />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </GlobalLoaderProvider>
    </ThemeProvider>
  );
}

export default App;
