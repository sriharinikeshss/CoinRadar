import { useState, useRef, useEffect } from 'react';

const aiResponses = [
  "Based on current social signals, DOGE and PEPE are showing the strongest momentum. PEPE's hype score of 91 puts it in extreme territory — historically, corrections follow within 24-48 hours.",
  "I'm analyzing Reddit, Twitter, and Telegram data in real-time. The current meme coin cycle appears to be in the 'Peak Euphoria' phase. Consider monitoring exit signals.",
  "The FOMO index across the market is elevated at 72%. This often precedes a brief sentiment shift. Smart money tends to rotate to lower-cap coins during these periods.",
  "Social volume analysis shows a 340% spike in crypto meme discussions over the past 6 hours. This is primarily driven by influencer posts and viral Reddit threads.",
  "Risk assessment: High. The current hype cycle shows similarities to the March 2024 pattern. Recommend monitoring whale wallet movements for early reversal signals.",
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hi! I\'m your AI Hype Analyst. Ask me about any coin trend, sentiment analysis, or market signals.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const response = aiResponses[responseIndex.current % aiResponses.length];
      responseIndex.current++;
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-panel-header">
            <span className="ai-panel-title">🧠 AI ANALYST</span>
            <button className="ai-panel-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="ai-panel-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-panel-input-area">
            <input
              id="ai-assistant-input"
              className="ai-panel-input"
              type="text"
              placeholder="Ask about trends..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="ai-panel-send" onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
      <button
        id="ai-assistant-btn"
        className="ai-assistant-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        🧠
      </button>
    </>
  );
}
