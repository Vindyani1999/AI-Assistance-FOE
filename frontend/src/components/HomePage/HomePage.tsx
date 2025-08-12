import React, { useState, useEffect } from 'react';
import { fetchUserProfile } from '../../services/userAPI';
import AuthPage from '../AuthForms/AuthPage';
import { useNavigate } from 'react-router-dom';
import { agentCardData } from '../../utils/AgentCardData';
import './HomePage.css'; 

interface Agent {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  url: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const agents = agentCardData;

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    setIsAuthenticated(!!authToken);
    if (authToken) {
      fetchUserProfile().then(profile => setUserProfile(profile)).catch(() => setUserProfile(null));
    } else {
      setUserProfile(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUserProfile(null);
    setShowUserProfile(false);
  };

  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  const handleAgentSelect = (agent: Agent) => {
    if (!isAuthenticated) return;
    setSelectedAgent(agent.id);
  };

  const handleContinue = () => {
    if (selectedAgent && isAuthenticated) {
      const agent = agents.find(a => a.id === selectedAgent);
      if (agent) {
        // Always show loader animation before navigating to any agent
        //showLoader();
        setTimeout(() => {
          //hideLoader();
          if (agent.url.startsWith('/')) {
            navigate(agent.url);
          } else if (agent.url.startsWith('http')) {
            window.open(agent.url, '_blank');
          } else {
            navigate(agent.url);
          }
        }, 2000); // 2000ms delay for animation
      }
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <div className="logo">
            <img src="/logo.png" alt="AI Assistant" className="logo-icon" />
          </div>
          <div className="header-content">
            <h1 className="main-title">
              Welcome to AI Assistance - FOE
            </h1>
            <p className="subtitle">
              {isAuthenticated 
                ? "Choose your AI Companion to Simplify Your Task"
                : "Please sign in to access AI Assistants"
              }
            </p>
          </div>
          <div className="header-actions">
            {isAuthenticated && (
              <div className="user-avatar" onClick={toggleUserProfile}>
                <img src="/ai_rt.png" alt="User" />
              </div>
            )}
          </div>
        </header>
        {/* User Profile Sidebar */}
        {showUserProfile && (
          <div className="user-profile-sidebar">
            <div className="user-profile-overlay" onClick={() => setShowUserProfile(false)}></div>
            <div className="user-profile-content">
              <div className="user-profile-header">
                <h3>User Profile</h3>
                <button 
                  className="close-profile-btn"
                  onClick={() => setShowUserProfile(false)}
                >
                  ×
                </button>
              </div>
              <div className="user-profile-info">
                <div className="user-details">
                  {userProfile ? (
                    userProfile.email.endsWith('@engug.ruh.ac.lk') ? (
                      <>
                        <h4>{userProfile.firstname} {userProfile.lastname}</h4>
                        <p className="user-email">{userProfile.email}</p>
                        {userProfile.department && <p className="user-department">Department: {userProfile.department}</p>}
                      </>
                    ) : (
                      <>
                        <h4>{userProfile.title} {userProfile.firstname} {userProfile.lastname}</h4>
                        <p className="user-email">{userProfile.email}</p>
                        {userProfile.department && <p className="user-department">Department: {userProfile.department}</p>}
                      </>
                    )
                  ) : (
                    <p>Loading profile...</p>
                  )}
                </div>
              </div>
              <div className="user-profile-actions">
                <button 
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        <main className="main-content">
          {!isAuthenticated ? (
            <div className="auth-section">
              <AuthPage
                onAuthSuccess={async (session) => {
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
          ) : (
            <>
              {/* Continue Button Section */}
              <div className="continue-button-section">
                <button 
                  className={`continue-btn ${selectedAgent ? 'active' : ''}`}
                  onClick={handleContinue}
                  disabled={!selectedAgent}
                >
                  Continue
                </button>
              </div>
              <div className="agents-grid">
              {agents.map((agent, index) => (
                <div
                  key={agent.id}
                  className={`agent-card ${selectedAgent === agent.id ? 'selected' : ''}`}
                  onClick={() => handleAgentSelect(agent)}
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
                  <div className="card-overlay">
                    <div className="select-indicator">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </main>
        <footer className="home-footer">
          <p>
            {isAuthenticated 
              ? "Select an AI assistant to get started with your tasks"
              : "Sign in to access your AI assistants"
            }
          </p>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
