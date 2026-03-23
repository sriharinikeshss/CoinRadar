import { useState } from 'react';
import { Radar, TrendingUp, Bell, Settings } from 'lucide-react';

const navItems = [
  { icon: Radar, label: 'Radar', id: 'radar' },
  { icon: TrendingUp, label: 'Markets', id: 'markets' },
  { icon: Bell, label: 'Alerts', id: 'alerts' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function Sidebar() {
  const [active, setActive] = useState('radar');

  return (
    <nav className="sidebar">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`sidebar-icon ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
            title={item.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </nav>
  );
}
