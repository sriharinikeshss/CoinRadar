import { useState, useRef, useEffect } from 'react';
import { Sparkles, Terminal, X } from 'lucide-react';

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
    { role: 'assistant', text: 'Hi! I\'m your AI Hype Analyst. Ask me about any coin trend, sentiment analysis, or market signals.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const query = inputValue;
    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Add a loading placeholder
    const loadingId = Date.now().toString();
    setMessages(prev => [...prev, { id: loadingId, role: 'assistant', text: "Analyzing live data..." }]);

    try {
      const res = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId ? { role: 'assistant', text: data.response } : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId ? { role: 'assistant', text: "[Connection Error]: Cannot reach AI Brain at localhost:8001." } : msg
      ));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const formatMessage = (text) => {
    if (!text) return null;
    // Replace markdown bold **text** with HTML <strong>text</strong>
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#00fd87]">$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <>
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-title flex items-center gap-2">
              <Terminal size={14} className="text-[#00fd87]" />
              AI HYPE ANALYST
            </div>
            <button className="ai-panel-close" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="ai-panel-messages font-mono text-[11px]">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`ai-message ${msg.role === 'user' ? 'user' : 'bot'} whitespace-pre-wrap leading-relaxed`}
              >
                {formatMessage(msg.text)}
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
            <button className="ai-panel-send" onClick={handleSend}>→</button>
          </div>
        </div>
      )}
      <button
        id="ai-assistant-btn"
        className="fixed bottom-8 right-8 z-[1000] w-12 h-12 rounded-2xl bg-[#00fd87] flex items-center justify-center text-[#0e0e0e] shadow-[0_0_20px_rgba(0,253,135,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(0,253,135,0.6)] transition-all cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        <Sparkles size={22} className="text-[#0e0e0e] fill-current" />
      </button>
    </>
  );
}
