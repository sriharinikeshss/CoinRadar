/**
 * useTokenData – Fetches live coin data from the CoinRadar backend,
 * transforms it into the shape the frontend components expect,
 * and falls back to mockData.js when the backend is unreachable.
 *
 * Auto-refreshes every POLL_INTERVAL ms.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  coins as mockCoins,
  aiInsights as mockInsights,
  alerts as mockAlerts,
  defaultCoinId,
} from '../data/mockData';

const API_BASE = 'http://127.0.0.1:8001';
const POLL_INTERVAL = 60_000; // 60 seconds (matches server cache TTL)

// ── Coin metadata the backend doesn't provide ──
const COIN_META = {
  PEPE:  { name: 'Pepe',      emoji: '🐸' },
  DOGE:  { name: 'Dogecoin',  emoji: '🐕' },
  SHIB:  { name: 'Shiba Inu', emoji: '🦊' },
  WIF:   { name: 'dogwifhat', emoji: '🐶' },
  BONK:  { name: 'Bonk',      emoji: '🏏' },
  FLOKI: { name: 'FLOKI',     emoji: '⚔️' },
  TURBO: { name: 'Turbo',     emoji: '🚀' },
  BRETT: { name: 'Brett',     emoji: '🧢' },
  MOG:   { name: 'Mog Coin',  emoji: '😼' },
  POPCAT:{ name: 'Popcat',    emoji: '🐱' },
};

// Distribute coins evenly around the radar
function assignAngle(index, total) {
  return Math.round((360 / total) * index);
}

// Derive trend stage from pump score
function getTrendStage(score) {
  if (score >= 85) return 'Explosion';
  if (score >= 70) return 'Peak';
  if (score >= 55) return 'Rising';
  if (score >= 40) return 'Building';
  if (score >= 25) return 'Cooling';
  return 'Declining';
}

// Generate synthetic sparkline from pump_score (smooth-ish curve)
function generatePriceHistory(score, price) {
  const base = parseFloat(price) || 0.001;
  const history = [];
  for (let i = 0; i < 12; i++) {
    const noise = 1 + (Math.random() - 0.5) * 0.3;
    const trend = 1 + ((score - 50) / 100) * (i / 12);
    history.push(+(base * trend * noise).toPrecision(4));
  }
  return history;
}

// Generate prediction points extending the sparkline
function generatePrediction(history, score) {
  const last = history[history.length - 1];
  const direction = score > 60 ? 1 : score < 40 ? -1 : 0;
  return Array.from({ length: 5 }, (_, i) => {
    const drift = 1 + direction * 0.04 * (i + 1);
    const noise = 1 + (Math.random() - 0.5) * 0.1;
    return +(last * drift * noise).toPrecision(4);
  });
}

// Generate timeline events from backend data
function generateTimeline(token) {
  const events = [];
  const now = new Date();
  const fmt = (minsAgo) => {
    const d = new Date(now - minsAgo * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (token.spike_detected) {
    events.push({ time: fmt(5), event: `${token.symbol} mention spike detected`, type: 'spike' });
  }
  if (token.alert_triggered) {
    events.push({ time: fmt(2), event: `🚨 PUMP ALERT — score ${token.pump_score}`, type: 'alert' });
  }
  if (token.pump_score >= 80) {
    events.push({ time: fmt(8), event: 'Peak hype territory reached', type: 'peak' });
  }
  if (token.pump_score >= 50) {
    events.push({ time: fmt(15), event: `Social volume: ${token.mentions_1h} mentions/hr`, type: 'spike' });
  }
  // Always have at least one event
  if (events.length === 0) {
    events.push({ time: fmt(30), event: 'Monitoring social signals...', type: 'alert' });
  }
  return events;
}

/**
 * Transform a single backend token object into the shape the
 * React components expect (matching mockData.js structure).
 */
