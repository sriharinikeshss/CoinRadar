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
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

load_dotenv()

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────

SPIKE_THRESHOLD = 1.3          # current must be 1.3x rolling avg to count as spike
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
# SECTION 4 — Discord Alert (Multi-Signal Composite System)
# ──────────────────────────────────────────────

# Per-coin cooldown tracking (prevent alert spam)
_alert_cooldowns: dict[str, float] = {}
ALERT_COOLDOWN = 300  # 5 minutes between alerts for same coin

# Per-cycle alert cap (prevent Discord flooding)
MAX_ALERTS_PER_CYCLE = 5
_alerts_this_cycle: int = 0

import time as _time


def _generate_insight(
    coin: str,
    sentiment: float,
    spike_detected: bool,
    pump_score: float,
    mentions: int,
    momentum: str,
    tweets: list[str] | None = None
) -> str:
    """Generate a signal-aware, coin-specific AI insight string using Groq LLM."""
    tweets = tweets or []
    
    # Fast path: Rule-based string for low-priority coins to save API latency
    if pump_score < 60:
        if momentum == "rising":
            return f"{coin} score is climbing with {mentions} mentions — momentum building, keep on radar"
        if sentiment < -0.1:
            return f"{coin} is seeing negative sentiment — possible sell pressure or risk"
        return f"{coin} activity is stable with moderate sentiment — no strong signal yet"

    # Slow path: Dynamic Groq LLM Generation for high-value breakout targets
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return f"{coin} is gaining traction with a sudden spike in mentions and rising momentum — potential early pump signal"
        
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        context = f"Recent posts: {' | '.join(tweets[:3])}" if tweets else "No recent posts available."
        
        prompt = f"""You are a crypto trading AI. Analyze this meme coin data and provide a SINGLE short, punchy, actionable sentence (max 15 words) explaining the hype.
Coin: {coin}
Score: {pump_score:.1f}/100
Momentum: {momentum}
Spike Detected: {spike_detected}
{context}
Focus on the why. Do not use hashtags or emojis. Start with the coin name."""

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_completion_tokens=30,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"[intelligence] Groq API failed for {coin}: {e}")
        return f"{coin} shows strong bullish sentiment across {mentions} mentions"


