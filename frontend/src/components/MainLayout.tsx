import React from 'react';
import { Outlet } from 'react-router-dom';
import LandingPage from './LandingPage/LandingPage';

// You may want to pass props to LandingPage, e.g. userProfile, agents, onLogout
// For now, we'll just render the sidebar and Outlet for main content

const MainLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <LandingPage userProfile={{}} agents={[]} onLogout={() => {}} />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
