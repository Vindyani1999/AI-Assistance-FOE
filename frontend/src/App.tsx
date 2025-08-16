import React, { useEffect, useState } from 'react';
// import AuthPage from './components/AuthForms/AuthPage';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import LandingPage from './components/LandingPage/LandingPage';
import { agentCardData } from './utils/AgentCardData';
// const HomePage = require('./components/HomePage/HomePage').default;
//     const { Router } = require('react-router-dom');

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

const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const agents = agentCardData;

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setIsAuthenticated(false);
        setUserProfile(null);
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        const newToken = response.headers.get('x-access-token');
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
        }
        if (response.ok) {
          const profile = await response.json();
          setIsAuthenticated(true);
          setUserProfile(profile);
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUserProfile(null);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUserProfile(null);
  }

  if (!authChecked) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <GlobalLoaderProvider>
          <NotificationProvider>
            <Router>
              <HomePage
                onAuthSuccess={async () => {
                  const authToken = localStorage.getItem('auth_token');
                  if (!authToken) return;
                  try {
                    const response = await fetch('http://localhost:5000/auth/me', {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    const newToken = response.headers.get('x-access-token');
                    if (newToken) {
                      localStorage.setItem('auth_token', newToken);
                    }
                    if (response.ok) {
                      const profile = await response.json();
                      setIsAuthenticated(true);
                      setUserProfile(profile);
                    }
                  } catch {
                    // ignore
                  }
                }}
              />
            </Router>
          </NotificationProvider>
        </GlobalLoaderProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <GlobalLoaderProvider>
        <NotificationProvider>
          <Router>
            <LoaderOnRouteChange />
            <Routes>
              <Route path="/" element={<LandingPage agents={agents} userProfile={userProfile} onLogout={handleLogout} />} />
              <Route element={<MainLayout />}>
                <Route path="/guidance-chat" element={<ChatInterface />} />
                <Route path="/booking-chat" element={<BookingChatInterface />} />
                <Route path="/planner-chat" element={<PlannerChatInterface />} />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </GlobalLoaderProvider>
    </ThemeProvider>
  );
}
export default App;