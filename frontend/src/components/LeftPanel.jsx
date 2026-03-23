import React, { useMemo } from 'react';

export default function LeftPanel({ coins = [], selectedCoinId, onCoinSelect }) {
  // Helper to generate sparkline path from price history
  const generateSparklinePath = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) return '';
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    
    // SVG is 100% wide, 48px high
    const dx = 200 / (history.length - 1 || 1);
    
    // Use Q curves for smooth lines
    const points = history.map((val, i) => {
      const x = i * dx;
      const y = 48 - ((val - min) / range) * 40 - 4; // normalize to 4-44px
      return { x, y };
    });

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }
    const last = points[points.length - 1];
    path += ` T ${last.x} ${last.y}`;
    
    return path;
  };

  return (
    <>
      <div className="flex justify-between items-end mb-4 flex-shrink-0">
        <h2 className="font-headline text-[11px] font-bold tracking-[0.2em] text-[#00fd87] uppercase">Trending Coins</h2>
        <span className="text-[10px] text-outline font-label uppercase tracking-widest">24H Live</span>
      </div>

      {/* Trending Cards */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-4">
        {coins.map((coin) => {
          if (!coin) return null;
          
          const isSelected = selectedCoinId === coin.id;
          const isPos = coin.sentiment === 'positive';
          const isNeg = coin.sentiment === 'negative';
          
          const trendClass = isPos
            ? 'text-[#00fd87] drop-shadow-[0_0_8px_rgba(0,253,135,0.6)]' 
            : isNeg 
            ? 'text-[#ff716c] drop-shadow-[0_0_8px_rgba(255,113,108,0.6)]' 
            : 'text-[#7ee6ff] drop-shadow-[0_0_8px_rgba(126,230,255,0.6)]';

          const trendIconClass = isPos ? 'text-[#00fd87]' : isNeg ? 'text-[#ff716c]' : 'text-[#7ee6ff]';
          const iconName = isPos ? 'north_east' : isNeg ? 'south_east' : 'east';
          
          // Generate a pseudo-stable percentage for the UI out of the hype score 
          const fakePercent = Math.round(((coin.hypeScore || 0) * 0.8) + ((coin.id ? String(coin.id).charCodeAt(0) : 0) % 15));
          
          return (
            <div 
              key={coin.id || Math.random()} 
              onClick={() => onCoinSelect && onCoinSelect(coin.id)}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-300 group relative overflow-hidden
                ${isSelected ? 'bg-surface-container-highest border border-[#00fd87]/20 shadow-[0_0_15px_rgba(0,253,135,0.05)]' : 'bg-[#0A0A0A] hover:bg-surface-container-highest border border-white/5'}
              `}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                  <div className="text-on-surface font-headline font-black tracking-tighter text-sm flex items-center gap-2">
                    {coin.emoji && <span>{coin.emoji}</span>}
                    {coin.symbol ? String(coin.symbol).replace('$', '') : 'TKN'}
                  </div>
                  <div className="text-[9px] text-outline tracking-wider uppercase mt-0.5">{coin.name || 'Unknown'} • SCORE {coin.hypeScore || 0}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`${trendIconClass} text-xs font-bold leading-none`}>
                    {isPos ? '+' : isNeg ? '-' : ''}{fakePercent}%
                  </span>
                  <span className={`material-symbols-outlined ${trendIconClass} text-[16px] leading-tight mt-1 font-bold`}>
                    {iconName}
                  </span>
                </div>
              </div>
              <div className="h-10 w-full mt-2 relative z-10">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 200 48">
                  <path 
                    className={trendClass} 
                    d={generateSparklinePath(coin.priceHistory)} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      {(() => {
        const selectedCoin = coins.find(c => c.id === selectedCoinId) || coins[0] || {};
        const isHighVola = selectedCoin.hypeScore > 50;
        const fakeVol = selectedCoin.hypeScore ? (selectedCoin.hypeScore * 1.4).toFixed(1) + 'M' : '54.2M';
        
        return (
          <div className="mt-auto p-4 bg-[#0A0A0A] rounded-xl border border-white/5 flex-shrink-0">
            <div className="text-[10px] font-bold text-outline tracking-[0.2em] mb-4 uppercase">
              Market Pulse {selectedCoin.symbol ? `(${String(selectedCoin.symbol).replace('$', '')})` : ''}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] text-outline uppercase tracking-widest">24H Volume</div>
                <div className="text-on-surface font-headline font-bold text-sm">${fakeVol}</div>
              </div>
              <div>
                <div className="text-[9px] text-outline uppercase tracking-widest">Volatility</div>
                <div className={`font-headline font-bold text-sm flex items-baseline gap-1 ${isHighVola ? 'text-[#ff716c]' : 'text-[#00fd87]'}`}>
                  {isHighVola ? 'HIGH' : 'LOW'} <span className="text-[8px] text-outline font-normal">IDX</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
