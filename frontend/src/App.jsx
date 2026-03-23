import { useState } from 'react';
import './App.css';
import { coins as initialCoins, aiInsights as initialInsights, alerts, defaultCoinId } from './data/mockData';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import RadarCore from './components/RadarCore';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import AIAssistant from './components/AIAssistant';
import CoinOverlay from './components/CoinOverlay';
import AddCoinModal from './components/AddCoinModal';

function App() {
  const [coinsData, setCoinsData] = useState(initialCoins);
  const [insightsData, setInsightsData] = useState(initialInsights);
  const [selectedCoinId, setSelectedCoinId] = useState(defaultCoinId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isAddCoinOpen, setIsAddCoinOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const selectedCoin = coinsData.find(c => c.id === selectedCoinId) || coinsData[0];
  const selectedInsight = insightsData.find(i => i.coinId === selectedCoinId) || insightsData[0];

  const filteredCoins = coinsData.filter(c =>
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

  const handleAddCoin = (newCoin, newInsight) => {
    setCoinsData(prev => [...prev, newCoin]);
    setInsightsData(prev => [...prev, newInsight]);
    setIsAddCoinOpen(false);
    setToastMessage(`${newCoin.symbol} added to radar`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="app-container">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddCoin={() => setIsAddCoinOpen(true)}
      />

      <Sidebar />

      <div className="main-area">
        <LeftPanel
          coins={filteredCoins}
          selectedCoinId={selectedCoinId}
          onCoinSelect={handleCoinSelect}
          searchQuery={searchQuery}
        />

        <div className="center-panel">
          <RadarCore
            coins={coinsData}
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

        <BottomPanel coin={selectedCoin} />
      </div>

      <AIAssistant />

      {isAddCoinOpen && (
        <AddCoinModal
          onClose={() => setIsAddCoinOpen(false)}
          onAdd={handleAddCoin}
          nextId={Math.max(...coinsData.map(c => c.id)) + 1}
        />
      )}

      {toastMessage && (
        <div className="success-toast">{toastMessage}</div>
      )}
    </div>
  );
}

export default App;
