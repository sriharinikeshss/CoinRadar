import { useEffect, useState, useRef, useCallback } from 'react';

function TrendGraph({ coin }) {
  const data = coin.priceHistory || [];
  const prediction = coin.prediction || [];
  const svgRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);

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

  const w = 400, h = 160, padX = 35, padY = 20;
  const totalPoints = allData.length;

  const getPoint = (val, i) => {
    const x = padX + (i / (totalPoints - 1)) * (w - padX * 2);
    const y = h - padY - ((val - min) / range) * (h - padY * 2);
    return { x, y };
  };

  const historyPoints = data.map((v, i) => getPoint(v, i));
  const predPoints = prediction.map((v, i) => getPoint(v, data.length + i));

  // Smooth curve path using cubic bezier
  const smoothPath = (points) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const historyPath = smoothPath(historyPoints);
  const lastHist = historyPoints[historyPoints.length - 1];
  const areaPath = `${historyPath} L ${lastHist.x} ${h - padY} L ${historyPoints[0].x} ${h - padY} Z`;

  let predPath = '';
  if (predPoints.length > 0) {
    const allPred = [lastHist, ...predPoints];
    predPath = smoothPath(allPred);
  }

  const totalLength = 2000;

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * w;

    // Find closest point
    let closest = null;
    let minDist = Infinity;
    const allPoints = [...historyPoints.map((p, i) => ({ ...p, val: data[i], isPred: false })),
                       ...predPoints.map((p, i) => ({ ...p, val: prediction[i], isPred: true }))];
    
    for (const pt of allPoints) {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    }

    if (closest && minDist < 30) {
      setHoverInfo({
        x: closest.x,
        y: closest.y,
        value: closest.val,
        isPred: closest.isPred,
        screenX: (closest.x / w) * rect.width + rect.left,
      });
    } else {
      setHoverInfo(null);
    }
  }, [data, prediction, historyPoints, predPoints]);

  return (
    <div className="trend-graph-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        className="trend-graph-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00C46A" />
            <stop offset="100%" stopColor="#00FF88" />
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
        <path d={areaPath} fill="url(#trendGradient)" opacity={animated ? 0.5 : 0} style={{ transition: 'opacity 1s' }} />

        {/* History line */}
        <path
          d={historyPath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength}
          strokeDashoffset={animated ? 0 : totalLength}
          style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)` }}
        />

        {/* Prediction line */}
        {predPath && (
          <path
            d={predPath}
            fill="none"
            stroke="#00FF88"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.4"
            strokeLinecap="round"
          />
        )}

        {/* Data points dots */}
        {animated && historyPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y} r="2.5"
            fill="#00FF88"
            opacity="0.6"
          />
        ))}

        {/* Hover crosshair */}
        {hoverInfo && (
          <>
            <line
              x1={hoverInfo.x} y1={padY}
              x2={hoverInfo.x} y2={h - padY}
              stroke="rgba(0, 255, 136, 0.3)" strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={hoverInfo.x} cy={hoverInfo.y} r="5"
              fill="none" stroke="#00FF88" strokeWidth="2" />
            <circle cx={hoverInfo.x} cy={hoverInfo.y} r="2.5"
              fill="#00FF88" />
          </>
        )}

        {/* Divider line */}
        {predPoints.length > 0 && (
          <line
            x1={lastHist.x} y1={padY}
            x2={lastHist.x} y2={h - padY}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />
        )}

        {/* Now label */}
        {predPoints.length > 0 && (
          <text x={lastHist.x} y={padY - 4}
            fill="rgba(255,255,255,0.3)" fontSize="7"
            textAnchor="middle" fontFamily="Inter">
            NOW
          </text>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoverInfo && (
        <div style={{
          position: 'absolute',
          left: `${(hoverInfo.x / w) * 100}%`,
          top: `${(hoverInfo.y / h) * 100 - 18}%`,
          transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid rgba(0, 255, 136, 0.25)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#00FF88',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}>
          {hoverInfo.isPred ? 'Pred: ' : ''}{hoverInfo.value.toFixed(6)}
        </div>
      )}
    </div>
  );
}

function HypeMeter({ score }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const w = 200, h = 120;
  const cx = w / 2, cy = h - 10;
  const radius = 65;
  const startAngle = Math.PI;
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = Math.abs(end - start) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleAngle = animated ? scoreAngle : startAngle;
  const needleLen = radius - 8;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const getColor = (s) => {
    if (s > 75) return '#FF4D4D';
    if (s > 50) return '#FFCC00';
    return '#00FF88';
  };

  return (
    <svg className="hype-meter-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="meterGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00FF88" />
          <stop offset="50%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#FF4D4D" />
        </linearGradient>
      </defs>

      <path d={arcPath(startAngle, 0, radius)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />

      <path
        d={arcPath(startAngle, animated ? scoreAngle : startAngle, radius)}
        fill="none"
        stroke="url(#meterGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={getColor(score)} strokeWidth="2" strokeLinecap="round"
        style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      <circle cx={cx} cy={cy} r="3" fill={getColor(score)} />

      <text x={cx - radius - 3} y={cy + 3} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="end" fontFamily="Inter">0</text>
      <text x={cx} y={cy - radius - 5} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="middle" fontFamily="Inter">50</text>
      <text x={cx + radius + 3} y={cy + 3} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="start" fontFamily="Inter">100</text>

      <text x={cx} y={cy - 5} fill={getColor(score)} fontSize="20" textAnchor="middle" fontFamily="Inter" fontWeight="700">
        {score}
      </text>
      <text x={cx} y={cy + 8} fill="rgba(255,255,255,0.25)" fontSize="7" textAnchor="middle" fontFamily="Inter" letterSpacing="1.5">
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
          style={{ animationDelay: `${i * 0.12}s` }}
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
          Trend Analysis
        </div>
        <div className="trend-graph-container">
          <TrendGraph coin={coin} />
        </div>
      </div>

      <div className="bottom-section">
        <div className="bottom-section-title">
          Hype Meter
        </div>
        <div className="hype-meter-container">
          <HypeMeter score={coin.hypeScore} />
        </div>
      </div>

      <div className="bottom-section">
        <div className="bottom-section-title">
          Event Timeline
        </div>
        <Timeline events={coin.timeline} />
      </div>
    </div>
  );
}
