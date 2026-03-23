"""
CoinRadar – FastAPI Backend
Serves live meme-coin radar data to the React frontend.
"""

import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

_cache = {"data": None, "timestamp": 0}
CACHE_TTL = 60  # seconds


def _get_cached_tokens():
    """Return cached tokens if fresh, otherwise rebuild and cache."""
    now = time.time()
    if _cache["data"] is not None and (now - _cache["timestamp"]) < CACHE_TTL:
        print(f"[api] ✓ Serving cached data ({int(now - _cache['timestamp'])}s old)")
        return _cache["data"]

    print("[api] ↻ Cache miss — rebuilding token list...")
    tokens = build_token_list()
    _cache["data"] = tokens
    _cache["timestamp"] = now
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

    Response schema (list):
      [
        {
          "symbol":          "$PEPE",
          "pump_score":      88,
          "ai_insight":      "Driven by aggressive Reddit accumulation.",
          "live_price_usd":  "0.0000012",
          "mentions_1h":     340,
          "sentiment_label": "Bullish"
        },
        ...
      ]
    """
    tokens = _get_cached_tokens()
    return tokens
