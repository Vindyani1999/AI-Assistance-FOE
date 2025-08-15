import React, { useState } from 'react';
import { fetchUserProfile } from '../../services/userAPI';
import AuthPage from '../AuthForms/AuthPage';
import LandingPage from '../LandingPage/LandingPage';
import { agentCardData } from '../../utils/AgentCardData';
import './HomePage.css'; 
import './HomePage.profile.css';

  const agents = agentCardData;

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  // Add handleLogout function
  function handleLogout() {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUserProfile(null);
  }

  if (!isAuthenticated) {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="auth-section">
            <AuthPage
              onAuthSuccess={async (session) => {
                const authToken = localStorage.getItem('auth_token');
                if (!authToken || isTokenExpired(authToken)) {
                  localStorage.removeItem('auth_token');
                  setIsAuthenticated(false);
                  setUserProfile(null);
                  return;
                }
                setIsAuthenticated(true);
                try {
                  const profile = await fetchUserProfile();
                  setUserProfile(profile);
                } catch {
                  setUserProfile(null);
                }
              }}
            />
            <div className="preview-agents">
              <div className="preview-title">
                <h4>Available AI Assistants</h4>
              </div>
              <div className="agents-grid disabled-grid">
                {agents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="agent-card disabled"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="agent-image-container">
                      <img 
                        src={agent.image} 
                        alt={agent.name}
                        className="agent-image"
                        onError={(e) => {
                          console.error(`Failed to load ${agent.name} image`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="agent-badge">
                        {index + 1}
                      </div>
                    </div>
                    <div className="agent-info">
                      <h3 className="agent-name">{agent.name}</h3>
                      <p className="agent-title">{agent.title}</p>
                      <p className="agent-description">{agent.description}</p>
                    </div>
                    <div className="disabled-overlay">
                      <div className="lock-icon">🔒</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated landing page
  return (
    <LandingPage
      userProfile={userProfile}
      agents={agents}
      onLogout={handleLogout}
    />
  );
}

export default HomePage;
