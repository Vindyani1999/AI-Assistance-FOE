import React, { useState, useEffect } from 'react';
import OtpInput, { InputProps } from 'react-otp-input';
import Countdown from 'react-countdown';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { Send } from '@mui/icons-material';
import { agentCardData } from '../../utils/AgentCardData';
import { requestOtp, verifyOtp } from '../../services/authAPI';

interface Agent {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  url: string;
}

const HomePage: React.FC = () => {
  // Helper for deep equality check
  const isUserSessionEqual = (a: any, b: any) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  };
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [otpTimerKey, setOtpTimerKey] = useState<number>(0); // for resetting timer
  const [otpExpired, setOtpExpired] = useState<boolean>(false);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const userSessionData = localStorage.getItem('user_session');
    if (authToken && userSessionData) {
      const parsedSession = JSON.parse(userSessionData);
      if (!isAuthenticated || !isUserSessionEqual(userSession, parsedSession)) {
        setIsAuthenticated(true);
        setUserSession(parsedSession);
      }
    } else {
      if (isAuthenticated || userSession) {
        setIsAuthenticated(false);
        setUserSession(null);
      }
    }
    // eslint-disable-next-line
  }, []);

  // University email validation
  const validateEmail = (email: string): boolean => {
    const facultyEmailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.(edu|ac\.lk|ac\.uk|university\.edu|ruh\.ac\.lk|engug\.ruh\.ac\.lk)$/;
    return facultyEmailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      alert('Please enter a valid faculty email address');
      return;
    }
    setIsSubmitting(true);
    try {
      await requestOtp(email);
      alert(`OTP sent to ${email}! Please check your email inbox.`);
      setOtpExpired(false);
      setOtpTimerKey(prev => prev + 1); // reset timer
      setAuthStep('otp');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpExpired) {
      alert('OTP has expired. Please request a new one.');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyOtp(email, otp);
      // Simulate successful authentication (replace with backend token/session if available)
      const mockToken = `auth_token_faculty_${Date.now()}`;
      const mockUserSession = {
        user: {
          id: '123',
          name: email.split('@')[0],
          email: email,
          provider: 'faculty'
        },
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_session', JSON.stringify(mockUserSession));
      setUserSession(mockUserSession);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert('OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAuth = () => {
    setAuthStep('email');
    setEmail('');
    setOtp('');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    setIsAuthenticated(false);
    setUserSession(null);
    setShowUserProfile(false);
  };

  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  const agents = agentCardData;

  const handleAgentSelect = (agent: Agent) => {
    if (!isAuthenticated) {
      return; // Disable agent selection if not authenticated
    }
    
    setSelectedAgent(agent.id);
    // Removed automatic navigation - user must click Continue button
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
        {showUserProfile && userSession && (
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
                <div className="user-avatar-large">
                  <img src="/ai_rt.png" alt="User" />
                </div>
                <div className="user-details">
                  <h4>{userSession.user.name}</h4>
                  <p className="user-email">{userSession.user.email}</p>
                  <p className="login-time">
                    Logged in: {new Date(userSession.loginTime).toLocaleString()}
                  </p>
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
              <div className="sso-section">
                <div className="sso-container">
                  <h2 className="sso-title">Sign In to Continue</h2>
                  <p className="sso-description">
                    {authStep === 'email' 
                      ? 'Enter your university email'
                      : 'Enter the OTP sent to your email'
                    }
                  </p>
                  
                  {authStep === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="auth-form">
                      <div className="form-group">
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@ruh.ac.lk"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                        <Send sx={{ fontSize: 18, marginLeft: '8px' }} />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpSubmit} className="auth-form">
                      <div className="form-group">
                        {/* <label htmlFor="otp">Enter OTP</label> */}
                        <OtpInput
                          value={otp}
                          onChange={setOtp}
                          numInputs={6}
                          inputType="number"
                          shouldAutoFocus
                          renderInput={(props: InputProps, index: number) => (
                            <input 
                              key={index} 
                              {...props} 
                              className="otp-input" 
                              type="text" 
                              maxLength={1} 
                            />
                          )}
                          inputStyle={{
                            width: '2.5rem',
                            height: '2.5rem',
                            margin: '0 0.25rem',
                            fontSize: '0.875rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                          }}
                          containerStyle={{ justifyContent: 'center' }}
                          //disabled={isSubmitting}
                        />
                        <div style={{ marginTop: '0.5rem' }}>
                          {!otpExpired && (
                            <Countdown
                              key={otpTimerKey}
                              date={Date.now() + 60000}
                              intervalDelay={0}
                              precision={3}
                              renderer={({ seconds, completed }: { seconds: number; completed: boolean }) => {
                                if (completed) {
                                  setOtpExpired(true);
                                  return <div className="expired-message">OTP has expired.</div>;
                                } else {
                                  return <div className="timer-display">OTP expires in: {seconds}s</div>;
                                }
                              }}
                            />
                          )}
                          {otpExpired && (
                            <div className="expired-message">OTP has expired.</div>
                          )}
                        </div>
                      </div>
                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="auth-button secondary"
                          onClick={resetAuth}
                          disabled={isSubmitting}
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          className="auth-button"
                          disabled={isSubmitting || otpExpired}
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              
              <div className="preview-agents">
                <div className="preview-title">
                  <h4>Available AI Assistants</h4>
                  {/* <p>Sign in to access these powerful AI companions</p> */}
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
};

export default HomePage;
