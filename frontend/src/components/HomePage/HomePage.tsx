import React from "react";
import AuthPage from "../AuthForms/AuthPage";
import { agentCardData } from "../../utils/AgentCardData";
// @ts-ignore: allow side-effect CSS import without type declarations
import "./HomePage.css";
import { HomePageProps } from "../../utils/types";
const agents = agentCardData;

const HomePage: React.FC<HomePageProps> = ({ onAuthSuccess }) => (
  <div className="home-page">
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <img src="/logo.png" alt="AI Assistant" className="logo-icon" />
        </div>
        <div className="header-content">
          <h1 className="main-title">Welcome to AI Assistance - FOE</h1>
          <p className="subtitle">
            Choose your AI Companion to Simplify Your Task
          </p>
        </div>
      </header>
      <main className="main-content">
        <div className="auth-section">
          <AuthPage onAuthSuccess={onAuthSuccess} />
        </div>
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
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="agent-badge">{index + 1}</div>
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
      </main>
      <footer className="home-footer">
        <p>"Sign in to access your AI assistants"</p>
      </footer>
    </div>
  </div>
);

export default HomePage;
