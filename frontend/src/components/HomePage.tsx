import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const agents: Agent[] = [
    {
      id: 'guidance',
      name: 'Guidance Agent',
      title: 'Academic Assistant 🎓',
      description: 'Your personal academic companion for research, assignments, and study guidance',
      image: '/guidance.png',
      url: '/chat'
    },
    {
      id: 'booking',
      name: 'Booking Agent',
      title: 'Facility Booking 🏢',
      description: 'Book lecture halls, meeting rooms, and campus facilities with ease',
      image: '/booking.png',
      url: 'https://www.youtube.com/watch?v=FwOTs4UxQS4'
    },
    {
      id: 'planner',
      name: 'Planner Agent',
      title: 'Schedule Planner 📅',
      description: 'Plan and organize your academic timetables and schedules efficiently',
      image: '/planner.png',
      url: 'http://localhost:7862'
    }
  ];

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent.id);
    setTimeout(() => {
      if (agent.id === 'guidance') {
        navigate('/chat');
      } else if (agent.url.startsWith('http')) {
        window.open(agent.url, '_blank');
      } else {
        navigate(agent.url);
      }
    }, 300);
  };

  const handleContinue = () => {
    if (selectedAgent) {
      const agent = agents.find(a => a.id === selectedAgent);
      if (agent) {
        handleAgentSelect(agent);
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
              Choose your AI Companion to Simplify Your Task
            </p>
          </div>

          <div className="header-actions">
            <button 
              className={`continue-btn ${selectedAgent ? 'active' : ''}`}
              onClick={handleContinue}
              disabled={!selectedAgent}
            >
              Continue
            </button>
            <div className="user-avatar">
              <img src="/ai_rt.png" alt="User" />
            </div>
          </div>
        </header>

        <main className="agents-grid">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className={`agent-card ${selectedAgent === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent.id)}
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
        </main>

        <footer className="home-footer">
          <p>Select an AI assistant to get started with your tasks</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
