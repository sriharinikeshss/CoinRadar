import React from 'react';

export default function BottomPanel({ coin }) {
  if (!coin) return null;

  // Derive stable values
  const isBullish = coin.sentiment === 'positive';
  const trendPercent = Math.abs(coin.hypeScore - 40).toFixed(1);
  const meterOffset = 125 - (125 * coin.hypeScore) / 100;
  
  let zoneText = "Stable Reentry";
  let megaText = "MODERATE";
  if (coin.hypeScore > 80) { zoneText = "Breakout Imminent"; megaText = "MEGA"; }
  else if (coin.hypeScore > 60) { zoneText = "Accumulation"; megaText = "HIGH"; }
  else if (coin.hypeScore < 30) { zoneText = "Cooling Off"; megaText = "LOW"; }

  const timeline = coin.timeline || [
    { time: '10m ago', event: 'Social volume: 15 mentions/hr', type: 'positive' },
    { time: '1h ago', event: 'Network upgrade estimated in 4h 20m', type: 'neutral' }
  ];

  // Helper to dynamically generate the bottom panel graph exactly bounded to limits
  const generateDynamicPath = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) return { path: '', fill: '' };
    
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    
    // Bounds limit matching viewBox="0 0 350 100" (Y is down)
    const dx = 350 / (history.length - 1 || 1);
    
    const points = history.map((val, i) => {
      const x = i * dx;
      const y = 90 - ((val - min) / range) * 80; // normalize 10->90 to avoid clipping
      return { x, y };
    });

    if (points.length < 2) return { path: '', fill: '' };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        // Simple line drawing to avoid bezier overshoot bounds since User complained about cutting off
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Fill path completes via bottom bounds
    const fill = `${path} L 350 100 L 0 100 Z`;
    
    return { path, fill };
  };

  const graph = generateDynamicPath(coin.priceHistory);

  return (
    <>
      <div className="col-span-5 bg-surface-container rounded-xl p-5 relative overflow-hidden group hover:border-primary/20 transition-all border border-transparent">
        <div className="flex justify-between items-center mb-0">
          <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-outline uppercase">Sentiment Trend ({coin.symbol})</h3>
          <span className={`text-[9px] font-bold px-2 py-1 rounded ${isBullish ? 'text-[#00fd87] bg-[#00fd87]/10' : 'text-[#ff716c] bg-[#ff716c]/10'}`}>
            {isBullish ? '+' : '-'}{trendPercent}% {isBullish ? 'BULLISH' : 'BEARISH'}
          </span>
        </div>
        <div className="h-28 w-full relative mt-0.5">
          <svg className="w-full h-full overflow-hidden" preserveAspectRatio="none" viewBox="0 0 350 100">
            {graph.path && (
              <>
                <path 
                  className={isBullish ? "text-[#00fd87] drop-shadow-[0_0_8px_rgba(0,253,135,0.6)]" : "text-[#ff716c] drop-shadow-[0_0_8px_rgba(255,113,108,0.6)]"} 
                  d={graph.path} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinejoin="round"
                />
                <path 
                  className={isBullish ? "text-[#00fd87]/10" : "text-[#ff716c]/10"} 
                  d={graph.fill} 
                  fill="currentColor" 
                  stroke="none" 
                />
              </>
            )}
          </svg>
        </div>
      </div>

      <div className="col-span-3 bg-surface-container rounded-xl p-5 relative border border-white/5 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-outline uppercase">Hype Meter</h3>
          <span className={`text-[9px] font-bold uppercase ${isBullish ? 'text-[#00fd87]' : 'text-[#7ee6ff]'}`}>{zoneText}</span>
        </div>
        <div className="relative w-32 h-16 mx-auto mt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
            <path className="text-surface-container-highest" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></path>
            <path 
              className={coin.hypeScore < 40 ? "text-[#ff716c] drop-shadow-[0_0_8px_rgba(255,113,108,0.5)]" : "text-[#00fd87] drop-shadow-[0_0_8px_rgba(0,253,135,0.5)]"} 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="currentColor" 
              strokeDasharray="125" 
              strokeDashoffset={meterOffset} 
              strokeLinecap="round" 
              strokeWidth="8"
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <div className="font-headline font-black text-2xl text-on-surface tracking-tighter">{megaText}</div>
            <div className={`text-[8px] tracking-widest uppercase mt-1 ${isBullish ? 'text-[#00fd87]' : 'text-[#7ee6ff]'}`}>Score: {coin.hypeScore}</div>
          </div>
        </div>
      </div>

      <div className="col-span-4 bg-surface-container rounded-xl p-5 border border-white/5 overflow-hidden flex flex-col">
        <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-4 shrink-0">Event Timeline</h3>
        <div className="relative before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {timeline.slice(0, 4).map((item, idx) => (
              <div key={idx} className="relative pl-5 group">
                <div className={`absolute left-0 top-[6px] w-[10px] h-[10px] rounded-full border-[2px] border-surface-container ${idx === 0 ? 'bg-primary shadow-[0_0_8px_rgba(0,253,135,0.6)] z-10' : 'bg-outline/50 z-10'}`}></div>
                <div className={`text-[11px] leading-snug font-medium ${idx === 0 ? 'text-on-surface' : 'text-outline/80'}`}>
                  {idx === 0 ? (
                    <span className="font-bold text-primary">{item.event}</span>
                  ) : (
                    item.event
                  )}
                </div>
                <div className="text-[9px] text-outline/50 tracking-wider mt-0.5">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
