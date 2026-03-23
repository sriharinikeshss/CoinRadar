export default function TopBar({ searchQuery, onSearchChange, onAddCoin }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">HYPE RADAR AI</h1>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            className="search-input"
            type="text"
            placeholder="Search coin..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="add-coin-btn" onClick={onAddCoin}>
          <span className="icon">+</span> Add Coin
        </button>
      </div>
    </header>
  );
}
