import React from 'react';

export default function RightPanel({ coin, insight, alerts }) {
  if (!coin) return null;

  return (
    <>
      {/* AI INSIGHT */}
      <div className="bg-surface-container-highest rounded-xl p-5 border border-primary/10 relative overflow-hidden shrink-0">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
            <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-on-surface uppercase">AI Insight</h3>
          </div>
          {coin._confidence && (
            <span className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase ${
              coin._confidence === 'HIGH' ? 'bg-primary/15 text-primary border border-primary/20' :
              coin._confidence === 'MEDIUM' ? 'bg-tertiary/15 text-tertiary border border-tertiary/20' :
              'bg-outline/15 text-outline border border-outline/20'
            }`}>
              {coin._confidence}
            </span>
          )}
        </div>
        <p className="text-xs text-secondary leading-relaxed font-light">
          {coin._ai_insight ? (
            <span dangerouslySetInnerHTML={{ __html: coin._ai_insight.replace(new RegExp(coin.symbol, 'g'), `<span class="text-primary font-bold">${coin.symbol}</span>`) }} />
          ) : insight ? (
            <span dangerouslySetInnerHTML={{ __html: insight.text.replace(new RegExp(coin.symbol, 'g'), `<span class="text-primary font-bold">${coin.symbol}</span>`) }} />
          ) : (
            `Analyzing real-time signals for ${coin.symbol}...`
          )}
        </p>
        {coin._signal_type && coin._signal_type !== 'Monitoring' && (
          <div className={`mt-3 inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-lg ${
            coin._signal_type === 'Strong Signal' ? 'bg-error-container/20 text-error border border-error/20' :
            'bg-tertiary/10 text-tertiary border border-tertiary/20'
          }`}>
            <span className="material-symbols-outlined text-[12px]">
              {coin._signal_type === 'Strong Signal' ? 'local_fire_department' : 'trending_up'}
            </span>
            {coin._signal_type.toUpperCase()}
          </div>
        )}
      </div>

      {/* LIVE ALERTS */}
      <div className="flex flex-col gap-3 shrink-0">
        <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-outline uppercase px-1">Live Alerts</h3>
        
        {alerts.length === 0 && (
          <div className="text-[11px] text-outline py-4 px-2 italic">Monitoring network...</div>
        )}

        {alerts.map((alert) => {
          const isHigh = alert.severity === 'high';
          const isMedium = alert.severity === 'medium';
          
          return (
            <div 
              key={alert.id}
              className={`${isHigh ? 'bg-error-container/10 border-error/10' : isMedium ? 'bg-surface-container border-tertiary/10' : 'bg-surface-container border-white/5'} border rounded-xl p-4 flex items-start gap-3 transition-transform hover:-translate-x-1 duration-200 cursor-default`}
            >
              <span className={`material-symbols-outlined text-lg ${isHigh ? 'text-error' : isMedium ? 'text-tertiary' : 'text-primary'}`}>
                {alert.icon || (isHigh ? 'local_fire_department' : isMedium ? 'bolt' : 'notifications')}
              </span>
              <div>
                <div className="text-[10px] font-bold text-on-surface mb-1 flex justify-between items-center w-full">
                  <span>{alert.title || 'NETWORK EVENT'}</span>
                  <span className="text-[9px] font-normal text-outline ml-4">{alert.time}</span>
                </div>
                <div className="text-[11px] text-secondary">{alert.message}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK METRICS */}
      <div className="mt-auto shrink-0 pb-4">
        <h3 className="font-headline text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-4 px-1">Quick Metrics</h3>
        <div className="grid grid-cols-3 gap-2">
          
          {/* Sentiment */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full rotate-[270deg]">
                <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-primary drop-shadow-[0_0_4px_rgba(0,253,135,0.4)] transition-all duration-1000 ease-out" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.max(0, coin.sentimentPercent || coin.hypeScore)) / 100} strokeWidth="4" strokeLinecap="round"></circle>
              </svg>
              <span className="absolute text-[10px] font-bold text-on-surface font-headline">{coin.sentimentPercent || coin.hypeScore}%</span>
            </div>
            <span className="text-[8px] text-outline uppercase tracking-widest font-bold">Sentiment</span>
          </div>

          {/* FOMO */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full rotate-[270deg]">
                <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-tertiary drop-shadow-[0_0_4px_rgba(126,230,255,0.4)] transition-all duration-1000 ease-out" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175" strokeDashoffset={175 - (175 * (coin.fomoPercent || Math.max(0, coin.hypeScore - 15))) / 100} strokeWidth="4" strokeLinecap="round"></circle>
              </svg>
              <span className="absolute text-[10px] font-bold text-on-surface font-headline">{coin.fomoPercent || Math.max(0, coin.hypeScore - 15)}%</span>
            </div>
            <span className="text-[8px] text-outline uppercase tracking-widest font-bold">FOMO</span>
          </div>

          {/* Engage */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full rotate-[270deg]">
                <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-[#00fd87] drop-shadow-[0_0_4px_rgba(0,253,135,0.4)] transition-all duration-1000 ease-out" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.max(0, coin.hypeScore)) / 100} strokeWidth="4" strokeLinecap="round"></circle>
              </svg>
              <span className="absolute text-[10px] font-bold text-on-surface font-headline">{coin.hypeScore}%</span>
            </div>
            <span className="text-[8px] text-outline uppercase tracking-widest font-bold">Engage</span>
          </div>
        </div>
      </div>
    </>
  );
}
