import { useEffect, useRef, useState } from 'react';

function TrendGraph({ coin }) {
  const data = coin.priceHistory || [];
  const prediction = coin.prediction || [];
  const svgRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [coin.id]);

  if (data.length < 2) return null;

  const allData = [...data, ...prediction];
  const min = Math.min(...allData) * 0.9;
  const max = Math.max(...allData) * 1.1;
  const range = max - min || 1;

  const w = 400, h = 160, padX = 30, padY = 15;
  const totalPoints = allData.length;

  const getPoint = (val, i) => {
    const x = padX + (i / (totalPoints - 1)) * (w - padX * 2);
    const y = h - padY - ((val - min) / range) * (h - padY * 2);
    return { x, y };
  };

  const historyPoints = data.map((v, i) => getPoint(v, i));
  const predPoints = prediction.map((v, i) => getPoint(v, data.length + i));

  const historyPath = historyPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${historyPath} L ${historyPoints[historyPoints.length - 1].x} ${h - padY} L ${historyPoints[0].x} ${h - padY} Z`;

  let predPath = '';
  if (predPoints.length > 0) {
    const lastHistory = historyPoints[historyPoints.length - 1];
    predPath = `M ${lastHistory.x} ${lastHistory.y} ` + predPoints.map(p => `L ${p.x} ${p.y}`).join(' ');
  }

  const totalLength = 2000;

  return (
    <svg className="trend-graph-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(frac => (
        <line
          key={frac}
          x1={padX} y1={padY + (h - padY * 2) * frac}
          x2={w - padX} y2={padY + (h - padY * 2) * frac}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#trendGradient)" opacity={animated ? 0.4 : 0} style={{ transition: 'opacity 1s' }} />

      {/* History line */}
      <path
        d={historyPath}
        className="trend-line"
        strokeDasharray={totalLength}
        strokeDashoffset={animated ? 0 : totalLength}
        style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)` }}
      />

      {/* Prediction line */}
      {predPath && (
        <path
          d={predPath}
          className="trend-line-prediction"
          strokeDasharray={totalLength}
          strokeDashoffset={animated ? 0 : totalLength}
          style={{ transition: `stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s` }}
        />
      )}

      {/* Divider */}
      {predPoints.length > 0 && (
        <line
          x1={historyPoints[historyPoints.length - 1].x}
          y1={padY}
          x2={historyPoints[historyPoints.length - 1].x}
          y2={h - padY}
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray="4 4"
        />
      )}

      {/* Now label */}
      {predPoints.length > 0 && (
        <text
          x={historyPoints[historyPoints.length - 1].x}
          y={padY - 3}
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          textAnchor="middle"
          fontFamily="Orbitron"
        >
          NOW
        </text>
      )}
    </svg>
  );
}

function HypeMeter({ score }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const w = 200, h = 130;
  const cx = w / 2, cy = h - 15;
  const radius = 70;
  const startAngle = Math.PI;
  const endAngle = 0;
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleAngle = animated ? scoreAngle : startAngle;
  const needleLen = radius - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const getColor = (s) => {
    if (s > 75) return '#ff3366';
    if (s > 50) return '#ffcc00';
    return '#00ff88';
  };

  return (
    <svg className="hype-meter-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="meterGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="50%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#ff3366" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />

      {/* Value arc */}
      <path
        d={arcPath(startAngle, animated ? scoreAngle : startAngle, radius)}
        fill="none"
        stroke="url(#meterGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      {/* Needle */}
      <line
        x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={getColor(score)}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      <circle cx={cx} cy={cy} r="4" fill={getColor(score)} />

      {/* Labels */}
      <text x={cx - radius - 5} y={cy + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="Orbitron">0</text>
      <text x={cx} y={cy - radius - 8} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle" fontFamily="Orbitron">50</text>
      <text x={cx + radius + 5} y={cy + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="start" fontFamily="Orbitron">100</text>

      {/* Score */}
      <text x={cx} y={cy - 8} fill={getColor(score)} fontSize="22" textAnchor="middle" fontFamily="Orbitron" fontWeight="700">
        {score}
      </text>
      <text x={cx} y={cy + 8} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle" fontFamily="Orbitron" letterSpacing="2">
        HYPE SCORE
      </text>
    </svg>
  );
}

function Timeline({ events }) {
  return (
    <div className="timeline-container">
      {events.map((event, i) => (
        <div
          key={i}
          className="timeline-item"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <span className="timeline-time">{event.time}</span>
          <span className={`timeline-dot ${event.type}`}></span>
          <span className="timeline-event">{event.event}</span>
        </div>
      ))}
    </div>
  );
}

export default function BottomPanel({ coin }) {
  return (
    <div className="bottom-panel">
      <div className="bottom-section">
        <div className="bottom-section-title">
          <span className="icon">📈</span>
          Trend Analysis
        </div>
        <div className="trend-graph-container">
          <TrendGraph coin={coin} />
        </div>
      </div>

      <div className="bottom-section">
        <div className="bottom-section-title">
          <span className="icon">⚡</span>
          Hype Meter
        </div>
        <div className="hype-meter-container">
          <HypeMeter score={coin.hypeScore} />
        </div>
      </div>

      <div className="bottom-section">
        <div className="bottom-section-title">
          <span className="icon">🕐</span>
          Event Timeline
        </div>
        <Timeline events={coin.timeline} />
      </div>
    </div>
  );
}
