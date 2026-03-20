"""Fetch live prediction market data from Polymarket and Kalshi.

Writes top markets by volume to data/ticker.json for the frontend ticker.
Runs locally or via GitHub Actions on a schedule.
"""
import json
import urllib.request
from pathlib import Path

POLYMARKET_URL = "https://gamma-api.polymarket.com/markets?limit=20&active=true&closed=false&order=volume24hr&ascending=false"
KALSHI_URL = "https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=30"

OUTPUT = Path(__file__).resolve().parent.parent / "data" / "ticker.json"


def shorten(title, max_len=40):
    if not title:
        return "Unknown"
    return title if len(title) <= max_len else title[:max_len - 3] + "..."


def fetch_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "ImaWhalePM-Ticker/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def fetch_polymarket():
    try:
        raw = fetch_json(POLYMARKET_URL)
        markets = raw if isinstance(raw, list) else []
        out = []
        for m in markets:
            if not m.get("outcomePrices") or not m.get("volume24hr"):
                continue
            vol = float(m["volume24hr"])
            if vol <= 0:
                continue
            try:
                prices = json.loads(m["outcomePrices"])
            except (json.JSONDecodeError, TypeError):
                prices = [0.5, 0.5]
            yes_price = float(prices[0]) if prices else 0.5
            out.append({
                "title": shorten(m.get("question", "Unknown")),
                "price": round(yes_price, 4),
                "volume": round(vol, 2),
                "source": "Polymarket",
            })
        return out
    except Exception as e:
        print(f"Polymarket error: {e}")
        return []


def fetch_kalshi():
    try:
        raw = fetch_json(KALSHI_URL)
        markets = raw.get("markets", [])
        out = []
        for m in markets:
            bid = m.get("yes_bid_dollars") or m.get("yes_bid")
            ask = m.get("yes_ask_dollars") or m.get("yes_ask")
            vol = m.get("volume_24h_fp") or m.get("volume_24h") or 0
            if not bid or not ask or vol <= 0:
                continue
            price = m.get("last_price_dollars") or m.get("last_price") or bid
            out.append({
                "title": shorten(m.get("title") or m.get("ticker", "Unknown")),
                "price": round(float(price), 4),
                "volume": round(float(vol), 2),
                "source": "Kalshi",
            })
        return out
    except Exception as e:
        print(f"Kalshi error: {e}")
        return []


def main():
    poly = fetch_polymarket()
    kalshi = fetch_kalshi()
    all_markets = poly + kalshi
    # Filter out resolved markets (price near 0 or 1) — only show active/interesting ones
    active = [m for m in all_markets if 0.02 <= m["price"] <= 0.98]
    active.sort(key=lambda m: m["volume"], reverse=True)
    top = active[:15]

    print(f"Polymarket: {len(poly)} markets, Kalshi: {len(kalshi)} markets")
    print(f"Top {len(top)} by volume:")
    for m in top[:5]:
        cents = round(m["price"] * 100)
        print(f"  {m['title'][:35]:35s} {cents:3d}¢  vol={m['volume']:>12,.0f}  [{m['source']}]")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump({"markets": top, "sources": {"polymarket": len(poly) > 0, "kalshi": len(kalshi) > 0}}, f, indent=2)
    print(f"\nWrote {len(top)} markets to {OUTPUT}")


if __name__ == "__main__":
    main()