function transformToken(token, index, total) {
  const rawSymbol = token.symbol.replace('$', '');
  const meta = COIN_META[rawSymbol] || { name: rawSymbol, emoji: '🪙' };
  const score = Math.round(token.pump_score);

  // Map sentiment_label → component sentiment string
  let sentiment = 'neutral';
  if (token.sentiment_label === 'Bullish') sentiment = 'positive';
  else if (token.sentiment_label === 'Bearish') sentiment = 'negative';

  const priceHistory = generatePriceHistory(score, token.live_price_usd);
  const prediction = generatePrediction(priceHistory, score);

  return {
    id: index + 1,
    name: meta.name,
    symbol: rawSymbol,
    emoji: meta.emoji,
    hypeScore: score,
    sentiment,
    sentimentPercent: Math.min(100, Math.max(5, score + Math.round((Math.random() - 0.3) * 10))),
    trendStage: getTrendStage(score),
    engagement: Math.min(100, Math.max(10, score + Math.round((Math.random() - 0.5) * 15))),
    fomo: Math.min(100, Math.max(5, Math.round(score * 0.85 + (Math.random() - 0.5) * 10))),
    angle: assignAngle(index, total),
    priceHistory,
    prediction,
    timeline: generateTimeline(token),
    // Extra backend fields (useful for debugging / advanced features)
    _live_price: token.live_price_usd,
    _mentions: token.mentions_1h,
    _spike: token.spike_detected,
    _alert: token.alert_triggered,
    _ai_insight: token.ai_insight,
  };
}

/**
 * Transform the full backend /api/tokens response into
 * { coins, aiInsights, alerts }.
 */
function transformResponse(tokens) {
  const coins = tokens.map((t, i) => transformToken(t, i, tokens.length));

  const aiInsights = coins.map(c => ({
    coinId: c.id,
    text: c._ai_insight || `${c.name} is being monitored. Social signals are ${c.sentiment}.`,
  }));

  const alerts = [];
  for (const c of coins) {
    if (c._alert) {
      alerts.push({
        id: alerts.length + 1,
        type: 'spike',
        message: `🚨 ${c.symbol} pump score hit ${c.hypeScore}!`,
        time: 'Just now',
        severity: 'high',
      });
    }
    if (c._spike) {
      alerts.push({
        id: alerts.length + 1,
        type: 'spike',
        message: `📈 ${c.symbol} mention spike detected`,
        time: '< 1 min ago',
        severity: 'medium',
      });
    }
  }

  // Add some context alerts
  if (coins.length > 0) {
    const top = coins[0];
    alerts.push({
      id: alerts.length + 1,
      type: 'info',
      message: `🔥 ${top.symbol} leads with score ${top.hypeScore}`,
      time: '2 min ago',
      severity: 'low',
    });
  }

  return { coins, aiInsights, alerts };
}

// ── Hook ──

export default function useTokenData() {
  const [coins, setCoins] = useState(mockCoins);
  const [aiInsights, setAiInsights] = useState(mockInsights);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const priceHistoryCache = useRef({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tokens`, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tokens = await res.json();

      if (!Array.isArray(tokens) || tokens.length === 0) {
        throw new Error('Empty response');
      }

      const result = transformResponse(tokens);

      // Preserve price history across polls so sparklines don't reset
      result.coins = result.coins.map(c => {
        if (priceHistoryCache.current[c.symbol]) {
          const prev = priceHistoryCache.current[c.symbol];
          // Append latest price point, keep last 12
          const lastPrice = parseFloat(c._live_price) || prev[prev.length - 1];
          const updated = [...prev.slice(-11), lastPrice];
          c.priceHistory = updated;
          c.prediction = generatePrediction(updated, c.hypeScore);
        }
        priceHistoryCache.current[c.symbol] = c.priceHistory;
        return c;
      });

      setCoins(result.coins);
      setAiInsights(result.aiInsights);
      setAlerts(result.alerts);
      setIsLive(true);
      setError(null);
    } catch (err) {
      console.warn('[CoinRadar] Backend unreachable, using mock data:', err.message);
      setIsLive(false);
      setError(err.message);
      // Keep existing data (mock or last successful fetch)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { coins, aiInsights, alerts, defaultCoinId, isLive, loading, error };
}
