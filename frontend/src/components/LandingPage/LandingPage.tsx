import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// dashboard content moved to separate Dashboard component
import { useTheme } from "../../context/ThemeContext";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
// import VerticalSplitIcon  from '@mui/icons-material/VerticalSplit';
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import "./LandingPage.css";
// sidebar only — dashboard and other content live in route components
import { LandingPageProps } from "../../utils/types";

const LandingPage: React.FC<LandingPageProps> = ({
  userProfile,
  agents,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "documentation" | "profile" | string
  >("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  // derive active tab from current pathname
  React.useEffect(() => {
    const path = location.pathname.replace(/^\//, "");
    if (path.startsWith("guidance")) setActiveTab("guidance");
    else if (path.startsWith("booking")) setActiveTab("booking");
    else if (path.startsWith("planner")) setActiveTab("planner");
    else if (path.startsWith("documentation")) setActiveTab("documentation");
    else if (path.startsWith("profile")) setActiveTab("profile");
    else setActiveTab("dashboard");
  }, [location.pathname]);
  const [agentsDropdownOpen, setAgentsDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Provide default agents if none are passed
  const defaultAgents = [
    { id: "planner", name: "Planner Agent" },
    { id: "guidance", name: "Guidance Agent" },
    { id: "booking", name: "Booking Agent" },
  ];
  const agentsList = agents && agents.length > 0 ? agents : defaultAgents;

  // sidebar only — route components render into the Outlet in MainLayout

  return (
    <>
      <aside className={`sidebar-landing${collapsed ? " collapsed" : ""}`}>
        <div className="sidebar-top-row">
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <MenuIcon /> : <KeyboardDoubleArrowLeftIcon />}
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
        )}
        <nav className="sidebar-nav">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => navigate("/dashboard")}
          >
            <DashboardIcon
              style={{
                marginRight: collapsed ? 0 : "0.5rem",
                verticalAlign: "middle",
              }}
            />
            {!collapsed && "Dashboard"}
          </button>
          <div style={{ position: "relative", width: "100%" }}>
            <button
              className={agentsDropdownOpen ? "active" : ""}
              onClick={() => setAgentsDropdownOpen((open) => !open)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <SmartToyIcon
                style={{
                  marginRight: collapsed ? 0 : "0.5rem",
                  verticalAlign: "middle",
                }}
              />
              {!collapsed && "Your Agents"}
              {!collapsed && (
                <span style={{ marginLeft: "auto" }}>
                  <KeyboardArrowDownIcon
                    style={{
                      transform: agentsDropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </span>
              )}
            </button>
            {agentsDropdownOpen && (
              <div
                style={{
                  width: "100%",
                  background: theme === "dark" ? "#23272f" : "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  borderRadius: 8,
                  marginTop: "0.25rem",
                  zIndex: 10,
                }}
              >
                {agentsList.map((agent) => {
                  let iconSrc = "";
                  if (agent.id === "planner") iconSrc = "/pa_new.png";
                  else if (agent.id === "guidance") iconSrc = "/ga_new.png";
                  else if (agent.id === "booking") iconSrc = "/hba_new.png";
                  return (
                    <button
                      key={agent.id}
                      className={activeTab === agent.id ? "active" : ""}
                      style={{
                        width: "100%",
                        padding: "0.5rem 1rem",
                        background:
                          activeTab === agent.id
                            ? theme === "dark"
                              ? "#23272f"
                              : "#e0e0e0"
                            : "none",
                        border: "none",
                        color: theme === "dark" ? "#f4f6fa" : "#2c3e50",
                        cursor: "pointer",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        justifyContent: collapsed ? "center" : "flex-start",
                        fontWeight: activeTab === agent.id ? 600 : 400,
                      }}
                      onClick={() => {
                        setAgentsDropdownOpen(false);
                        if (agent.id === "guidance") navigate("/guidance-chat");
                        else if (agent.id === "booking")
                          navigate("/booking-chat");
                        else if (agent.id === "planner")
                          navigate("/planner-chat");
                      }}
                    >
                      <img
                        src={iconSrc}
                        alt={agent.name + " icon"}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          objectFit: "cover",
                          background: "transparent",
                          margin: collapsed ? "0 auto" : "0 0.5rem 0 0",
                        }}
                      />
                      {!collapsed && agent.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className={activeTab === "documentation" ? "active" : ""}
            onClick={() => navigate("/documentation")}
          >
            <DescriptionIcon
              style={{
                marginRight: collapsed ? 0 : "0.5rem",
                verticalAlign: "middle",
              }}
            />
            {!collapsed && "Documentation"}
          </button>
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => navigate("/profile")}
          >
            <PersonIcon
              style={{
                marginRight: collapsed ? 0 : "0.5rem",
                verticalAlign: "middle",
              }}
            />
            {!collapsed && "Profile"}
          </button>
          <button onClick={toggleTheme}>
            {theme === "light" ? (
              <Brightness4Icon
                style={{
                  marginRight: collapsed ? 0 : "0.5rem",
                  verticalAlign: "middle",
                }}
              />
            ) : (
              <Brightness7Icon
                style={{
                  marginRight: collapsed ? 0 : "0.5rem",
                  verticalAlign: "middle",
                }}
              />
            )}
            {!collapsed && (theme === "light" ? "Dark Mode" : "Light Mode")}
          </button>
        </nav>
        <button
          className="sidebar-nav-logout"
          style={{
            width: "100%",
            background: "none",
            color: theme === "dark" ? "#f4f6fa" : "#2c3e50",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            fontSize: "1.08rem",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.5rem",
            transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
          }}
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogoutIcon
            style={{
              marginRight: collapsed ? 0 : "0.5rem",
              verticalAlign: "middle",
            }}
          />
          {!collapsed && "Logout"}
        </button>
        {showLogoutConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.25)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: theme === "dark" ? "#23272f" : "#fff",
                color: theme === "dark" ? "#fff" : "#2c3e50",
                padding: "2rem 2.5rem",
                borderRadius: 16,
                boxShadow: "0 4px 32px rgba(90,50,50,0.18)",
                minWidth: 320,
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "1.5rem" }}>
                Are you sure you want to logout?
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.5rem 1.5rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout && onLogout();
                  }}
                >
                  Yes, Logout
                </button>
                <button
                  style={{
                    background: "#f4f6fa",
                    color: "#2c3e50",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.5rem 1.5rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Decorative wave SVGs in the bottom-left corner of the sidebar */}
        {!collapsed && (
          <div className="sidebar-decor" aria-hidden="true">
            <img
              src="/sidebar_waves.png"
              alt=""
              className="sidebar-waves-img"
              aria-hidden="true"
              style={{ opacity: 0.9 }}
            />
          </div>
        )}

        {collapsed && (
          <div className="sidebar-decor-collapsed" aria-hidden="true">
            {/* Use prepared image placed in public/sidebar_waves_collapsed.png */}
            <img
              src="/sidebar_waves_collapsed.png"
              alt=""
              className="sidebar-waves-img-collapsed"
              aria-hidden="true"
              style={{ opacity: 0.9 }}
            />
          </div>
        )}
      </aside>
    </>
  );
};

export default LandingPage;
