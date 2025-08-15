import React from 'react';
import { Outlet } from 'react-router-dom';
import LoginForm from '../components/AuthForms/LoginForm';

const isAuthenticated = () => {
  const authToken = localStorage.getItem('auth_token');
  return !!authToken;
};

const ProtectedRoute: React.FC = () => {
  if (!isAuthenticated()) {
    return <LoginForm />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
