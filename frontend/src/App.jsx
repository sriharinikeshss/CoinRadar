import { useState } from 'react';
import './App.css';
import { coins, aiInsights, alerts, defaultCoinId } from './data/mockData';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import RadarCore from './components/RadarCore';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import AIAssistant from './components/AIAssistant';
import CoinOverlay from './components/CoinOverlay';

function App() {
  const [selectedCoinId, setSelectedCoinId] = useState(defaultCoinId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);

  const selectedCoin = coins.find(c => c.id === selectedCoinId) || coins[0];
  const selectedInsight = aiInsights.find(i => i.coinId === selectedCoinId) || aiInsights[0];

  const filteredCoins = coins.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCoinSelect = (coinId) => {
    setSelectedCoinId(coinId);
    setShowOverlay(false);
  };

  const handleBubbleClick = (coinId) => {
    setSelectedCoinId(coinId);
    setShowOverlay(true);
  };

  return (
    <div className="app-container">
      <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="main-content">
        <LeftPanel
          coins={filteredCoins}
          selectedCoinId={selectedCoinId}
          onCoinSelect={handleCoinSelect}
        />

        <div className="center-panel">
          <RadarCore
            coins={coins}
            selectedCoinId={selectedCoinId}
            onBubbleClick={handleBubbleClick}
          />
          {showOverlay && (
            <CoinOverlay
              coin={selectedCoin}
              onClose={() => setShowOverlay(false)}
            />
          )}
        </div>

        <RightPanel
          coin={selectedCoin}
          insight={selectedInsight}
          alerts={alerts}
        />
      </div>

      <BottomPanel coin={selectedCoin} />

      <AIAssistant />
    </div>
  );
}

export default App;
