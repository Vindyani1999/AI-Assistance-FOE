import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// You can adjust these keys as per your auth logic
const isAuthenticated = () => {
  const userSession = localStorage.getItem('user_session');
  const authToken = localStorage.getItem('auth_token');
  return !!userSession && !!authToken;
};

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/' }) => {
  if (!isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
