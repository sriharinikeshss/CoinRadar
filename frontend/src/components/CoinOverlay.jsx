export default function CoinOverlay({ coin, onClose }) {
  const getStageEmoji = (stage) => {
    const map = {
      'Explosion': '💥',
      'Peak': '🔥',
      'Rising': '📈',
      'Building': '🔨',
      'Cooling': '❄️',
      'Declining': '📉',
    };
    return map[stage] || '📊';
  };

  const getStageClass = (stage) => stage.toLowerCase();

  return (
    <div className="coin-overlay-backdrop" onClick={onClose}>
      <div className="coin-overlay-card" onClick={(e) => e.stopPropagation()}>
        <span className="overlay-emoji">{coin.emoji}</span>
        <div className="overlay-name text-gradient">{coin.name}</div>
        <div className="overlay-symbol">{coin.symbol}</div>

        <div className="overlay-stats">
          <div className="overlay-stat">
            <span className="overlay-stat-label">Hype Score</span>
            <span className={`overlay-stat-value sentiment-${coin.sentiment}`}>
              {coin.hypeScore}
            </span>
          </div>
          <div className="overlay-stat">
            <span className="overlay-stat-label">Status</span>
            <span className={`stage-badge ${getStageClass(coin.trendStage)}`}>
              {getStageEmoji(coin.trendStage)} {coin.trendStage}
            </span>
          </div>
          <div className="overlay-stat">
            <span className="overlay-stat-label">Sentiment</span>
            <span className={`overlay-stat-value sentiment-${coin.sentiment}`}>
              {coin.sentimentPercent}%
            </span>
          </div>
          <div className="overlay-stat">
            <span className="overlay-stat-label">FOMO Index</span>
            <span className="overlay-stat-value" style={{ color: coin.fomo > 70 ? '#ff3366' : '#ffcc00' }}>
              {coin.fomo}%
            </span>
          </div>
        </div>

        <button className="overlay-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
