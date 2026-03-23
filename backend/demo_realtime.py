"""
CoinRadar — Real-Time Demo Script
==================================
Simulates a live social feed streaming posts one by one,
running sentiment analysis in real-time, and triggering
a Discord alert when pump_score crosses 85.

Run:  py demo_realtime.py
"""

import time
import random
from dotenv import load_dotenv

load_dotenv()

from intelligence import analyze_coin, ALERT_THRESHOLD

# ── Simulated live posts (released one at a time) ──

DEMO_STREAM = [
    {"coin": "PEPE", "text": "Just saw a whale buy 200B $PEPE, something big is coming"},
    {"coin": "PEPE", "text": "$PEPE breaking out on the 1h chart, bullish 📈"},
    {"coin": "BONK", "text": "BONK looking kinda flat today, nothing exciting"},
    {"coin": "PEPE", "text": "PEPE is the ultimate gem 💎 mooning to 100x easily"},
    {"coin": "WIF", "text": "$WIF pump is real, ape in right now wagmi 🚀"},
    {"coin": "PEPE", "text": "Everyone talking about $PEPE, massive hype building"},
    {"coin": "SHIB", "text": "$SHIB looks like a rug pull, devs are dumping"},
    {"coin": "PEPE", "text": "$PEPE lambo incoming, this is a banger, hodl tight 💎🙌"},
    {"coin": "PEPE", "text": "PEPE flying past all resistance, wagmi fam 🚀🚀🚀"},
    {"coin": "WIF", "text": "WIF is mooning, bullish breakout confirmed"},
    {"coin": "PEPE", "text": "$PEPE pump is insane, 100x from here easy, moon bound"},
    {"coin": "PEPE", "text": "Accumulating more PEPE before the next leg up 🐸"},
    {"coin": "SHIB", "text": "Got rekt on SHIB, total scam coin avoid"},
    {"coin": "PEPE", "text": "PEPE is the king of meme coins, bullish forever 🚀💎"},
]

def run_demo():
    print("\n" + "=" * 60)
    print("🔴 COINRADAR REAL-TIME DEMO")
    print("=" * 60)
    print(f"   Alert threshold: pump_score > {ALERT_THRESHOLD}")
    print(f"   Posts to stream: {len(DEMO_STREAM)}")
    print("=" * 60 + "\n")

    # Accumulate posts per coin as they arrive
    coin_posts: dict[str, list[str]] = {}
    coin_mention_history: dict[str, list[int]] = {}

    for i, post in enumerate(DEMO_STREAM, 1):
        coin = post["coin"]
        text = post["text"]

        # Accumulate
        coin_posts.setdefault(coin, []).append(text)
        coin_mention_history.setdefault(coin, [0, 0, 0, 0, 0])

        # Simulate mention count growing (each post = ~50 mentions)
        current_mentions = len(coin_posts[coin]) * random.randint(40, 60)
        prev_mentions = 50  # low baseline so spike ratio builds as posts accumulate

        # Print the incoming post
        print(f"  📨 [{i}/{len(DEMO_STREAM)}] ${coin}: \"{text[:60]}...\"")

        # Run ML pipeline
        payload = {
            "coin": coin,
            "tweets": coin_posts[coin],
            "mention_count_now": current_mentions,
            "mention_count_prev": prev_mentions,
            "history": coin_mention_history[coin][-5:],
        }

        result = analyze_coin(payload)

        # Update history
        coin_mention_history[coin].append(current_mentions)

        # Display result
        score = result["pump_score"]
        sentiment = result["sentiment"]
        spike = "🔺 SPIKE" if result["spike_detected"] else ""
        alert = "🚨 ALERT SENT!" if result["alert_triggered"] else ""

        bar = "█" * int(score / 2) + "░" * (50 - int(score / 2))
        print(f"     Score: [{bar}] {score:.1f}/100  |  Sentiment: {sentiment:+.2f}  {spike}  {alert}")

        if result["alert_triggered"]:
            print(f"\n  🚨🚨🚨 DISCORD ALERT FIRED for ${coin}! Check your #alerts channel! 🚨🚨🚨\n")

        print()
        time.sleep(1.5)  # Pause between posts to simulate real-time

    # Final summary
    print("=" * 60)
    print("📊 FINAL COIN SUMMARY")
    print("=" * 60)

    for coin, posts in coin_posts.items():
        result = analyze_coin({
            "coin": coin,
            "tweets": posts,
            "mention_count_now": len(posts) * 50,
            "mention_count_prev": max(1, len(posts) * 10),
            "history": coin_mention_history.get(coin, [50] * 5)[-5:],
        })
        status = "🟢" if result["sentiment"] > 0.3 else "🔴" if result["sentiment"] < -0.3 else "🟡"
        print(f"  {status} ${coin:6s}  →  Score: {result['pump_score']:5.1f}  |  Sentiment: {result['sentiment']:+.3f}  |  {result['ai_insight']}")

    print("\n" + "=" * 60)
    print("✅ Demo complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_demo()
