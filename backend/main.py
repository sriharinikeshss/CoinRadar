"""
CoinRadar – FastAPI Backend
Serves live meme-coin radar data to the React frontend.
"""

import time
import os
import asyncio
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

from scraper import build_token_list

# ──────────────── App init ────────────────

app = FastAPI(
    title="CoinRadar API",
    version="1.0.0",
    description="Real-time meme-coin radar powered by Reddit + DexScreener",
)

# Full CORS – required for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────── Cache ────────────────

import threading

_cache: dict[str, Any] = {"data": None, "timestamp": 0.0}
CACHE_TTL = 60  # seconds
_cache_lock = threading.Lock()

def _get_cached_tokens():
    """Return cached tokens if fresh, otherwise rebuild and cache."""
    with _cache_lock:
        now = time.time()
        if _cache["data"] is not None and (now - _cache["timestamp"]) < CACHE_TTL:
            print(f"[api] ✓ Serving cached data ({int(now - _cache['timestamp'])}s old)")
            return _cache["data"]

        print("[api] ↻ Cache miss — rebuilding token list...")
        tokens = build_token_list()
        _cache["data"] = tokens
        _cache["timestamp"] = time.time()
        return tokens


# ──────────────── Endpoints ────────────────

@app.get("/health")
async def health():
    """Simple liveness probe."""
    return {"status": "ok"}


@app.get("/api/tokens")
async def get_tokens():
    """
    Return the aggregated token list (cached for 60s).
    Runs in a thread pool to avoid blocking the async event loop.
    """
    tokens = await asyncio.to_thread(_get_cached_tokens)
    return tokens


@app.get("/api/stats")
async def get_stats():
    """Global market pulse — overview stats for the dashboard header."""
    tokens = await asyncio.to_thread(_get_cached_tokens)
    if not tokens:
        return {"total_coins": 0, "avg_score": 0, "alerts_active": 0, "hottest": "N/A", "market_mood": "NEUTRAL"}
    scores = [t["pump_score"] for t in tokens]
    avg = round(sum(scores) / len(scores), 1)
    return {
        "total_coins": len(tokens),
        "avg_score": avg,
        "alerts_active": sum(1 for t in tokens if t.get("alert_triggered")),
        "hottest": tokens[0]["symbol"] if tokens else "N/A",
        "market_mood": "BULLISH" if avg > 55 else "BEARISH" if avg < 40 else "NEUTRAL",
    }

# ──────────────── AI Chat Integration ────────────────

class ChatRequest(BaseModel):
    message: str

# ──────────────── Chat Rate Limiting ────────────────
_last_chat_time: float = 0.0
CHAT_COOLDOWN: float = 2.0  # seconds between requests

@app.post("/api/chat")
async def chat_with_ai(req: ChatRequest):
    """
    Feeds real-time coin stats to the LLM as system context.
    Rate-limited to prevent Groq credit burn.
    """
    global _last_chat_time
    now = time.time()
    if now - _last_chat_time < CHAT_COOLDOWN:
        return {"response": "[Rate Limited] Please wait a moment before asking again."}
    _last_chat_time = now
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return {"response": "[CoinRadar Terminal Error]: GROQ_API_KEY missing from backend environment variables. Please set it in backend/.env to enable the AI Analyst."}
    
    tokens = await asyncio.to_thread(_get_cached_tokens)
    
    # Format top 10 coins
    context_lines = []
    for t in tokens[:10]:
        context_lines.append(f"- {t.get('symbol', 'UNK')}: Score {t.get('pump_score', 'N/A')} | Sentiment: {t.get('sentiment_label', 'Neutral')} | Intel: {t.get('ai_insight', '')}")
    context_str = "\n".join(context_lines)

    system_prompt = f"""You are the CoinRadar AI Hype Analyst, an edgy but precise crypto data terminal assistant.
CURRENT MARKET DATA (Live context from Reddit/Socials):
{context_str}

RULES:
1. If the user asks about a coin, case-insensitively match their query to the list (e.g., "pepe" = "$PEPE").
2. ALWAYS output in this EXACT markdown format:
**COINRADAR ANALYSIS: $[SYMBOL]**
**SCORE:** [Score]
**SENTIMENT:** [Sentiment]
**INTEL:** [1 sentence max summarizing ai_insight]
3. If the coin is NOT in the data, reply EXACTLY: "[CoinRadar Error]: [query] is not currently trending on the Hype Radar."
4. Do not add any extra conversational text, greetings, or warnings."""

    try:
        client = Groq(api_key=groq_api_key)
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=150,
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        return {"response": f"[Connection Error]: Unable to query AI brain. {str(e)}"}