def send_discord_dump_alert(
    coin: str,
    score: float,
    sentiment: float,
    tweets: list,
    insight: str,
    signals: list[str],
):
    """
    Send a bearish dump-warning embed to Discord.
    """
    if not DISCORD_WEBHOOK_URL:
        return

    # Per-coin cooldown check (shares cooldown with pump alerts)
    now = _time.time()
    cooldown_key = f"{coin}_dump"
    if cooldown_key in _alert_cooldowns and (now - _alert_cooldowns[cooldown_key]) < ALERT_COOLDOWN:
        print(f"[alert] {coin} dump alert on cooldown, skipping")
        return
    _alert_cooldowns[cooldown_key] = now

    unique_tweets = list(dict.fromkeys(tweets)) if tweets else []
    top_tweets = unique_tweets[:3] if unique_tweets else ["No posts available"]
    tweet_text = "\n".join(f"- {t[:100]}" for t in top_tweets)
    signals_text = " + ".join(signals)

    embed = {
        "embeds": [
            {
                "title": f"DUMP WARNING: ${coin}",
                "description": (
                    f"**Pump Score:** {score:.1f}/100\n"
                    f"**Confidence:** LOW\n"
                    f"**Bearish Signals:** {signals_text}\n"
                    f"**Insight:** {insight}"
                ),
                "color": 0xFF4444,
                "fields": [
                    {
                        "name": "Recent Social Posts",
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
        resp = requests.post(DISCORD_WEBHOOK_URL, json=embed, timeout=5)
        if resp.status_code == 204:
            print(f"[alert] Discord DUMP alert sent for ${coin}: {signals_text}")
            _time.sleep(0.8)
        else:
            print(f"[alert] Discord returned {resp.status_code} for ${coin}")
    except Exception as exc:
        print(f"[alert] Discord dump alert failed for ${coin}: {exc}")


def _classify_signal(pump_score: float, spike_detected: bool) -> str:
    """Classify the signal strength for trader-style insight."""
    if pump_score > 70 and spike_detected:
        return "Strong Signal"
    if pump_score > 60:
        return "Early Signal"
    return "Monitoring"


def _get_confidence(pump_score: float) -> str:
    """Return a confidence tag based on score."""
    if pump_score > 70:
        return "HIGH"
    if pump_score > 50:
        return "MEDIUM"
    return "LOW"


def _check_composite_trigger(
    pump_score: float,
    spike_detected: bool,
    momentum: str,
    sentiment: float = 0.0,
) -> tuple[bool, list[str]]:
    """
    Multi-signal composite trigger.
    Fires when ANY 2 of 4 conditions are met simultaneously.
    Returns (triggered, list_of_reasons).
    """
    signals: list[str] = []
    if pump_score > 50:
        signals.append(f"High Score ({pump_score:.1f})")
    if spike_detected:
        signals.append("Spike Detected")
    if momentum == "rising":
        signals.append("Rising Momentum")
    if sentiment > 0.2:
        signals.append(f"Bullish Sentiment ({sentiment:.2f})")

    triggered = len(signals) >= 2
    print(f"[alert] Composite check: {len(signals)} signals active {signals} -> {'TRIGGERED' if triggered else 'no trigger'}")
    return triggered, signals


def _check_bearish_trigger(
    pump_score: float,
    spike_detected: bool,
    momentum: str,
    sentiment: float = 0.0,
) -> tuple[bool, list[str]]:
    """
    Bearish composite trigger.
    Fires when ANY 2 of 4 bearish conditions are met simultaneously.
    Returns (triggered, list_of_reasons).
    """
    signals: list[str] = []
    if pump_score < 30:
        signals.append(f"Low Score ({pump_score:.1f})")
    if not spike_detected and pump_score < 50:
        signals.append("No Hype Detected")
    if momentum == "falling":
        signals.append("Falling Momentum")
    if sentiment < -0.15:
        signals.append(f"Bearish Sentiment ({sentiment:.2f})")

    triggered = len(signals) >= 2
    print(f"[alert] Bearish check: {len(signals)} signals active {signals} -> {'TRIGGERED' if triggered else 'no trigger'}")
    return triggered, signals


def send_discord_alert(
    coin: str,
    score: float,
    sentiment: float,
    tweets: list,
    insight: str,
    signals: list[str],
    confidence: str,
    signal_type: str,
):
    """
    Send a rich, explainable embed to Discord via webhook.
    Includes which signals triggered and confidence level.
    """
    if not DISCORD_WEBHOOK_URL:
        return

    # Per-coin cooldown check
    now = _time.time()
    if coin in _alert_cooldowns and (now - _alert_cooldowns[coin]) < ALERT_COOLDOWN:
        print(f"[alert] [WAIT] {coin} on cooldown, skipping Discord alert")
        return
    _alert_cooldowns[coin] = now

    # Deduplicate titles before display
    unique_tweets = list(dict.fromkeys(tweets)) if tweets else []
    top_tweets = unique_tweets[:3] if unique_tweets else ["No posts available"]
    tweet_text = "\n".join(f"• {t[:100]}" for t in top_tweets)
    signals_text = " + ".join(signals)

    # Color based on confidence
    color = 0x00FF88 if confidence == "HIGH" else 0xFFCC00 if confidence == "MEDIUM" else 0xFF4444

    embed = {
        "embeds": [
            {
                "title": f"🚨 {signal_type}: ${coin}",
                "description": (
                    f"**Pump Score:** {score}/100\n"
                    f"**Confidence:** {confidence}\n"
                    f"**Signals:** {signals_text}\n"
                    f"**Insight:** {insight}"
                ),
                "color": color,
                "fields": [
                    {
                        "name": "📝 Top Social Posts",
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
        resp = requests.post(DISCORD_WEBHOOK_URL, json=embed, timeout=5)
        if resp.status_code == 204:
            print(f"[alert] [OK] Discord alert sent for ${coin}: {signals_text}")
            _time.sleep(0.8)  # Respect Discord rate limits
        else:
            print(f"[alert] [FAIL] Discord webhook failed HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[alert] [FAIL] Discord webhook exception: {e}")


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
        "history": [300, 350, 380, 400, 420],
        "momentum": "rising"  // NEW — from scraper's persistent tracking
    }

    OUTPUT:
    {
        "coin": "PEPE",
        "pump_score": 67.4,
        "sentiment": 0.62,
        "sentiment_label": "Bullish",
        "spike_detected": True,
        "alert_triggered": True,
        "ai_insight": "PEPE is gaining traction...",
        "confidence": "HIGH",
        "signal_type": "Strong Signal",
        "trigger_reasons": ["High Score (67.4)", "Spike Detected"],
        "timestamp": "2026-03-23T15:23:39Z"
    }
    """
    coin               = payload.get("coin", "UNKNOWN")
    tweets             = payload.get("tweets", [])
    mention_count_now  = payload.get("mention_count_now", 0)
    mention_count_prev = payload.get("mention_count_prev", 0)
    history            = payload.get("history", [])
    momentum           = payload.get("momentum", "stable")

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

    # 5. Sentiment label
    if sentiment > 0.15:
        sentiment_label = "Bullish"
    elif sentiment < -0.15:
        sentiment_label = "Bearish"
    else:
        sentiment_label = "Neutral"

    # 6. AI insight (signal-aware & dynamic via Groq)
    ai_insight = _generate_insight(
        coin, sentiment, spike_detected, pump_score, mention_count_now, momentum, tweets
    )

    # 7. Confidence + Signal type
    confidence = _get_confidence(pump_score)
    signal_type = _classify_signal(pump_score, spike_detected)

    # 8. Composite alert trigger (2-of-4 signals)
    #    Skip on first run (no baseline yet) to prevent false spikes
    global _alerts_this_cycle
    if len(history) <= 1:
        alert_triggered = False
        trigger_reasons = []
    else:
        alert_triggered, trigger_reasons = _check_composite_trigger(
            pump_score, spike_detected, momentum, sentiment
        )

    if alert_triggered and _alerts_this_cycle < MAX_ALERTS_PER_CYCLE:
        send_discord_alert(
            coin, pump_score, sentiment, tweets, ai_insight,
            trigger_reasons, confidence, signal_type,
        )
        _alerts_this_cycle += 1
    elif alert_triggered:
        print(f"[alert] Alert cap reached ({MAX_ALERTS_PER_CYCLE}/cycle), skipping ${coin}")

    # 9. Bearish dump alert (separate from bullish alerts)
    dump_triggered = False
    dump_reasons: list[str] = []
    if len(history) > 1:
        dump_triggered, dump_reasons = _check_bearish_trigger(
            pump_score, spike_detected, momentum, sentiment
        )
    if dump_triggered and _alerts_this_cycle < MAX_ALERTS_PER_CYCLE:
        send_discord_dump_alert(
            coin, pump_score, sentiment, tweets, ai_insight, dump_reasons
        )
        _alerts_this_cycle += 1

    return {
        "coin": coin,
        "pump_score": pump_score,
        "sentiment": sentiment,
        "sentiment_label": sentiment_label,
        "spike_detected": spike_detected,
        "alert_triggered": alert_triggered,
        "dump_triggered": dump_triggered,
        "ai_insight": ai_insight,
        "confidence": confidence,
        "signal_type": signal_type,
        "trigger_reasons": trigger_reasons + dump_reasons,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
