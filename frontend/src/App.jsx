import { useState, useEffect, useRef } from 'react';
import './App.css';
import useTokenData from './hooks/useTokenData';
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
  // Live data from backend (falls back to mock if backend is down)
  const { coins: liveCoins, aiInsights: liveInsights, alerts, defaultCoinId, isLive, loading } = useTokenData();

  const [coinsData, setCoinsData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [selectedCoinId, setSelectedCoinId] = useState(defaultCoinId);
  const [activeTab, setActiveTab] = useState('DASH');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isAddCoinOpen, setIsAddCoinOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [pumpAlert, setPumpAlert] = useState(null);
  const shownAlertsRef = useRef(new Set());

  // Use live data as the base, allow local additions via coinsData override
  const currentCoins = coinsData ? [...liveCoins, ...coinsData] : liveCoins;
  const currentInsights = insightsData ? [...liveInsights, ...insightsData] : liveInsights;

  const selectedCoin = currentCoins.find(c => c.id === selectedCoinId) || currentCoins[0];
  const selectedInsight = currentInsights.find(i => i.coinId === selectedCoinId) || currentInsights[0];

  // 🚨 Pump alert toast — fires when any coin has alert_triggered
  useEffect(() => {
    const alertCoin = currentCoins.find(c => c._alert && !shownAlertsRef.current.has(c.symbol));
    if (alertCoin) {
      shownAlertsRef.current.add(alertCoin.symbol);
      setPumpAlert(`🚨 PUMP ALERT — ${alertCoin.symbol} score hit ${alertCoin.hypeScore}!`);
      setTimeout(() => setPumpAlert(null), 5000);
    }
  }, [currentCoins]);

  const filteredCoins = currentCoins.filter(c =>
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
    setCoinsData(prev => [...(prev || []), newCoin]);
    setInsightsData(prev => [...(prev || []), newInsight]);
    setIsAddCoinOpen(false);
    setToastMessage(`${newCoin.symbol} added to radar`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ... (previous state logic remains unchanged) ...

  if (loading && currentCoins.length === 0) {
    return (
      <div className="bg-surface h-screen w-full flex items-center justify-center text-secondary">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📡</div>
          <div className="font-headline tracking-widest text-xs uppercase">Initializing Terminal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-secondary selection:bg-primary selection:text-on-primary-container min-h-screen w-full relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddCoin={() => setIsAddCoinOpen(true)}
      />

      {/* Main Content Canvas */}
      <main className="ml-20 pt-16 h-screen flex flex-col overflow-hidden">
        
        {activeTab === 'DASH' ? (
          <>
            {/* Top Split (Left, Center, Right) */}
            <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
              
              {/* Left Column: TRENDING COINS */}
              <section className="col-span-3 p-6 border-r border-white/5 bg-surface-container-low flex flex-col gap-4 overflow-y-auto w-full">
                <LeftPanel
                  coins={filteredCoins}
                  selectedCoinId={selectedCoinId}
                  onCoinSelect={handleCoinSelect}
                />
              </section>

              {/* Center Area: RADAR VISUALIZATION */}
              <section className="col-span-6 relative flex flex-col items-center justify-center bg-surface overflow-hidden">
                <RadarCore
                  coins={currentCoins}
                  selectedCoinId={selectedCoinId}
                  onBubbleClick={handleBubbleClick}
                />
                {showOverlay && (
                  <CoinOverlay
                    coin={selectedCoin}
                    onClose={() => setShowOverlay(false)}
                  />
                )}

                {/* Connection status indicator */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest border border-white/10 z-50">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-primary shadow-[0_0_8px_#a4ffb9] animate-pulse' : 'bg-[#FFCC00]'}`} />
                  <span className="text-[10px] font-label tracking-widest uppercase font-bold text-on-surface">
                    {isLive ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </section>

              {/* Right Column: AI & ALERTS */}
              <section className="col-span-3 p-6 border-l border-white/5 bg-surface-container-low flex flex-col gap-6 overflow-y-auto">
                <RightPanel
                  coin={selectedCoin}
                  insight={selectedInsight}
                  alerts={alerts}
                />
              </section>
            </div>

            {/* Bottom Section: DASHBOARD FOOTER */}
            <footer className="shrink-0 h-56 bg-surface-container-lowest border-t border-white/5 p-6 grid grid-cols-12 gap-6 relative z-10 w-full overflow-hidden">
              <BottomPanel coin={selectedCoin} />
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full w-full">
            <span className="material-symbols-outlined text-[64px] text-outline mb-6 opacity-20" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
              {activeTab === 'PORT' ? 'account_balance_wallet' : activeTab === 'ALRT' ? 'notifications' : 'settings'}
            </span>
            <h2 className="text-2xl font-headline font-black text-on-surface tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#00fd87] to-[#7ee6ff] mb-2">
              {activeTab} MODULE
            </h2>
            <p className="text-outline mt-2 tracking-wider text-sm font-label uppercase">Under active synchronization with blockchain relays.</p>
            <button 
              onClick={() => setActiveTab('DASH')}
              className="mt-8 px-6 py-2 rounded-full border border-white/10 text-xs font-bold font-headline tracking-widest uppercase hover:bg-white/5 hover:text-[#00fd87] transition-all"
            >
              Return to Radar
            </button>
          </div>
        )}
      </main>

      <AIAssistant />

      {isAddCoinOpen && (
        <AddCoinModal
          onClose={() => setIsAddCoinOpen(false)}
          onAdd={handleAddCoin}
          nextId={Math.max(...currentCoins.map(c => c.id)) + 1}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-headline font-bold text-[11px] tracking-wider shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      {/* 🚨 Pump Alert Toast */}
      {pumpAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-error-container to-error-dim border border-error/50 rounded-xl px-7 py-3 text-sm font-bold font-headline text-white z-[10000] backdrop-blur-md shadow-[0_8px_32px_rgba(255,30,30,0.4)] animate-[slideDown_0.4s_ease-out]">
          {pumpAlert}
        </div>
      )}
    </div>
  );
}

export default App;
