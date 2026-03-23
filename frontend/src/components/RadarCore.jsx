import React from 'react';
import styled from 'styled-components';

const RadarWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .radar-visual {
    position: relative;
    width: 280px;
    height: 280px;
    background: #141414;
    border-radius: 50%;
    box-shadow: inset 0px 0px 12px rgba(0, 255, 136, 0.15);
    border: 1px solid rgba(0, 255, 136, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .radar-visual::before {
    content: "";
    position: absolute;
    inset: 32px;
    background: transparent;
    border: 1px solid rgba(0, 255, 136, 0.15);
    border-radius: 50%;
    box-shadow: inset 0px 0px 5px rgba(0, 255, 136, 0.1);
  }

  .radar-visual::after {
    content: "";
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px solid rgba(0, 255, 136, 0.12);
    box-shadow: inset 0px 0px 3px rgba(0, 255, 136, 0.08);
  }

  .radar-sweep {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: transparent;
    transform-origin: top left;
    animation: radarSpin 2s linear infinite;
    box-shadow: -40px -120px 50px -80px rgba(0, 255, 136, 0.4);
    border-top: 2px solid rgba(0, 196, 106, 0.6);
  }

  @keyframes radarSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .radar-center-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #00FF88;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
    z-index: 5;
  }

  .coin-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0px 0px 10px 2px rgba(0, 255, 182, 0.5),
      0px 0px 10px 2px rgba(0, 255, 135, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    animation: dotPulse 3s ease infinite;
  }

  .coin-dot:hover {
    transform: scale(1.8);
    box-shadow: inset 0px 0px 10px 2px rgba(0, 255, 182, 0.8),
      0px 0px 20px 4px rgba(0, 255, 135, 0.6);
  }

  .coin-dot.selected {
    width: 10px;
    height: 10px;
    background: #00FF88;
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.8);
  }

  .coin-dot.negative {
    background: rgba(255, 77, 77, 0.9);
    box-shadow: inset 0px 0px 10px 2px rgba(255, 77, 77, 0.5),
      0px 0px 10px 2px rgba(255, 77, 77, 0.3);
  }

  .coin-dot.neutral {
    background: rgba(255, 204, 0, 0.9);
    box-shadow: inset 0px 0px 10px 2px rgba(255, 204, 0, 0.5),
      0px 0px 10px 2px rgba(255, 204, 0, 0.3);
  }

  @keyframes dotPulse {
    0%, 100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }

  .coin-label {
    position: absolute;
    font-size: 9px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.5px;
    pointer-events: none;
    white-space: nowrap;
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
  }

  .coin-tooltip {
    position: absolute;
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(0, 255, 136, 0.25);
    border-radius: 8px;
    padding: 8px 12px;
    z-index: 50;
    pointer-events: none;
    animation: tooltipFade 0.2s ease;
    backdrop-filter: blur(8px);
    min-width: 100px;
  }

  .coin-tooltip .tt-name {
    font-size: 12px;
    font-weight: 700;
    color: #E8E8F0;
    margin-bottom: 2px;
  }

  .coin-tooltip .tt-score {
    font-size: 10px;
    color: rgba(232, 232, 240, 0.6);
  }

  .coin-tooltip .tt-sentiment {
    font-size: 10px;
    font-weight: 600;
    margin-top: 2px;
  }

  @keyframes tooltipFade {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default function RadarCore({ coins, selectedCoinId, onBubbleClick }) {
  const [hoveredCoin, setHoveredCoin] = React.useState(null);
  const containerSize = 280;
  const center = containerSize / 2;
  const maxRadius = center * 0.78;

  const coinPositions = coins.map((coin) => {
    const distance = maxRadius * (1 - coin.hypeScore / 120);
    const angleRad = (coin.angle * Math.PI) / 180;
    const x = center + distance * Math.cos(angleRad);
    const y = center + distance * Math.sin(angleRad);
    return { ...coin, x, y };
  });

  return (
    <RadarWrapper>
      <div className="radar-visual">
        <span className="radar-sweep" />
        <div className="radar-center-dot" />

        {coinPositions.map((coin) => (
          <React.Fragment key={coin.id}>
            <div
              className={`coin-dot ${coin.sentiment} ${selectedCoinId === coin.id ? 'selected' : ''}`}
              style={{
                left: coin.x - 4,
                top: coin.y - 4,
              }}
              onClick={() => onBubbleClick(coin.id)}
              onMouseEnter={() => setHoveredCoin(coin)}
              onMouseLeave={() => setHoveredCoin(null)}
            />
            <span
              className="coin-label"
              style={{
                left: coin.x + 10,
                top: coin.y - 6,
              }}
            >
              {coin.symbol}
            </span>
          </React.Fragment>
        ))}

        {hoveredCoin && (
          <div
            className="coin-tooltip"
            style={{
              left: Math.min(hoveredCoin.x + 16, containerSize - 120),
              top: Math.max(hoveredCoin.y - 30, 10),
            }}
          >
            <div className="tt-name">{hoveredCoin.name}</div>
            <div className="tt-score">Hype: {hoveredCoin.hypeScore}/100</div>
            <div
              className="tt-sentiment"
              style={{
                color: hoveredCoin.sentiment === 'positive' ? '#00FF88' :
                       hoveredCoin.sentiment === 'negative' ? '#FF4D4D' : '#FFCC00'
              }}
            >
              {hoveredCoin.sentiment.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </RadarWrapper>
  );
}
