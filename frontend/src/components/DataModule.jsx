import React from 'react';

// Tiny inline SVG sparkline component
const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default function DataModule({ coins, searchQuery }) {
  // Filter and sort by Hype Score (highest first)
  const sortedFilteredCoins = coins
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.hypeScore - a.hypeScore);

  return (
    <div className="flex-1 flex flex-col items-center p-8 w-full max-w-6xl mx-auto h-full overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface tracking-widest uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">table_chart</span>
            Live Market Data
          </h2>
          <p className="text-secondary tracking-wider text-xs font-label uppercase mt-1">
            Analyzing {sortedFilteredCoins.length} active meme assets
          </p>
        </div>
      </div>

      <div className="w-full bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0 relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="overflow-y-auto w-full h-full custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0e0e0e]/95 backdrop-blur-md z-20 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase">Rank</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase">Asset</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase">Trend</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase">Momentum</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase">Score</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold text-outline tracking-widest uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredCoins.map((coin, index) => {
                const isTop1 = index === 0 && searchQuery === '';
                
                // Color mappings
                let scoreColor = 'text-[#7ee6ff]';
                if (coin.hypeScore >= 70) scoreColor = 'text-[#00fd87]';
                else if (coin.hypeScore < 50) scoreColor = 'text-[#ff716c]';

                // We assume _mentions is available from backend wrapper, but if not fallback to fomo
                const momentum = coin._momentum || (coin.hypeScore > 65 ? 'rising' : coin.hypeScore < 40 ? 'falling' : 'stable');
                
                let momentumIcon = 'trending_flat';
                let momentumColor = 'text-outline';
                if (momentum === 'rising') { momentumIcon = 'trending_up'; momentumColor = 'text-primary'; }
                if (momentum === 'falling') { momentumIcon = 'trending_down'; momentumColor = 'text-error'; }

                return (
                  <tr 
                    key={coin.id} 
                    className={`group transition-all duration-200 cursor-pointer ${
                      isTop1 
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'border-b border-white/5 hover:bg-surface-container-highest'
                    }`}
                  >
                    <td className="px-6 py-4">
                      {isTop1 ? (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs ring-1 ring-primary/50 shadow-[0_0_10px_rgba(0,253,135,0.4)]">
                          1
                        </span>
                      ) : (
                        <span className="text-outline font-label text-sm pl-2">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-lg">
                          {coin.emoji}
                        </div>
                        <div>
                          <div className={`font-headline font-bold text-sm tracking-widest ${isTop1 ? 'text-primary' : 'text-on-surface'}`}>
                            {coin.symbol}
                          </div>
                          <div className="text-[10px] text-secondary font-label">{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <Sparkline 
                        data={coin.priceHistory} 
                        color={momentum === 'falling' ? '#ff716c' : '#00fd87'} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 ${momentumColor} text-xs font-bold font-label uppercase tracking-wider`}>
                        <span className="material-symbols-outlined text-[16px]">{momentumIcon}</span>
                        {momentum}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-headline font-bold text-lg ${scoreColor} drop-shadow-[0_0_8px_currentColor]`}>
                      {coin.hypeScore}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {sortedFilteredCoins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-outline">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
              <p className="text-xs font-label tracking-widest uppercase">No assets match criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
