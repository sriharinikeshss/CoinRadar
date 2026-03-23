"""
CoinRadar – FastAPI Backend
Serves live meme-coin radar data to the React frontend.
"""

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

# ──────────────── Endpoints ────────────────


@app.get("/health")
async def health():
    """Simple liveness probe."""
    return {"status": "ok"}


@app.get("/api/tokens")
async def get_tokens():
    """
    Return the aggregated token list.

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
    tokens = build_token_list()
    return tokens
