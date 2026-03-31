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

USER_ADDED_COINS: set[str] = set()

USE_REAL_DATA: bool = os.getenv("USE_REAL_DATA", "true").lower() in ("true", "1", "yes")

SUBREDDITS = ["CryptoMoonShots", "memecoins"]
CASHTAG_RE = re.compile(r"\$([A-Za-z]{2,12})\b")

REDDIT_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

def _reddit_headers():
    """Return headers with a randomly rotated User-Agent."""
    import random
    return {
        "User-Agent": random.choice(REDDIT_USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
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

# 54 realistic social-media-style posts across 6 coins with mixed sentiment.
# Each post is {coin, text}. These are aggregated at runtime into the same
# dict structure that the live Reddit path produces, so intelligence.py
# receives identical input regardless of data source.

MOCK_POSTS: list[dict] = [
    # ── PEPE (heavily bullish) ──
    {"coin": "PEPE", "text": "$PEPE going to the moon 🚀🚀 this is just the beginning"},
    {"coin": "PEPE", "text": "Huge whale just bought 500B $PEPE, bullish af"},
    {"coin": "PEPE", "text": "$PEPE breaking out right now, don't miss this gem 💎"},
    {"coin": "PEPE", "text": "PEPE is the next 100x, ape in before it's too late"},
    {"coin": "PEPE", "text": "Just loaded up on more $PEPE, wagmi fam 🐸"},
    {"coin": "PEPE", "text": "PEPE chart looking insanely bullish, mooning soon"},
    {"coin": "PEPE", "text": "$PEPE volume is exploding, lambo incoming"},
    {"coin": "PEPE", "text": "Diamond hands on PEPE, this is a banger 💎🙌"},
    {"coin": "PEPE", "text": "Massive accumulation on $PEPE, smart money is buying"},
    # ── WIF (bullish with some caution) ──
    {"coin": "WIF", "text": "$WIF breaking resistance, bullish breakout confirmed 📈"},
    {"coin": "WIF", "text": "dogwifhat is the best meme coin right now, flying 🚀"},
    {"coin": "WIF", "text": "WIF holders are not selling, diamond hands community 💎"},
    {"coin": "WIF", "text": "$WIF pump is real, volume surging like crazy"},
    {"coin": "WIF", "text": "Be careful with $WIF, might see a small pullback first"},
    {"coin": "WIF", "text": "WIF is mooning, best performer this week wagmi"},
    {"coin": "WIF", "text": "$WIF looking based, accumulating more before the next leg up"},
    {"coin": "WIF", "text": "Just aped into $WIF, this gem is going to fly"},
    # ── BONK (mixed / neutral) ──
    {"coin": "BONK", "text": "$BONK moving sideways, waiting for a breakout signal"},
    {"coin": "BONK", "text": "BONK volume is decent but nothing special today"},
    {"coin": "BONK", "text": "$BONK might pump or dump, hard to tell right now"},
    {"coin": "BONK", "text": "Holding my BONK bag, not selling but not buying more"},
    {"coin": "BONK", "text": "BONK community is still active, could see some action soon"},
    {"coin": "BONK", "text": "$BONK consolidating, could go either way from here"},
    {"coin": "BONK", "text": "Small pump on BONK charts, let's see if it holds"},
    {"coin": "BONK", "text": "BONK is a solid meme coin but needs more volume to moon"},
    {"coin": "BONK", "text": "$BONK looking bullish on the 4h chart, could be a gem"},
    # ── FLOKI (bullish) ──
    {"coin": "FLOKI", "text": "$FLOKI is pumping hard, don't sleep on this one 🚀"},
    {"coin": "FLOKI", "text": "FLOKI ecosystem is growing fast, bullish long term"},
    {"coin": "FLOKI", "text": "Just bought more $FLOKI, this is going to be huge"},
    {"coin": "FLOKI", "text": "FLOKI marketing campaign is insane, mooning incoming"},
    {"coin": "FLOKI", "text": "$FLOKI whale activity detected, big pump coming"},
    {"coin": "FLOKI", "text": "FLOKI breaking ATH soon, hodl and enjoy the ride 💎"},
    {"coin": "FLOKI", "text": "Be cautious with FLOKI, some sell pressure at resistance"},
    {"coin": "FLOKI", "text": "$FLOKI flying past all expectations, wagmi"},
    # ── DOGE (neutral / mixed) ──
    {"coin": "DOGE", "text": "$DOGE just chilling, Elon hasn't tweeted in a while"},
    {"coin": "DOGE", "text": "DOGE is stable but boring, need a catalyst to pump"},
    {"coin": "DOGE", "text": "Still holding my $DOGE, it's the OG meme coin"},
    {"coin": "DOGE", "text": "DOGE community is huge but price action is flat"},
    {"coin": "DOGE", "text": "$DOGE might see a small pump if BTC moves up"},
    {"coin": "DOGE", "text": "DOGE is undervalued at this price, bullish medium term"},
    {"coin": "DOGE", "text": "Sold half my $DOGE bag, taking some profits"},
    {"coin": "DOGE", "text": "$DOGE volume declining, not looking great short term"},
    {"coin": "DOGE", "text": "DOGE needs Elon to tweet again for a moon mission 🐕"},
    # ── SHIB (bearish / dump) ──
    {"coin": "SHIB", "text": "$SHIB looking like a rug pull, be careful everyone"},
    {"coin": "SHIB", "text": "SHIB dumping hard, whales are exiting their positions"},
    {"coin": "SHIB", "text": "Sold all my $SHIB, this is going to crash more"},
    {"coin": "SHIB", "text": "SHIB community is in panic mode, massive sell-off"},
    {"coin": "SHIB", "text": "$SHIB dead coin walking, avoid at all costs"},
    {"coin": "SHIB", "text": "SHIB scam alert — devs are dumping on holders"},
    {"coin": "SHIB", "text": "Got rekt on $SHIB, should have sold earlier"},
    {"coin": "SHIB", "text": "$SHIB fud is everywhere, bearish sentiment across the board"},
    {"coin": "SHIB", "text": "Maybe SHIB will recover but I'm not holding my breath"},
    {"coin": "SHIB", "text": "$SHIB is a honeypot, exit while you still can"},
]

# Simulated previous-hour mention counts (for spike detection)
_MOCK_MENTION_HISTORY = {
    "PEPE":  [120, 150, 180, 200, 250],   # rising → current will spike
    "WIF":   [80, 90, 100, 110, 120],      # steady rise
    "BONK":  [100, 95, 105, 100, 98],      # flat
    "FLOKI": [60, 70, 80, 90, 95],         # gradual rise
    "DOGE":  [130, 125, 130, 128, 130],    # flat / stable
    "SHIB":  [150, 140, 120, 100, 80],     # declining
}


def _build_mock_reddit_result() -> dict:
    """
    Aggregate MOCK_POSTS into the same dict structure the live path produces.

    Returns { "PEPE": {"mentions": N, "titles": [...], "history": [...]}, ... }

    Each call shuffles and randomly samples 70-100% of posts so the output
    feels different every time (simulates a live social stream).
    """
    shuffled = MOCK_POSTS.copy()
    random.shuffle(shuffled)

    # Sample 70-100% of posts to add variability
    sample_size = random.randint(int(len(shuffled) * 0.7), len(shuffled))
    sampled = shuffled[:sample_size]

    # Group by coin
    grouped: dict[str, list[str]] = {}
    for post in sampled:
        coin = post["coin"]
        grouped.setdefault(coin, []).append(post["text"])

    # Build result dict matching live structure
    result: dict = {}
    for coin, titles in grouped.items():
        result[coin] = {
            "mentions": len(titles) * random.randint(30, 50),  # scale up to realistic counts
            "titles": titles,
            "history": _MOCK_MENTION_HISTORY.get(coin, [50] * 5),
        }

    return result


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

_reddit_session = requests.Session()

def _fetch_reddit_json(subreddit: str, limit: int = 25) -> list[dict]:
    """
    Fetch recent posts using a persistent session (keeps cookies).
    Tries multiple Reddit domains as fallback.
    """
    domains = ["old.reddit.com", "www.reddit.com"]
    
    for domain in domains:
        url = f"https://{domain}/r/{subreddit}/new.json"
        try:
            _reddit_session.headers.update(_reddit_headers())
            resp = _reddit_session.get(
                url,
                params={"limit": limit, "raw_json": 1},
                timeout=12,
            )
            if resp.status_code in (429, 403):
                print(f"[scraper] {domain} returned {resp.status_code} for r/{subreddit}, trying next...")
                time.sleep(2)
                continue
            resp.raise_for_status()
            children = resp.json().get("data", {}).get("children", [])
            if children:
                print(f"[scraper] Fetched {len(children)} posts from {domain}/r/{subreddit}")
                return [child["data"] for child in children]
        except Exception as exc:
            print(f"[scraper] {domain} failed for r/{subreddit}: {exc}")
            time.sleep(1)
    raise RuntimeError(f"All Reddit endpoints blocked for r/{subreddit}")


def get_reddit_data(limit: int = 50) -> dict:
    if not USE_REAL_DATA:
        print("[scraper] USE_REAL_DATA=false serving mock Reddit data")
        return _build_mock_reddit_result()
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
                seen_in_post: set[str] = set()
                for t in tickers:
                    t_upper = t.upper()
                    if t_upper in TICKER_BLACKLIST or len(t_upper) < 2:
                        continue
                    if t_upper in seen_in_post:
                        continue
                    seen_in_post.add(t_upper)
                    mention_counter[t_upper] += 1
                    sentiment_texts.setdefault(t_upper, []).append(
                        post.get("title", "")
                    )
            time.sleep(3.0)
        except Exception as exc:
            print(f"[scraper] Reddit fetch failed for r/{sub_name}: {exc}")
    if not live_succeeded or not mention_counter:
        print("[scraper] Reddit live data empty/failed falling back to mock data")
        return _build_mock_reddit_result()
    results: dict = {}
    for symbol, count in mention_counter.most_common(20):
        titles = sentiment_texts.get(symbol, [])
        results[symbol] = {"mentions": count, "titles": titles}
    print(f"[scraper] Reddit live data: found {len(results)} symbols")
    return results


# ───────────────────────── DexScreener ─────────────────────────

def get_dexscreener_data(symbol: str) -> Optional[dict]:
    if not USE_REAL_DATA:
        return MOCK_DEX_DATA.get(symbol)
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
            return MOCK_DEX_DATA.get(symbol)
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
        print(f"[scraper] DexScreener lookup failed for {symbol}: {exc}")
        return MOCK_DEX_DATA.get(symbol)


# ───────────────────────── Aggregation pipeline ─────────────────────────

STICKY_COINS = {"PEPE", "DOGE", "SHIB", "WIF", "BONK", "FLOKI"}
MAX_DISPLAY_COINS = 10
_mention_history: dict[str, list[int]] = {}
_prev_scores: dict[str, float] = {}

def build_token_list() -> list[dict]:
    """
    End-to-end pipeline:
      Reddit mentions -> DexScreener enrichment -> final token list.
    
    Parallelizes enrichment to ensure the dashboard loads in < 5 seconds
    even with 10+ coins.
    """
    from intelligence import analyze_coin
    from concurrent.futures import ThreadPoolExecutor
    
    # Reset per-cycle alert cap
    import intelligence
    intelligence._alerts_this_cycle = 0
    
    reddit_data = get_reddit_data()
    if not reddit_data:
        return []

    # Ensure sticky and user-added coins are in the data
    targets = set(STICKY_COINS) | USER_ADDED_COINS
    for target in targets:
        if target not in reddit_data:
            reddit_data[target] = {
                "mentions": 0,
                "titles": [],
                "history": [0] * 5,
            }

    def enrich_token(symbol_data):
        symbol, info = symbol_data
        mentions = info["mentions"]
        
        # DexScreener lookups are the slowest part (network-bound)
        dex = get_dexscreener_data(symbol)
        if dex is None:
            return None

        _mention_history.setdefault(symbol, []).append(mentions)
        
        # History slicing: get up to 5 previous entries
        all_hist = _mention_history[symbol]
        history = all_hist[:-1][-5:] if len(all_hist) > 1 else []
        
        if not history and "history" in info:
            history = info["history"]

        # Stats for AI engine
        avg_mentions = int(sum(history) / max(1, len(history))) if history else mentions
        prev_score = _prev_scores.get(symbol, 50.0)

        # Baseline momentum
        momentum = "stable"
        if prev_score > 0:
            if mentions > avg_mentions * 1.2: momentum = "rising"
            elif mentions < avg_mentions * 0.8: momentum = "falling"

        payload = {
            "coin": dex["symbol"],
            "tweets": info.get("titles", []),
            "mention_count_now": mentions,
            "mention_count_prev": avg_mentions,
            "history": history,
            "momentum": momentum,
        }
        
        # Groq AI analysis (network-bound)
        intelligence_result = analyze_coin(payload)
        pump_score = intelligence_result["pump_score"]

        # Refine momentum
        if pump_score > prev_score + 2: momentum = "rising"
        elif pump_score < prev_score - 2: momentum = "falling"
        
        _prev_scores[symbol] = pump_score

        return {
            "symbol": f"${dex['symbol']}",
            "pump_score": pump_score,
            "ai_insight": intelligence_result["ai_insight"],
            "live_price_usd": dex["price_usd"],
            "mentions_1h": mentions,
            "sentiment_label": intelligence_result.get("sentiment_label", "Neutral"),
            "spike_detected": intelligence_result["spike_detected"],
            "alert_triggered": intelligence_result["alert_triggered"],
            "momentum": momentum,
            "confidence": intelligence_result.get("confidence", "LOW"),
            "signal_type": intelligence_result.get("signal_type", "Monitoring"),
            "trigger_reasons": intelligence_result.get("trigger_reasons", []),
        }

    # Run up to 10 enrichments in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(enrich_token, reddit_data.items()))
    
    tokens = [r for r in results if r is not None]

    # Sort and trim
    tokens.sort(key=lambda t: t["pump_score"], reverse=True)
    tokens = tokens[:MAX_DISPLAY_COINS]

    source = "LIVE" if USE_REAL_DATA else "MOCK"
    print(f"[scraper] [OK] Pipeline complete ({source}): found {len(tokens)} symbols")
    return tokens



