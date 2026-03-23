"""
CoinRadar — Unit Tests for intelligence.py
===========================================
Run:  python test_intelligence.py
"""

from intelligence import (
    analyze_sentiment,
    calculate_pump_score,
    detect_spike,
    _count_keyword_hits,
    _generate_insight,
    analyze_coin,
)


def test_analyze_sentiment():
    # Strongly positive crypto tweets
    pos = analyze_sentiment(["mooning to the moon wagmi 100x 🚀"])
    assert pos > 0.3, f"Expected positive sentiment, got {pos}"

    # Strongly negative
    neg = analyze_sentiment(["total rug scam dump rekt"])
    assert neg < -0.3, f"Expected negative sentiment, got {neg}"

    # Empty list → 0
    assert analyze_sentiment([]) == 0.0

    print("  ✅ analyze_sentiment passed")


def test_calculate_pump_score():
    # High everything → high score
    high = calculate_pump_score(sentiment=0.8, mention_count_now=1200, mention_count_prev=400, keyword_hits=12)
    assert high > 70, f"Expected high pump score, got {high}"

    # All zeros → low score (sentiment=0 maps to 0.5 norm, rest 0)
    low = calculate_pump_score(sentiment=-1.0, mention_count_now=0, mention_count_prev=100, keyword_hits=0)
    assert low < 10, f"Expected low pump score, got {low}"

    # Score is always 0–100
    extreme = calculate_pump_score(sentiment=1.0, mention_count_now=99999, mention_count_prev=1, keyword_hits=100)
    assert 0 <= extreme <= 100, f"Score out of range: {extreme}"

    # Safe division: mention_count_prev = 0 should NOT crash
    safe = calculate_pump_score(sentiment=0.5, mention_count_now=100, mention_count_prev=0, keyword_hits=5)
    assert 0 <= safe <= 100, f"Safe division failed: {safe}"

    print("  ✅ calculate_pump_score passed")


def test_detect_spike():
    # Flat history, current matches → no spike
    assert detect_spike([100, 100, 100, 100, 100], 100) is False

    # Sudden 3x jump → spike
    assert detect_spike([100, 100, 100, 100, 100], 300) is True

    # Empty history → no spike
    assert detect_spike([], 500) is False

    # Zero history, any current → spike
    assert detect_spike([0, 0, 0], 10) is True

    print("  ✅ detect_spike passed")


def test_count_keyword_hits():
    tweets = ["mooning to the moon wagmi", "rug scam dump"]
    hits = _count_keyword_hits(tweets)
    assert hits >= 5, f"Expected ≥5 keyword hits, got {hits}"

    # No keywords
    assert _count_keyword_hits(["hello world nothing here"]) == 0

    print("  ✅ _count_keyword_hits passed")


def test_generate_insight():
    insight = _generate_insight(sentiment=0.5, spike_detected=True, pump_score=90)
    assert "bullish" in insight.lower() or "spike" in insight.lower(), f"Unexpected insight: {insight}"

    print("  ✅ _generate_insight passed")


def test_analyze_coin_full_pipeline():
    payload = {
        "coin": "PEPE",
        "tweets": [
            "gm pepe is mooning to the moon 🚀 wagmi",
            "ape in now this is a gem bullish 100x",
            "pepe flying lambo hodl banger based",
        ],
        "mention_count_now": 1200,
        "mention_count_prev": 400,
        "history": [300, 350, 380, 400, 420],
    }

    result = analyze_coin(payload)

    # Check all expected keys exist
    for key in ["coin", "pump_score", "sentiment", "spike_detected", "alert_triggered", "ai_insight", "timestamp"]:
        assert key in result, f"Missing key: {key}"

    assert result["coin"] == "PEPE"
    assert 0 <= result["pump_score"] <= 100
    assert -1 <= result["sentiment"] <= 1
    assert isinstance(result["spike_detected"], bool)
    assert isinstance(result["alert_triggered"], bool)
    assert isinstance(result["ai_insight"], str)
    assert len(result["timestamp"]) > 0

    print("  ✅ analyze_coin full pipeline passed")
    print(f"     Result: {result}")


if __name__ == "__main__":
    print("\n🧪 Running CoinRadar Intelligence Tests...\n")
    test_analyze_sentiment()
    test_calculate_pump_score()
    test_detect_spike()
    test_count_keyword_hits()
    test_generate_insight()
    test_analyze_coin_full_pipeline()
    print("\n✅ All tests passed!\n")
