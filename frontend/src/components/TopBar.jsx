import React, { useState, useEffect } from 'react';

export default function TopBar({ searchQuery, onSearchChange, onAddCoin }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  return (
    <header className="fixed top-0 right-0 left-20 z-40 flex justify-between items-center px-8 h-16 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-8 flex-1">
        <span className="text-primary font-headline font-bold text-xl tracking-tighter">COINRADAR</span>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input 
            className="w-full bg-surface-container-high border-none rounded-xl py-2 pl-10 pr-4 text-[10px] font-medium tracking-widest text-secondary focus:ring-1 focus:ring-primary transition-all outline-none" 
            placeholder="SEARCH ASSETS, WHALES, TRENDS..." 
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={onAddCoin}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container px-4 py-2 rounded-xl font-headline font-bold text-[10px] tracking-widest uppercase hover:opacity-90 transition-all active:scale-95 cursor-pointer"
        >
          Add Coin
        </button>
        <button 
          className="flex items-center gap-2 bg-[#5865F2]/20 text-[#c1c6fb] border border-[#5865F2]/50 px-4 py-2 rounded-xl font-headline font-bold text-[10px] tracking-widest uppercase hover:bg-[#5865F2]/40 transition-all cursor-pointer shadow-[0_0_15px_rgba(88,101,242,0.15)] hover:shadow-[0_0_20px_rgba(88,101,242,0.3)]"
          onClick={() => window.open("https://discord.gg/ZGddm2GhKS", "_blank")}
        >
          <span className="material-symbols-outlined text-[14px]">webhook</span>
          Live Discord Alerts
        </button>
        <div className="flex flex-col items-end justify-center ml-4 border-l border-white/10 pl-6 h-10 w-24">
          <div className="text-primary font-mono text-[13px] font-bold tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {timeStr}
          </div>
          <div className="text-outline font-label text-[9px] tracking-widest uppercase mt-0.5">
            {dateStr}
          </div>
        </div>
      </div>
    </header>
  );
}
