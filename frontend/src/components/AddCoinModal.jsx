import { useState } from 'react';

export default function AddCoinModal({ onClose, onAdd, nextId }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    emoji: '🚀',
    hypeScore: 50,
    sentiment: 'neutral',
    aiInsight: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new coin object compatible with radar
    const newCoin = {
      id: nextId,
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      emoji: formData.emoji,
      hypeScore: parseInt(formData.hypeScore),
      sentiment: formData.sentiment,
      sentimentPercent: parseInt(formData.hypeScore) - 5,
      trendStage: 'Building',
      engagement: parseInt(formData.hypeScore) - 10,
      fomo: parseInt(formData.hypeScore) - 15,
      // Randomize position on radar
      angle: Math.floor(Math.random() * 360),
      // Mock price history 
      priceHistory: Array.from({length: 12}, () => Math.random() * 0.1),
      prediction: Array.from({length: 5}, () => Math.random() * 0.1),
      timeline: [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Added to Radar list manually', type: 'info' }
      ]
    };

    const newInsight = {
      coinId: nextId,
      text: formData.aiInsight || `Our AI detected manual tracking initiated for ${formData.symbol}. Analyzing early signals and community engagement metrics before formulating complete forecast.`
    };

    onAdd(newCoin, newInsight);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Track New Coin</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Coin Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Gigachad"
                required
              />
            </div>
            <div className="form-group">
              <label>Symbol</label>
              <input 
                type="text" 
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g. GIGA"
                required
              />
            </div>
            <div className="form-group">
              <label>Emoji</label>
              <input 
                type="text" 
                name="emoji"
                value={formData.emoji}
                onChange={handleChange}
                placeholder="🚀"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Hype Score (0-100): {formData.hypeScore}</label>
              <input 
                type="range" 
                name="hypeScore"
                min="0" max="100"
                value={formData.hypeScore}
                onChange={handleChange}
                className={`range-slider sentiment-${formData.sentiment}`}
              />
            </div>
            
            <div className="form-group">
              <label>Sentiment</label>
              <select name="sentiment" value={formData.sentiment} onChange={handleChange}>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>AI Insight Override (Optional)</label>
            <textarea 
              name="aiInsight" 
              value={formData.aiInsight}
              onChange={handleChange}
              placeholder="Provide a custom initial insight..."
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add to Radar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
