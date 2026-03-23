import Sparkline from './Sparkline';

export default function LeftPanel({ coins, selectedCoinId, onCoinSelect, searchQuery }) {
  const getTrendArrow = (sentiment) => {
    if (sentiment === 'positive') return { arrow: '↑', className: 'up' };
    if (sentiment === 'negative') return { arrow: '↓', className: 'down' };
    return { arrow: '→', className: 'neutral' };
  };

  const getPulseClass = (score) => {
    if (score >= 80) return 'pulse-fast';
    if (score >= 50) return 'pulse-slow';
    return 'pulse-minimal';
  };

  const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="search-highlight">{part}</span> : part
    );
  };

  return (
    <div className="left-column">
      <div className="left-column-header">
        <div className="left-column-title">Trending Coins</div>
      </div>

      <div className="left-column-list">
        {coins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">No coins found</div>
            <div className="empty-state-sub">Try a different search term</div>
          </div>
        ) : (
          coins.map((coin, index) => {
            const trend = getTrendArrow(coin.sentiment);
            const pulseClass = getPulseClass(coin.hypeScore);
            return (
              <div
                key={coin.id}
                id={`coin-card-${coin.symbol}`}
                className={`coin-card ${selectedCoinId === coin.id ? 'selected' : ''}`}
                onClick={() => onCoinSelect(coin.id)}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <div className="coin-card-header">
                  <div className="coin-card-info">
                    <div className={`coin-emoji-wrapper ${pulseClass}`}>
                      <span className="coin-emoji">{coin.emoji}</span>
                    </div>
                    <div>
                      <div className="coin-name">{highlightText(coin.name, searchQuery)}</div>
                      <div className="coin-symbol">{highlightText(coin.symbol, searchQuery)}</div>
                    </div>
                  </div>
                  <span className={`coin-trend-arrow ${trend.className}`}>
                    {trend.arrow}
                  </span>
                </div>
                <div className="coin-hype-row">
                  <div className="hype-bar-container">
                    <div
                      className={`hype-bar-fill ${coin.sentiment}`}
                      style={{ width: `${coin.hypeScore}%` }}
                    />
                  </div>
                  <span className={`hype-score-value sentiment-${coin.sentiment}`}>
                    {coin.hypeScore}
                  </span>
                </div>
                <div className="sparkline-container">
                  <Sparkline data={coin.priceHistory} color={
                    coin.sentiment === 'positive' ? '#00FF88' :
                    coin.sentiment === 'negative' ? '#FF4D4D' : '#FFCC00'
                  } />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
