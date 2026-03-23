import { Search, Plus } from 'lucide-react';
import LiveClock from './LiveClock';

export default function TopBar({ searchQuery, onSearchChange, onAddCoin }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <h1 className="topbar-title">CoinRadar</h1>
        </div>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>
      <div className="topbar-right">
        <div className="search-container">
          <span className="search-icon">
            <Search size={14} />
          </span>
          <input
            id="search-input"
            className="search-input"
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="add-coin-btn" onClick={onAddCoin}>
          <Plus size={14} /> Add Coin
        </button>
        <LiveClock />
      </div>
    </header>
  );
}
