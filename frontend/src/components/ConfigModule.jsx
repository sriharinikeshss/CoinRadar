import React, { useState } from 'react';

export default function ConfigModule() {
  const [useDiscord, setUseDiscord] = useState(true);
  const [strictTolerance, setStrictTolerance] = useState(false);
  const [aiInsights, setAiInsights] = useState(true);

  return (
    <div className="flex-1 flex flex-col items-center p-8 w-full max-w-3xl mx-auto h-full overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between w-full mb-8">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface tracking-widest uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">settings_input_component</span>
            System Configuration
          </h2>
          <p className="text-secondary tracking-wider text-xs font-label uppercase mt-1">
            Engine parameters and external integrations
          </p>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-20">
        
        {/* Webhooks Section */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
          <h3 className="text-primary font-headline font-bold tracking-widest uppercase text-xs mb-6 border-b border-white/5 pb-3">Integrations</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-on-surface font-bold text-sm tracking-wide">Live Discord Webhooks</div>
              <div className="text-secondary text-xs mt-1 max-w-md">Push real-time pump alerts directly to your Discord server channel when scores exceed the threshold.</div>
            </div>
            <button 
              onClick={() => setUseDiscord(!useDiscord)}
              className={`w-12 h-6 rounded-full relative transition-colors ${useDiscord ? 'bg-[#5865F2]' : 'bg-surface-container-highest'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useDiscord ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          {useDiscord && (
            <div className="mt-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#5865F2]/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5865F2]">hub</span>
              <input 
                type="text" 
                disabled 
                value="https://discord.gg/ZGddm2GhKS" 
                className="bg-transparent border-none text-outline text-xs w-full outline-none font-mono"
              />
              <span className="text-[#00fd87] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Connected
              </span>
            </div>
          )}
        </section>

        {/* Engine Section */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
          <h3 className="text-primary font-headline font-bold tracking-widest uppercase text-xs mb-6 border-b border-white/5 pb-3">Heuristic Engine</h3>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-on-surface font-bold text-sm tracking-wide">Strict Spike Tolerance</div>
                <div className="text-secondary text-xs mt-1 max-w-md">Require a 3x standard deviation baseline break to trigger an alert instead of 1.8x.</div>
              </div>
              <button 
                onClick={() => setStrictTolerance(!strictTolerance)}
                className={`w-12 h-6 rounded-full relative transition-colors ${strictTolerance ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${strictTolerance ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-on-surface font-bold text-sm tracking-wide">AI Sentiment Synthesis</div>
                <div className="text-secondary text-xs mt-1 max-w-md">Use Llama-3 to generate contextual reasoning for token breakouts.</div>
              </div>
              <button 
                onClick={() => setAiInsights(!aiInsights)}
                className={`w-12 h-6 rounded-full relative transition-colors ${aiInsights ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiInsights ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
