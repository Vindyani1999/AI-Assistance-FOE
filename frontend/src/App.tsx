import React from "react";
// import AuthPage from './components/AuthForms/AuthPage';
import "./App.css";
import "./components/GlobalLoader/GlobalLoader.css";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
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

const AuthLogoutListener: React.FC = () => {
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { logout } = useAuth();

  React.useEffect(() => {
    const handler = (e: any) => {
      try {
        logout();
      } catch (err) {
        // ignore
      }
      try {
        notify("error", "Session expired", "Please sign in again.");
      } catch (err) {
        // ignore
      }
      try {
        navigate("/");
      } catch (err) {
        window.location.href = "/";
      }
    };
    window.addEventListener("auth:logout", handler as EventListener);
    return () =>
      window.removeEventListener("auth:logout", handler as EventListener);
  }, [navigate, notify, logout]);

  return null;
};

export const Guidance_Base_URL = process.env.REACT_APP_API_BASE_GUIDANCE;
export const Auth_Base_URL = process.env.REACT_APP_API_BASE_AUTH;
export const Booking_Base_URL = process.env.REACT_APP_API_BOOKING;

const App: React.FC = () => {
  // App itself only sets up providers; routing decision happens inside AuthGate

  return (
    <ThemeProvider>
      <AuthProvider>
        <GlobalLoaderProvider>
          <NotificationProvider>
            <Router>
              <AuthGate />
            </Router>
          </NotificationProvider>
        </GlobalLoaderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated, authChecked, userProfile, checkAuth, logout } =
    useAuth();
  const allowedAgents = getAllowedAgents(
    (userProfile && userProfile.email) || undefined
  );

  if (!authChecked) return null;

  if (!isAuthenticated) {
    return (
      <GlobalLoaderProvider>
        <NotificationProvider>
          <HomePage
            onAuthSuccess={async () => {
              await checkAuth();
            }}
          />
        </NotificationProvider>
      </GlobalLoaderProvider>
    );
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <>
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
          <Route path="documentation" element={<DocumentationSection />} />
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
    </>
  );
};
export default App;
