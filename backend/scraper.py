"""
CoinRadar – Hybrid Scraper Module
Fetches trending meme-coin mentions from Reddit (JSON endpoint via requests)
and enriches them with live DexScreener market data.

If Reddit is unreachable or rate-limited, automatically falls back to
curated mock data so the frontend always gets a stable response.

Toggle:  USE_REAL_DATA = True  → try live APIs first, fallback on failure
         USE_REAL_DATA = False → always serve mock data (demo / offline mode)
"""

import os
import re
import time
import random
import collections
from typing import Optional

import requests
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────── Configuration ───────────────────────

USE_REAL_DATA: bool = os.getenv("USE_REAL_DATA", "true").lower() in ("true", "1", "yes")

SUBREDDITS = ["CryptoMoonShots", "memecoins"]
CASHTAG_RE = re.compile(r"\$([A-Za-z]{2,12})\b")

REDDIT_JSON_HEADERS = {
    "User-Agent": os.getenv("REDDIT_USER_AGENT", "CoinRadar/1.0 (by /u/coinradar_bot)"),
}

# Common English words that look like tickers but aren't
TICKER_BLACKLIST = {
    "THE", "AND", "FOR", "NOT", "YOU", "ALL", "CAN", "HER", "WAS",
    "ONE", "OUR", "OUT", "HAS", "HIM", "HOW", "MAN", "NEW", "NOW",
    "OLD", "SEE", "WAY", "WHO", "DID", "GET", "LET", "SAY", "SHE",
    "TOO", "USE", "BUY", "SELL", "USD", "ETH", "BTC", "SOL",
}

DEXSCREENER_SEARCH = "https://api.dexscreener.com/latest/dex/search"

# ─────────────────────── Mock / Fallback Data ───────────────────────

MOCK_REDDIT_DATA: dict = {
    "PEPE":  {"mentions": 340, "sentiment_hint": "Bullish"},
    "WIF":   {"mentions": 210, "sentiment_hint": "Bullish"},
    "BONK":  {"mentions": 185, "sentiment_hint": "Neutral"},
    "FLOKI": {"mentions": 150, "sentiment_hint": "Bullish"},
    "DOGE":  {"mentions": 130, "sentiment_hint": "Neutral"},
    "SHIB":  {"mentions": 95,  "sentiment_hint": "Bearish"},
    "TURBO": {"mentions": 78,  "sentiment_hint": "Bullish"},
    "BRETT": {"mentions": 65,  "sentiment_hint": "Neutral"},
    "MOG":   {"mentions": 52,  "sentiment_hint": "Bullish"},
    "POPCAT":{"mentions": 45,  "sentiment_hint": "Neutral"},
}

MOCK_DEX_DATA: dict = {
    "PEPE":  {"price_usd": "0.0000012",  "symbol": "PEPE",  "name": "Pepe",         "volume_24h": 890000,  "liquidity_usd": 420000},
    "WIF":   {"price_usd": "0.38",       "symbol": "WIF",   "name": "dogwifhat",    "volume_24h": 620000,  "liquidity_usd": 310000},
    "BONK":  {"price_usd": "0.0000095",  "symbol": "BONK",  "name": "Bonk",         "volume_24h": 450000,  "liquidity_usd": 250000},
    "FLOKI": {"price_usd": "0.000042",   "symbol": "FLOKI", "name": "FLOKI",        "volume_24h": 380000,  "liquidity_usd": 195000},
    "DOGE":  {"price_usd": "0.082",      "symbol": "DOGE",  "name": "Dogecoin",     "volume_24h": 1200000, "liquidity_usd": 800000},
    "SHIB":  {"price_usd": "0.0000088",  "symbol": "SHIB",  "name": "Shiba Inu",    "volume_24h": 560000,  "liquidity_usd": 350000},
    "TURBO": {"price_usd": "0.0028",     "symbol": "TURBO", "name": "Turbo",        "volume_24h": 210000,  "liquidity_usd": 140000},
    "BRETT": {"price_usd": "0.018",      "symbol": "BRETT", "name": "Brett",        "volume_24h": 180000,  "liquidity_usd": 110000},
    "MOG":   {"price_usd": "0.00000065", "symbol": "MOG",   "name": "Mog Coin",     "volume_24h": 150000,  "liquidity_usd": 95000},
    "POPCAT":{"price_usd": "0.12",       "symbol": "POPCAT","name": "Popcat",       "volume_24h": 130000,  "liquidity_usd": 80000},
}


