import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'DASH', icon: 'grid_view' },
    { id: 'PORT', icon: 'account_balance_wallet' },
    { id: 'ALRT', icon: 'notifications' },
    { id: 'SETT', icon: 'settings' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-full z-50 flex flex-col items-center py-4 bg-[#0e0e0e] w-20 border-r border-[rgba(255,255,255,0.05)] shadow-[0_0_15px_rgba(0,253,135,0.05)] text-center">
      <div className="text-primary-fixed font-black tracking-tighter text-2xl px-4 py-6 font-headline leading-none">N</div>
      <nav className="flex flex-col gap-8 mt-10 w-full items-center">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 w-full py-3 transition-colors active:scale-95 duration-100 hover:bg-white/5 relative
              ${activeTab === tab.id 
                ? "text-primary-fixed after:content-[''] after:absolute after:left-0 after:w-1 after:h-8 after:bg-primary-fixed after:rounded-r-full" 
                : "text-outline hover:text-secondary"}
            `}
          >
            <span className="material-symbols-outlined text-[24px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-headline tracking-tighter font-bold mt-1">{tab.id}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto mb-4">
        <button className="p-[10px] rounded-full bg-surface-container-highest text-primary-container hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center">
          <span className="material-symbols-outlined leading-none">add</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
