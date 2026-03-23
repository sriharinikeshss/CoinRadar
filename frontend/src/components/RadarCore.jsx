import React from 'react';
import styled from 'styled-components';

const RadarContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .radar-box {
    position: relative;
    width: 360px;
    height: 360px;
    background: #0A0A0A;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 253, 135, 0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Grid Lines */
  .grid-lines {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 45px 45px;
    background-position: center center;
    pointer-events: none;
  }

  /* Center Axis Cross */
  .axis-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .axis-lines::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }
  .axis-lines::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  /* Concentric Circles */
  .concentric-circle-1 {
    position: absolute;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }
  .concentric-circle-2 {
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }

  /* Radar Sweep Wedge */
  .radar-sweep {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400px;
    height: 400px;
    transform-origin: 0 0;
    background: conic-gradient(from 180deg at 0% 0%, rgba(0, 253, 135, 0) 0deg, rgba(0, 253, 135, 0.15) 35deg, rgba(0, 253, 135, 0.6) 45deg, rgba(0, 253, 135, 0) 46deg);
    animation: radarSpin 4s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes radarSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Center Dot */
  .radar-center-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #00fd87;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(0, 253, 135, 0.8), 0 0 24px rgba(0, 253, 135, 0.4);
    z-index: 5;
  }

  /* Coin Points */
  .coin-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
  }

  .coin-dot.positive {
    background: #00fd87;
    box-shadow: 0 0 10px rgba(0, 253, 135, 0.6);
  }
  .coin-dot.neutral {
    background: #7ee6ff;
    box-shadow: 0 0 10px rgba(126, 230, 255, 0.6);
  }
  .coin-dot.negative {
    background: #ff716c;
    box-shadow: 0 0 10px rgba(255, 113, 108, 0.6);
  }

  .coin-dot:hover {
    transform: scale(1.6);
    box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
    z-index: 20;
  }

  .coin-dot.selected {
    width: 12px;
    height: 12px;
    transform: scale(1.2);
    box-shadow: 0 0 20px currentColor;
    z-index: 15;
  }

  .coin-label {
    position: absolute;
    font-family: "Space Grotesk", sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
    pointer-events: none;
    white-space: nowrap;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
    z-index: 15;
  }

  /* Tooltip */
  .coin-tooltip {
    position: absolute;
    background: rgba(14, 14, 14, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px 14px;
    z-index: 50;
    pointer-events: none;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    min-width: 120px;
    transform: translate(-50%, -100%);
    margin-top: -12px;
  }

  .tt-name {
    font-family: "Space Grotesk", sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  .tt-score {
    font-family: "Inter", sans-serif;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .tt-sentiment {
    font-family: "Inter", sans-serif;
    font-size: 10px;
    font-weight: 700;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

export default function RadarCore({ coins, selectedCoinId, onBubbleClick }) {
  const [hoveredCoin, setHoveredCoin] = React.useState(null);
  
  // Coordinate calculations relative to the 360x360 box
  const boxSize = 360;
  const center = boxSize / 2;
  const maxRadius = center * 0.8; // Coins stay slightly inside the edges

  const coinPositions = coins.map((coin) => {
    const distance = maxRadius * (1 - coin.hypeScore / 100);
    const angleRad = (coin.angle * Math.PI) / 180;
    const x = center + distance * Math.cos(angleRad);
    const y = center + distance * Math.sin(angleRad);
    return { ...coin, x, y };
  });

  return (
    <RadarContainer>
      <div className="radar-box">
        <div className="grid-lines" />
        <div className="axis-lines" />
        <div className="concentric-circle-1" />
        <div className="concentric-circle-2" />
        
        <div className="radar-sweep" />
        <div className="radar-center-dot" />

        {coinPositions.map((coin) => (
          <React.Fragment key={coin.id}>
            <div
              className={`coin-dot ${coin.sentiment} ${selectedCoinId === coin.id ? 'selected' : ''}`}
              style={{
                left: coin.x - (selectedCoinId === coin.id ? 6 : 4),
                top: coin.y - (selectedCoinId === coin.id ? 6 : 4),
                color: coin.sentiment === 'positive' ? '#00fd87' : coin.sentiment === 'negative' ? '#ff716c' : '#7ee6ff'
              }}
              onClick={() => onBubbleClick(coin.id)}
              onMouseEnter={() => setHoveredCoin(coin)}
              onMouseLeave={() => setHoveredCoin(null)}
            />
            <span
              className="coin-label"
              style={{
                left: coin.x + 12,
                top: coin.y - 6,
              }}
            >
              {coin.symbol}
            </span>
            
            {/* Tooltip renders if this coin is hovered */}
            {hoveredCoin?.id === coin.id && (
              <div
                className="coin-tooltip"
                style={{
                  left: coin.x,
                  top: coin.y,
                }}
              >
                <div className="tt-name">{hoveredCoin.name}</div>
                <div className="tt-score">SCORE: {hoveredCoin.hypeScore}</div>
                <div
                  className="tt-sentiment"
                  style={{
                    color: hoveredCoin.sentiment === 'positive' ? '#00fd87' :
                           hoveredCoin.sentiment === 'negative' ? '#ff716c' : '#7ee6ff'
                  }}
                >
                  {hoveredCoin.sentiment}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </RadarContainer>
  );
}
