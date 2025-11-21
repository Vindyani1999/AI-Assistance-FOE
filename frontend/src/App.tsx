import React, { useEffect, useState } from "react";
// import AuthPage from './components/AuthForms/AuthPage';
import "./App.css";
import "./components/GlobalLoader/GlobalLoader.css";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GlobalLoaderProvider } from "./context/GlobalLoaderContext";
import HomePage from "./components/HomePage/HomePage";
import ChatInterface from "./components/GuidanceAgent/ChatInterface";
import BookingChatInterface from "./components/BookingAgent/BookingChatInterface";
import PlannerChatInterface from "./components/PlannerAgent/PlannerChatInterface";
import GlobalLoader from "./components/GlobalLoader/GlobalLoader";
import {
  NotificationProvider,
  useNotification,
} from "./context/NotificationContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Dashboard from "./components/LandingPage/Dashboard";
import DocumentationSection from "./components/Documentation/DocumentationSection";
import UserProfile from "./components/UserProfile/UserProfile";
import { Navigate } from "react-router-dom";
import { getAllowedAgents } from "./utils/roleUtils";
// const HomePage = require('./components/HomePage/HomePage').default;
//     const { Router } = require('react-router-dom');

const LoaderOnRouteChange: React.FC = () => {
  const { loading, showLoader, hideLoader } =
    require("./context/GlobalLoaderContext").useGlobalLoader();
  const location = require("react-router-dom").useLocation();
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
  // agentCardData is available but we compute allowedAgents per-user below
  const allowedAgents = getAllowedAgents(userProfile?.email);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        setIsAuthenticated(false);
        setUserProfile(null);
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch(process.env.REACT_APP_AUTH_URL + '/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        const newToken = response.headers.get("x-access-token");
        if (newToken) {
          localStorage.setItem("auth_token", newToken);
        }
        if (response.ok) {
          const profile = await response.json();
          setIsAuthenticated(true);
          setUserProfile(profile);
        } else {
          localStorage.removeItem("auth_token");
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch {
        localStorage.removeItem("auth_token");
        setIsAuthenticated(false);
        setUserProfile(null);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setUserProfile(null);
  }

  // Component mounted inside the authenticated area to listen for global auth logout events
  const AuthLogoutListener: React.FC = () => {
    const { notify } = useNotification();
    const navigate = useNavigate();

    React.useEffect(() => {
      const handler = (e: any) => {
        // Clear client state
        handleLogout();
        try {
          notify("error", "Session expired", "Please sign in again.");
        } catch (err) {
          // ignore if notification not available
        }
        // Navigate to home/login page
        try {
          navigate("/");
        } catch (err) {
          // fallback to full reload
          window.location.href = "/";
        }
      };
      window.addEventListener("auth:logout", handler as EventListener);
      return () =>
        window.removeEventListener("auth:logout", handler as EventListener);
    }, [navigate, notify]);

    return null;
  };

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
                  const authToken = localStorage.getItem("auth_token");
                  if (!authToken) return;
                  try {
                    const response = await fetch(process.env.REACT_APP_AUTH_URL + '/auth/me', {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    const newToken = response.headers.get('x-access-token');
                    if (newToken) {
                      localStorage.setItem("auth_token", newToken);
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
            <AuthLogoutListener />
            <LoaderOnRouteChange />
            <Routes>
              <Route
                path="/"
                element={
                  <MainLayout
                    userProfile={userProfile}
                    agents={allowedAgents}
                    onLogout={handleLogout}
                  />
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route
                  path="documentation"
                  element={<DocumentationSection />}
                />
                <Route
                  path="profile"
                  element={<UserProfile userProfile={userProfile} />}
                />
                <Route path="guidance-chat" element={<ChatInterface />} />
                <Route
                  path="booking-chat"
                  element={
                    allowedAgents.some((a) => a.id === "booking") ? (
                      <BookingChatInterface />
                    ) : (
                      <Navigate to="guidance-chat" replace />
                    )
                  }
                />
                <Route
                  path="planner-chat"
                  element={
                    allowedAgents.some((a) => a.id === "planner") ? (
                      <PlannerChatInterface />
                    ) : (
                      <Navigate to="guidance-chat" replace />
                    )
                  }
                />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </GlobalLoaderProvider>
    </ThemeProvider>
  );
};
export default App;
