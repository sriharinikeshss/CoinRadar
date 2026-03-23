import Sparkline from './Sparkline';

export default function LeftPanel({ coins, selectedCoinId, onCoinSelect }) {
  const getTrendArrow = (sentiment) => {
    if (sentiment === 'positive') return { arrow: '↑', className: 'up' };
    if (sentiment === 'negative') return { arrow: '↓', className: 'down' };
    return { arrow: '→', className: 'neutral' };
  };

  return (
    <aside className="left-panel">
      <div className="left-panel-title">Trending Coins</div>
      {coins.map((coin, index) => {
        const trend = getTrendArrow(coin.sentiment);
        return (
          <div
            key={coin.id}
            id={`coin-card-${coin.symbol}`}
            className={`coin-card ${selectedCoinId === coin.id ? 'selected' : ''}`}
            onClick={() => onCoinSelect(coin.id)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="coin-card-header">
              <div className="coin-card-info">
                <span className="coin-emoji">{coin.emoji}</span>
                <div>
                  <div className="coin-name">{coin.name}</div>
                  <div className="coin-symbol">{coin.symbol}</div>
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
                coin.sentiment === 'positive' ? '#00ff88' :
                coin.sentiment === 'negative' ? '#ff3366' : '#ffcc00'
              } />
            </div>
          </div>
        );
      })}
    </aside>
  );
}
