import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, ResponsiveContainer as PieResponsiveContainer } from 'recharts';
import './GuidanceAnalysisCard.css';
import { TrendingUp } from '@mui/icons-material';

interface GuidanceAnalysisCardProps {
  timesCalled: number;
  dailyUsage: number[];
  monthlyUsage: number[];
  dailyLimit: number;
  todayUsage: number;
  lastChats?: { user: string; message: string; time: string }[];
}

const GuidanceAnalysisCard: React.FC<GuidanceAnalysisCardProps> = ({
  timesCalled,
  dailyUsage,
  monthlyUsage,
  dailyLimit,
  todayUsage,
  lastChats = [
    { user: 'Alice', message: 'How do I apply for leave?', time: '10:02' },
    { user: 'Bob', message: 'What is the exam schedule?', time: '10:05' },
    { user: 'Carol', message: 'Can I get syllabus details?', time: '10:10' },
    { user: 'Dave', message: 'How to contact my mentor?', time: '10:15' },
    { user: 'Eve', message: 'Where is the library?', time: '10:20' },
  ],
}) => {
  const remainingRequests = dailyLimit - todayUsage;
  const [showMonthly, setShowMonthly] = useState(true);
  const chartData = showMonthly
    ? monthlyUsage.map((count, idx) => ({ name: `M${idx + 1}`, Usage: count }))
    : dailyUsage.map((count, idx) => ({ name: `Day ${idx + 1}`, Usage: count }));

  // Animated count for Total Calls
  const [animatedCalls, setAnimatedCalls] = useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = timesCalled;
    if (start === end) return;
    let duration = 900; // ms
    let increment = Math.ceil(end / (duration / 16));
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setAnimatedCalls(end);
        clearInterval(timer);
      } else {
        setAnimatedCalls(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [timesCalled]);

  return (
    <div className="guidance-analysis-card">
      <div className="guidance-analysis-header">
        {/* <TrendingUpIcon style={{ fontSize: 32, color: '#8a5c5c', marginRight: 8 }} /> */}
        <h3>Guidance Agent Analysis</h3>
      </div>
      {/* Main two-column layout */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2.2rem', width: '100%' }}>
        {/* Left column: two rows */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* First row: Total Agent Requests & Remaining Requests side by side */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1.2rem', width: '100%' }}>
            <div className="total-calls-card">
              <div className="guidance-label" style={{ color: '#fff', fontSize: '1.08rem', marginBottom: '0.7rem', textAlign: 'left' }}>Total Agent Requests</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', textAlign: 'left', marginBottom: '0.5rem' }}>{animatedCalls}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#ffe6c7', fontWeight: 500 }}>
                <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <TrendingUp style={{ fontSize: 16, color: '#ffd7b5' }} />
                </span>
                The number of request you have made upto now
              </div>
            </div>
            <div className="guidance-sub-card" style={{ minWidth: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div className="guidance-label">Remaining Requests</div>
              <div style={{ width: 120, height: 120, margin: '0 auto', position: 'relative', filter: 'drop-shadow(0 4px 16px rgba(56,249,215,0.18))' }}>
                <PieResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="pieGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#43e97b" />
                        <stop offset="50%" stopColor="#38f9d7" />
                        <stop offset="100%" stopColor="#5b86e5" />
                      </linearGradient>
                      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#38f9d7" flood-opacity="0.5" />
                      </filter>
                    </defs>
                    <Pie
                      data={[{ name: 'Used', value: todayUsage }, { name: 'Remaining', value: remainingRequests }]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={56}
                      startAngle={90}
                      endAngle={450}
                      paddingAngle={2}
                      stroke="none"
                      style={{ filter: 'url(#glow)' }}
                    >
                      <Cell key="used" fill="url(#pieGradient)" />
                      <Cell key="remaining" fill="#23272f" />
                    </Pie>
                  </PieChart>
                </PieResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#38f9d7', fontWeight: 700, fontSize: 26, textAlign: 'center', letterSpacing: 1 }}>
                  {remainingRequests}
                  <div style={{ fontSize: 13, color: '#bfa6a6', fontWeight: 500, marginTop: 2 }}>Remaining</div>
                </div>
              </div>
            </div>
          </div>
          {/* Second row: Chat history */}
          <div className="chat-history-card" style={{  }}>
            <div className="guidance-label" style={{ marginBottom: 8, color: '#795548', fontSize: '1.08rem' }}>Recent AI Conversations</div>
            <div style={{ maxHeight: 140, overflowY: 'auto', width: '100%' }}>
              {lastChats.map((chat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: '#795548', marginRight: 8 }}>{chat.user === 'AI' ? 'AI:' : `${chat.user}:`}</span>
                  <span style={{ color: chat.user === 'AI' ? '#38f9d7' : '#fff', fontWeight: chat.user === 'AI' ? 600 : 500, fontSize: '1rem', background: chat.user === 'AI' ? 'rgba(56,249,215,0.08)' : 'none', borderRadius: 6, padding: chat.user === 'AI' ? '2px 8px' : '0' }}>{chat.message}</span>
                  <span style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: 8 }}>({chat.time})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right column: Bar chart */}
        <div className='bar-chart-bg'

        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div className="guidance-label" style={{ marginRight: 16 }}>{showMonthly ? 'Monthly Usage' : 'Daily Usage'}</div>
            <button className="guidance-toggle-btn" style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #795548', background: 'none', color: '#795548', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowMonthly(m => !m)}>
              {showMonthly ? 'Show Daily' : 'Show Monthly'}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} style={{ background: 'none' }}>
              <XAxis dataKey="name" stroke="#795548" fontSize={12} />
              <YAxis stroke="#795548" fontSize={12} />
              <Bar
                dataKey="Usage"
                radius={[12,12,0,0]}
                fill={showMonthly ? 'url(#monthlyBarGradient)' : 'url(#dailyBarGradient)'}
              />
              <defs>
                <linearGradient id="monthlyBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#795548" />
                  <stop offset="100%" stopColor="#bfa6a6" />
                </linearGradient>
                <linearGradient id="dailyBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8a5c5c" />
                  <stop offset="100%" stopColor="#ffd7b5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GuidanceAnalysisCard;
