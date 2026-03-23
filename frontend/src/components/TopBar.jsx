import React from 'react';

export default function TopBar({ searchQuery, onSearchChange, onAddCoin }) {
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
        <button className="text-primary border border-primary/20 px-4 py-2 rounded-xl font-headline font-bold text-[10px] tracking-widest uppercase hover:bg-primary/10 transition-all cursor-pointer">
          Connect Wallet
        </button>
        <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-6">
          <span className="material-symbols-outlined text-outline hover:text-primary cursor-pointer transition-colors">tune</span>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOyo6xOTCuIKXVj1cMsXw2AXJj_0kcAV3C4m0M9aSIN1NTDD37oM_BzYY6K3WB-G-VOcbiTIMRn1ilX_Uq7pZr4daQaFZfbVaibxNSUZh4Ip2UMOuZ-oLfdtzqQwnW1l0oX5lNkI2kdG5Y61jVQhnqOQ8Xn8SSv_kppqqHEamYL4p-x9KR420VyUG5o4oKWvrAo93B0TFuqeUvI0D7BHnkddl_1Sf4lTwlnV0-BK2LNmWg0cKyugW4Ao3AlG9y_xIwQWDTTJcyDYc"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
