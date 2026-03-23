"""
CoinRadar — ML & Intelligence Module
=====================================
Owned by: Dev 2 (ML & Intelligence Engineer)

Single-entry API:  analyze_coin(payload) -> dict
Do NOT edit main.py — that belongs to Dev 1.
"""

import os
import datetime
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────

SPIKE_THRESHOLD = 2.5          # current must be 2.5x rolling avg to count as spike
ALERT_THRESHOLD = 85           # pump_score above this triggers Discord alert
ROLLING_WINDOW  = 5            # number of historical data points for spike calc

DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")

# Weights for pump score (must sum to 1.0)
WEIGHT_SENTIMENT = 0.40
WEIGHT_SPIKE     = 0.35
WEIGHT_KEYWORD   = 0.25

# ──────────────────────────────────────────────
# SECTION 1 — Crypto Sentiment Engine
# ──────────────────────────────────────────────

# Custom crypto lexicon updates for VADER
CRYPTO_LEXICON = {
    # Positive
    "moon":     3.0,
    "mooning":  3.2,
    "pump":     2.5,
    "gem":      2.0,
    "bullish":  2.8,
    "ape":      1.5,
    "wagmi":    2.5,
    "100x":     3.5,
    "lambo":    2.0,
    "hodl":     1.8,
    "flying":   2.0,
    "banger":   2.2,
    "based":    1.5,
    "buy":      1.5,
    "rocket":   2.0,
    "🚀":       3.0,
    "💎":       2.0,
    # Negative
    "rug":     -3.5,
    "rugpull": -3.8,
    "dump":    -3.0,
    "rekt":    -3.2,
    "scam":    -3.5,
    "exit":    -2.0,
    "ponzi":   -3.5,
    "crash":   -3.0,
    "honeypot":-3.5,
    "fud":     -2.5,
    "dead":    -2.5,
    "sell":    -1.5,
}

# Build the analyzer once (module-level singleton)
_analyzer = SentimentIntensityAnalyzer()
_analyzer.lexicon.update(CRYPTO_LEXICON)


def analyze_sentiment(tweets: list) -> float:
    """
    Analyze a list of tweet strings and return
    an average VADER compound score in [-1.0, 1.0].
    """
    if not tweets:
        return 0.0
    total = sum(_analyzer.polarity_scores(t)["compound"] for t in tweets)
    return round(total / len(tweets), 4)


# ──────────────────────────────────────────────
# SECTION 2 — Pump Score Calculation
# ──────────────────────────────────────────────

def _count_keyword_hits(tweets: list) -> int:
    """Count how many crypto-lexicon keywords appear across all tweets."""
    keywords = set(CRYPTO_LEXICON.keys())
    hits = 0
    for tweet in tweets:
        for word in tweet.lower().split():
            if word in keywords:
                hits += 1
    return hits


def calculate_pump_score(
    sentiment: float,
    mention_count_now: int,
    mention_count_prev: int,
    keyword_hits: int,
) -> float:
    """
    Combine three signals into a 0–100 pump score.

    Components (clamped to 0–1 before weighting):
        sentiment_norm  = (compound + 1) / 2          → 0–1
        spike_score     = min(1, ratio / 3)            → 0–1
        keyword_score   = min(1, keyword_hits / 10)    → 0–1
    """
    # 1. Sentiment: convert [-1, 1] → [0, 1]
    sentiment_norm = max(0.0, min(1.0, (sentiment + 1) / 2))

    # 2. Mention spike ratio (safe division)
    ratio = mention_count_now / max(1, mention_count_prev)
    spike_score = min(1.0, ratio / 3.0)

    # 3. Keyword density (simplified — no tokenization needed)
    keyword_score = min(1.0, keyword_hits / 10.0)

    # Weighted combination
    raw = (
        WEIGHT_SENTIMENT * sentiment_norm
        + WEIGHT_SPIKE   * spike_score
        + WEIGHT_KEYWORD * keyword_score
    )

    return round(raw * 100, 2)


# ──────────────────────────────────────────────
# SECTION 3 — Spike Detection
# ──────────────────────────────────────────────

