/**
 * Cloudflare Worker — IMAWHALEPM Live Ticker Proxy
 *
 * Fetches top markets from Kalshi and Polymarket, normalizes them,
 * and returns a single JSON endpoint with CORS headers.
 *
 * Deploy: cd worker && npx wrangler deploy
 */

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';
const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const CACHE_TTL_SECONDS = 60;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // Check in-memory cache via Cache API
      const cacheKey = new Request('https://ticker-cache.imawhalepm.com/v1');
      const cache = caches.default;
      let cached = await cache.match(cacheKey);
      if (cached) {
        return addCors(cached);
      }

      // Fetch from both APIs in parallel
      const [kalshiData, polyData] = await Promise.allSettled([
        fetchKalshi(),
        fetchPolymarket(),
      ]);

      const markets = [];

      if (kalshiData.status === 'fulfilled') {
        markets.push(...kalshiData.value);
      }
      if (polyData.status === 'fulfilled') {
        markets.push(...polyData.value);
      }

      // Sort by 24h volume descending, take top 15
      markets.sort((a, b) => b.volume24h - a.volume24h);
      const top = markets.slice(0, 15);

      const body = JSON.stringify({
        markets: top,
        updated: new Date().toISOString(),
        sources: {
          kalshi: kalshiData.status === 'fulfilled',
          polymarket: polyData.status === 'fulfilled',
        },
      });

      const response = new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
          ...corsHeaders(),
        },
      });

      // Store in Cache API
      const cachedResponse = response.clone();
      await cache.put(cacheKey, cachedResponse);

      return response;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Internal error', detail: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }
  },
};

async function fetchKalshi() {
  const url = `${KALSHI_API}/markets?status=open&limit=50`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Kalshi ${res.status}`);

  const data = await res.json();
  const markets = data.markets || [];

  return markets
    .filter(m => m.yes_bid && m.yes_ask && m.volume_24h > 0)
    .map(m => ({
      ticker: m.ticker,
      title: shortenTitle(m.title || m.ticker),
      price: m.last_price || m.yes_bid,
      bid: m.yes_bid,
      ask: m.yes_ask,
      volume24h: m.volume_24h || 0,
      source: 'Kalshi',
    }));
}

async function fetchPolymarket() {
  const url = `${POLYMARKET_API}/markets?limit=30&active=true&closed=false&order=volume24hr&ascending=false`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Polymarket ${res.status}`);

  const markets = await res.json();

  return (Array.isArray(markets) ? markets : [])
    .filter(m => m.outcomePrices && m.volume24hr > 0)
    .map(m => {
      let prices;
      try {
        prices = JSON.parse(m.outcomePrices);
      } catch {
        prices = [0.5, 0.5];
      }
      const yesPrice = parseFloat(prices[0]) || 0.5;

      return {
        ticker: m.conditionId ? m.conditionId.slice(0, 12).toUpperCase() : 'POLY',
        title: shortenTitle(m.question || 'Unknown'),
        price: yesPrice,
        bid: Math.max(0.01, yesPrice - 0.01),
        ask: Math.min(0.99, yesPrice + 0.01),
        volume24h: parseFloat(m.volume24hr) || 0,
        source: 'Polymarket',
      };
    });
}

function shortenTitle(title) {
  if (title.length <= 40) return title;
  return title.slice(0, 37) + '...';
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function addCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
