import { useState, useEffect, useRef } from 'react';
import CircularProgress from './CircularProgress';

function TypingText({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="ai-insight-text">
      {displayed}
    </span>
  );
}

export default function RightPanel({ coin, insight, alerts }) {
  const [visibleAlerts, setVisibleAlerts] = useState([]);

  useEffect(() => {
    setVisibleAlerts([]);
    alerts.forEach((alert, i) => {
      setTimeout(() => {
        setVisibleAlerts(prev => [...prev, alert]);
      }, i * 200);
    });
  }, [alerts]);

  return (
    <aside className="right-panel">
      {/* AI Insights */}
      <div className="panel-section" style={{ animationDelay: '0.1s' }}>
        <div className="panel-section-title">AI Insight</div>
        <div className="ai-insight-box">
          <TypingText key={insight.coinId} text={insight.text} speed={20} />
        </div>
      </div>

      {/* Alerts */}
      <div className="panel-section" style={{ animationDelay: '0.2s' }}>
        <div className="panel-section-title">Live Alerts</div>
        <div className="alerts-list">
          {visibleAlerts.map((alert, i) => (
            <div
              key={alert.id}
              className={`alert-item severity-${alert.severity}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="alert-message">{alert.message}</div>
              <div className="alert-time">{alert.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="panel-section" style={{ animationDelay: '0.3s' }}>
        <div className="panel-section-title">Quick Metrics</div>
        <div className="metrics-grid">
          <div className="metric-item">
            <CircularProgress
              key={`sent-${coin.id}`}
              value={coin.sentimentPercent}
              color={coin.sentiment === 'positive' ? '#00ff88' : coin.sentiment === 'negative' ? '#ff3366' : '#ffcc00'}
            />
            <span className="metric-label">Sentiment</span>
          </div>
          <div className="metric-item">
            <CircularProgress
              key={`fomo-${coin.id}`}
              value={coin.fomo}
              color={coin.fomo > 70 ? '#ff3366' : '#ffcc00'}
            />
            <span className="metric-label">FOMO</span>
          </div>
          <div className="metric-item">
            <CircularProgress
              key={`eng-${coin.id}`}
              value={coin.engagement}
              color="#00aaff"
            />
            <span className="metric-label">Engage</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