# ───────────────────────── Reddit (JSON endpoint) ─────────────────────────

def _fetch_reddit_json(subreddit: str, limit: int = 50) -> list[dict]:
    """
    Fetch recent posts from a subreddit using the public JSON endpoint.
    No OAuth / PRAW required.  Returns a list of post dicts.
    Raises on HTTP errors or rate-limiting.
    """
    url = f"https://www.reddit.com/r/{subreddit}/new.json"
    resp = requests.get(
        url,
        headers=REDDIT_JSON_HEADERS,
        params={"limit": limit, "raw_json": 1},
        timeout=10,
    )
    # Reddit returns 429 when rate-limited
    if resp.status_code == 429:
        raise RuntimeError(f"Reddit rate-limited on r/{subreddit}")
    resp.raise_for_status()

    children = resp.json().get("data", {}).get("children", [])
    return [child["data"] for child in children]


def get_reddit_data(limit: int = 50) -> dict:
    """
    Try the live Reddit JSON endpoint.
    On ANY failure, fall back to MOCK_REDDIT_DATA seamlessly.

    Returns
    -------
    dict  –  { "PEPE": {"mentions": 42, "sentiment_hint": "Bullish"}, … }
    """
    if not USE_REAL_DATA:
        print("[scraper] ℹ USE_REAL_DATA=false → serving mock Reddit data")
        return MOCK_REDDIT_DATA

    # ── Attempt live fetch ──
    mention_counter = collections.Counter()
    sentiment_texts: dict[str, list[str]] = {}
    live_succeeded = False

    for sub_name in SUBREDDITS:
        try:
            posts = _fetch_reddit_json(sub_name, limit)
            live_succeeded = True
            for post in posts:
                blob = f"{post.get('title', '')} {post.get('selftext', '')}"
                tickers = CASHTAG_RE.findall(blob)
                for t in tickers:
                    t_upper = t.upper()
                    if t_upper in TICKER_BLACKLIST or len(t_upper) < 2:
                        continue
                    mention_counter[t_upper] += 1
                    sentiment_texts.setdefault(t_upper, []).append(
                        post.get("title", "")
                    )
            # Small delay between sub requests to be polite
            time.sleep(1.0)
        except Exception as exc:
            print(f"[scraper] ⚠ Reddit fetch failed for r/{sub_name}: {exc}")

    # If we got nothing useful from live data, fall back
    if not live_succeeded or not mention_counter:
        print("[scraper] ⚠ Reddit live data empty/failed → falling back to mock data")
        return MOCK_REDDIT_DATA

    # Build result dict (top-20 by mentions)
    results: dict = {}
    for symbol, count in mention_counter.most_common(20):
        titles = sentiment_texts.get(symbol, [])
        hint = _simple_sentiment(titles)
        results[symbol] = {"mentions": count, "sentiment_hint": hint}

    print(f"[scraper] ✓ Reddit live data: found {len(results)} symbols")
    return results


def _simple_sentiment(titles: list[str]) -> str:
    """Dirt-simple keyword sentiment. Good enough for a hackathon."""
    text = " ".join(titles).lower()
    bull_words = ["moon", "pump", "buy", "gem", "100x", "rocket",
                  "accumulate", "bullish", "send it", "ape"]
    bear_words = ["dump", "rug", "scam", "sell", "dead", "bearish", "avoid"]
    bull = sum(1 for w in bull_words if w in text)
    bear = sum(1 for w in bear_words if w in text)
    if bull > bear:
        return "Bullish"
    if bear > bull:
        return "Bearish"
    return "Neutral"


# ───────────────────────── DexScreener ─────────────────────────

