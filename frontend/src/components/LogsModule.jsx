import React, { useRef, useEffect } from 'react';

export default function LogsModule({ alerts }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom like a terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts]);

  return (
    <div className="flex-1 flex flex-col items-center p-8 w-full max-w-4xl mx-auto h-full overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface tracking-widest uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">terminal</span>
            System Activity Logs
          </h2>
          <p className="text-secondary tracking-wider text-xs font-label uppercase mt-1">
            Real-time heuristic engine event feed
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Recording</span>
        </div>
      </div>

      <div className="w-full flex-1 bg-[#050505] border border-white/5 rounded-2xl overflow-hidden flex flex-col relative z-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
        <div className="flex-1 overflow-y-auto w-full p-6 custom-scrollbar font-mono text-sm flex flex-col gap-2">
          <div className="text-outline/50 mb-4 whitespace-pre-wrap">
            {`> COINRADAR KERNEL v1.0.4 initialized
> Hooking into Reddit firehose... [OK]
> Synchronizing DexScreener market oracles... [OK]
> Awaiting semantic signals...`}
          </div>

          {alerts.map((alert, i) => {
            let color = 'text-[#7ee6ff]';
            let bg = 'bg-[#7ee6ff]/10';
            let icon = 'info';

            if (alert.severity === 'high') {
              color = 'text-[#ff716c]';
              bg = 'bg-[#ff716c]/10';
              icon = 'warning';
            } else if (alert.severity === 'medium') {
              color = 'text-[#00fd87]';
              bg = 'bg-[#00fd87]/10';
              icon = 'bolt';
            }

            return (
              <div 
                key={alert.id || i}
                className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded px-2 animate-[slideDown_0.2s_ease-out]"
              >
                <div className="text-secondary opacity-50 text-[11px] mt-0.5 whitespace-nowrap min-w-[70px]">
                  {alert.time}
                </div>
                <div className={`p-1 rounded ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                </div>
                <div className="flex-1">
                  <div className={`font-bold ${color} tracking-wide`}>
                    [{alert.type.toUpperCase()}]
                  </div>
                  <div className="text-outline mt-0.5 leading-relaxed text-[13px]">
                    {alert.message}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
