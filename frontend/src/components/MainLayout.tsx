import React from "react";
import { Outlet } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import { MainLayoutProps } from "../utils/types";

const MainLayout: React.FC<MainLayoutProps> = ({
  userProfile,
  agents,
  onLogout,
}) => {
  return (
    <div
      className="landing-page-container"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <LandingPage
        userProfile={userProfile}
        agents={agents}
        onLogout={onLogout}
      />
      <main className="main-content-area" style={{ flex: 1 }}>
        {/* pass agents down to nested routes via Outlet context so children (eg Dashboard) can read allowed agents */}
        <Outlet context={{ agents }} />
      </main>
    </div>
  );
};

export default MainLayout;