def detect_spike(history: list, current: int) -> bool:
    """
    Return True if `current` is a spike relative to `history`.

    Uses a simple rolling average over the last ROLLING_WINDOW points.
    A spike is when current > rolling_avg * SPIKE_THRESHOLD.
    """
    if not history:
        return False

    window = history[-ROLLING_WINDOW:]
    rolling_avg = sum(window) / len(window)

    if rolling_avg == 0:
        return current > 0  # any activity is a spike from zero

    return current > rolling_avg * SPIKE_THRESHOLD


# ──────────────────────────────────────────────
# SECTION 4 — Discord Alert
# ──────────────────────────────────────────────

def _generate_insight(sentiment: float, spike_detected: bool, pump_score: float) -> str:
    """Generate a short AI insight string for the output."""
    parts = []

    if sentiment > 0.3:
        parts.append("Strong bullish sentiment")
    elif sentiment > 0:
        parts.append("Mildly positive sentiment")
    elif sentiment < -0.3:
        parts.append("Bearish sentiment detected")
    else:
        parts.append("Neutral sentiment")

    if spike_detected:
        parts.append("with a major social spike")
    else:
        parts.append("with stable social volume")

    if pump_score >= 85:
        parts.append("— HIGH PUMP ALERT 🚨")
    elif pump_score >= 60:
        parts.append("— momentum building")
    else:
        parts.append("— low activity")

    return " ".join(parts)


def send_discord_alert(coin: str, score: float, sentiment: float, tweets: list, insight: str):
    """
    Send a rich embed to Discord via webhook.
    Wrapped in try/except so it NEVER crashes the pipeline.
    """
    if not DISCORD_WEBHOOK_URL:
        return  # silently skip if no webhook configured

    top_tweets = tweets[:3] if tweets else ["No tweets available"]
    tweet_text = "\n".join(f"• {t[:100]}" for t in top_tweets)

    # Color: green=pump, red=dump
    color = 0x00FF88 if score >= 85 else 0xFF4444

    embed = {
        "embeds": [
            {
                "title": f"🚨 PUMP ALERT — ${coin}",
                "description": f"**Pump Score:** {score}/100\n**Sentiment:** {sentiment}\n**Insight:** {insight}",
                "color": color,
                "fields": [
                    {
                        "name": "📝 Top Tweets",
                        "value": tweet_text,
                        "inline": False,
                    }
                ],
                "footer": {
                    "text": f"CoinRadar | {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
                },
            }
        ]
    }

    try:
        requests.post(DISCORD_WEBHOOK_URL, json=embed, timeout=5)
    except Exception:
        pass  # never block the pipeline


# ──────────────────────────────────────────────
# SECTION 5 — Main Entrypoint (Integration API)
# ──────────────────────────────────────────────

def analyze_coin(payload: dict) -> dict:
    """
    Single entry point for Dev 1 to call.

    INPUT payload:
    {
        "coin": "PEPE",
        "tweets": ["gm pepe is mooning 🚀", ...],
        "mention_count_now": 1200,
        "mention_count_prev": 400,
        "history": [300, 350, 380, 400, 420]
    }

    OUTPUT:
    {
        "coin": "PEPE",
        "pump_score": 87.4,
        "sentiment": 0.62,
        "spike_detected": True,
        "alert_triggered": True,
        "ai_insight": "Strong bullish momentum ...",
        "timestamp": "2026-03-23T15:23:39Z"
    }
    """
    coin               = payload.get("coin", "UNKNOWN")
    tweets             = payload.get("tweets", [])
    mention_count_now  = payload.get("mention_count_now", 0)
    mention_count_prev = payload.get("mention_count_prev", 0)
    history            = payload.get("history", [])

    # 1. Sentiment
    sentiment = analyze_sentiment(tweets)

    # 2. Keyword hits
    keyword_hits = _count_keyword_hits(tweets)

    # 3. Pump score
    pump_score = calculate_pump_score(
        sentiment, mention_count_now, mention_count_prev, keyword_hits
    )

    # 4. Spike detection
    spike_detected = detect_spike(history, mention_count_now)

    # 5. AI insight
    ai_insight = _generate_insight(sentiment, spike_detected, pump_score)

    # 6. Alert
    alert_triggered = pump_score > ALERT_THRESHOLD
    if alert_triggered:
        send_discord_alert(coin, pump_score, sentiment, tweets, ai_insight)

    return {
        "coin": coin,
        "pump_score": pump_score,
        "sentiment": sentiment,
        "spike_detected": spike_detected,
        "alert_triggered": alert_triggered,
        "ai_insight": ai_insight,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
