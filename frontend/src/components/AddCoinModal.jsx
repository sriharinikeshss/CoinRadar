import { useState } from 'react';

export default function AddCoinModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.symbol) return;
    
    setIsSubmitting(true);
    // Let App.jsx handle the API call and closing
    await onAdd(formData.symbol.toUpperCase(), formData.name);
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Track New Coin</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="text-secondary text-sm mb-4">
            Enter a ticker symbol to inject it into the radar's active scanning pipeline. 
            The system will immediately query DexScreener and cross-reference Reddit activity.
          </p>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Coin Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Gigachad"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group flex-1">
              <label>Symbol</label>
              <input 
                type="text" 
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g. GIGA"
                required
                disabled={isSubmitting}
                className="uppercase"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg border border-outline/30 text-outline hover:bg-surface hover:text-on-surface transition-colors text-sm font-semibold disabled:opacity-50" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg bg-primary text-[#0d0d0d] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,253,135,0.2)] transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isSubmitting || !formData.symbol}
            >
              {isSubmitting ? 'Scanning Network...' : 'Add to Radar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