def get_dexscreener_data(symbol: str) -> Optional[dict]:
    """
    Try live DexScreener search.  On failure, return mock data for
    known symbols or None for unknown ones.

    Returns
    -------
    dict | None  –  { "price_usd": str, "symbol": str, "name": str,
                       "volume_24h": float, "liquidity_usd": float }
    """
    if not USE_REAL_DATA:
        return MOCK_DEX_DATA.get(symbol)

    # ── Attempt live fetch ──
    try:
        resp = requests.get(
            DEXSCREENER_SEARCH,
            params={"q": symbol},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        pairs = data.get("pairs") or []
        if not pairs:
            # No live result → try mock fallback for known symbols
            return MOCK_DEX_DATA.get(symbol)

        # Pick the pair with the highest USD liquidity
        best = max(
            pairs,
            key=lambda p: float((p.get("liquidity") or {}).get("usd") or 0),
        )
        return {
            "price_usd": best.get("priceUsd", "0"),
            "symbol": best.get("baseToken", {}).get("symbol", symbol),
            "name": best.get("baseToken", {}).get("name", symbol),
            "volume_24h": float(best.get("volume", {}).get("h24") or 0),
            "liquidity_usd": float(
                (best.get("liquidity") or {}).get("usd") or 0
            ),
        }
    except Exception as exc:
        print(f"[scraper] ⚠ DexScreener lookup failed for {symbol}: {exc}")
        # Graceful fallback
        return MOCK_DEX_DATA.get(symbol)


# ───────────────────────── Aggregation pipeline ─────────────────────────

def build_token_list() -> list[dict]:
    """
    End-to-end pipeline:
      Reddit mentions  ➜  DexScreener enrichment  ➜  final token list.

    Always returns a well-formed list, even under total API failure
    (falls back to mock data).  The frontend always gets stable output.
    """
    reddit_data = get_reddit_data()

    if not reddit_data:
        print("[scraper] ⚠ No data at all — returning empty list")
        return []

    tokens: list[dict] = []

    for symbol, info in reddit_data.items():
        mentions = info["mentions"]
        sentiment = info["sentiment_hint"]

        dex = get_dexscreener_data(symbol)
        if dex is None:
            continue

        pump_score = _compute_pump_score(mentions, dex)
        ai_insight = _generate_insight(symbol, mentions, sentiment, dex)

        tokens.append({
            "symbol": f"${dex['symbol']}",
            "pump_score": pump_score,
            "ai_insight": ai_insight,
            "live_price_usd": dex["price_usd"],
            "mentions_1h": mentions,
            "sentiment_label": sentiment,
        })

        # Be polite to free APIs
        if USE_REAL_DATA:
            time.sleep(0.3)

    # Sort by pump_score descending
    tokens.sort(key=lambda t: t["pump_score"], reverse=True)

    source = "LIVE" if USE_REAL_DATA else "MOCK"
    print(f"[scraper] ✓ Pipeline complete ({source}): {len(tokens)} tokens")
    return tokens


def _compute_pump_score(mentions: int, dex: dict) -> int:
    """
    Heuristic 0-100 pump score.
    Factors: social mentions, 24h volume, liquidity.
    """
    mention_score = min(mentions / 50, 1.0) * 40          # max 40 pts
    volume_score = min(dex["volume_24h"] / 500_000, 1.0) * 30  # max 30 pts
    liq_score = min(dex["liquidity_usd"] / 200_000, 1.0) * 30  # max 30 pts
    return min(int(mention_score + volume_score + liq_score), 100)


def _generate_insight(
    symbol: str,
    mentions: int,
    sentiment: str,
    dex: dict,
) -> str:
    """Return a short, human-readable insight string."""
    vol = dex["volume_24h"]
    liq = dex["liquidity_usd"]

    if sentiment == "Bullish" and mentions > 10:
        return (
            f"Driven by aggressive Reddit accumulation with "
            f"{mentions} mentions and ${vol:,.0f} 24h volume."
        )
    if sentiment == "Bearish":
        return (
            f"Caution: bearish sentiment detected across "
            f"{mentions} mentions despite ${liq:,.0f} liquidity."
        )
    return (
        f"Moderate buzz with {mentions} mentions, "
        f"${vol:,.0f} volume and ${liq:,.0f} liquidity."
    )
