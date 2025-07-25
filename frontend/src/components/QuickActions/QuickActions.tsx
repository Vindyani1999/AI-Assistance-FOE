
import React, { useState } from "react";
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import { useNavigate } from "react-router-dom";
import { quickActionsList, QuickAction } from "./quickActionsList";

export function getQuickActionsExceptAgent(agent: string): QuickAction[] {
  return quickActionsList.filter(action => action.agent !== agent && action.visible !== false);
}

export interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useGlobalLoader();
  const [loading, setLoading] = useState(false); // keep for sidebar spinner if needed
  // Helper to check if link is local (starts with / or http(s)://localhost)
  const isLocalLink = (url: string) => {
    return url.startsWith("/") || url.startsWith("http://localhost") || url.startsWith("https://localhost");
  };
  const handleClick = (action: QuickAction) => {
    if (isLocalLink(action.link)) {
      showLoader();
      setTimeout(() => {
        let path = action.link.replace(/^https?:\/\/localhost:\d+/, "");
        navigate(path);
        hideLoader();
      }, 800); // 800ms delay for animation
    } else {
      window.open(action.link, '_blank');
    }
  };
  return (
    <div className="sidebar-section">
      <h3>Quick Actions</h3>
      {/* Sidebar spinner is now optional; global loader is used for navigation */}
      {actions.map((action, idx) => (
        <button
          key={action.name + idx}
          onClick={() => handleClick(action)}
          className="agent-btn"
        >
          <img
            src={action.image}
            alt={action.name}
            className="agent-btn-icon"
            onError={(e) => {
              console.error(`Failed to load ${action.name} image`);
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="agent-btn-content">
            <span className="agent-btn-title">{action.name}</span>
            <span className="agent-btn-description">{action.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
