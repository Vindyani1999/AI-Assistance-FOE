import React from "react";
import Avatar from "@mui/material/Avatar";
import { AccountCircle, Work, Email, VisibilityOff } from "@mui/icons-material";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";
import { useTheme } from "../../context/ThemeContext";
import "./UserProfile.css";
import { UserProfileProps } from "../../utils/types";

const getRoleFromEmail = (email: string) => {
  if (!email) return "";
  const domain = email.split("@")[1] || "";
  if (domain === "engug.ruh.ac.lk") return "Undergraduate";
  if (["eie.ruh.ac.lk", "mme.ruh.ac.lk", "cee.ruh.ac.lk"].includes(domain))
    return "Staff Member";
  if (domain === "ar.ruh.ac.lk") return "AR";
  return "";
};

const UserProfile: React.FC<UserProfileProps> = ({ userProfile }) => {
  const { theme } = useTheme();
  const role = userProfile ? getRoleFromEmail(userProfile.email) : "";
  const getFullDepartment = (dept: string) => {
    if (!dept) return "";
    const d = dept.toLowerCase();
    if (d.includes("electrical"))
      return "Department of Electrical and Information Engineering";
    if (d.includes("mechanical"))
      return "Department of Mechanical and Manufacturing Engineering";
    if (d.includes("civil"))
      return "Department of Civil and Environmental Engineering";
    return dept;
  };
  // Theme-based CSS variables for light/dark mode
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--profile-bg", "#232323");
      root.style.setProperty("--profile-border", "#444");
      root.style.setProperty("--profile-title", "#a67c52");
      root.style.setProperty("--profile-info-bg", "#3e2c1a");
      root.style.setProperty("--profile-label", "#e0baba");
      root.style.setProperty("--profile-text", "#fff");
    } else {
      root.style.setProperty("--profile-bg", "#fff");
      root.style.setProperty("--profile-border", "#e0e0e0");
      root.style.setProperty("--profile-title", "#6d4c2d");
      root.style.setProperty("--profile-info-bg", "#f7f3ef");
      root.style.setProperty("--profile-label", "#5A3232");
      root.style.setProperty("--profile-text", "#232323");
    }
  }, [theme]);
  return (
    <div className="user-profile-container">
      <style>{`
        .user-profile-label {
          color: var(--profile-label) !important;
        }
        .user-profile-title {
          color: var(--profile-title) !important;
        }
        .user-profile-info {
          background: var(--profile-info-bg) !important;
        }
        .user-profile-details span, .user-profile-password {
          color: var(--profile-text) !important;
        }
      `}</style>
      <div className="user-profile-card">
        <div
          className="user-profile-header"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #5a3c1a 0%, #a67c52 100%)"
                : "linear-gradient(135deg, #8d6748 0%, #c2a178 100%)",
          }}
        >
          <Avatar className="user-profile-avatar">
            <AccountCircle fontSize="large" />
          </Avatar>
        </div>
        <div className="user-profile-details">
          {userProfile ? (
            <React.Fragment>
              <div className="user-profile-title">
                {userProfile.title ? `${userProfile.title} ` : ""}
                {userProfile.firstname} {userProfile.lastname}
              </div>
              <div className="user-profile-info">
                <Email sx={{ color: "#a67c52" }} />
                <span>{userProfile.email}</span>
              </div>
              <div className="user-profile-info">
                <PermContactCalendarIcon sx={{ color: "#a67c52" }} />
                <span>{role}</span>
              </div>
              {userProfile.department && (
                <div className="user-profile-info">
                  <Work sx={{ color: "#a67c52" }} />
                  <span>{getFullDepartment(userProfile.department)}</span>
                </div>
              )}
              <div className="user-profile-info">
                <VisibilityOff sx={{ color: "#a67c52" }} />
                <span className="user-profile-password">{"••••••"}</span>
              </div>
            </React.Fragment>
          ) : (
            <span>Loading profile...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
