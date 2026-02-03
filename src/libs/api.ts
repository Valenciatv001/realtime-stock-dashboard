// import axios from 'axios';
// import { ChartTimeframe, OHLCCandle, SearchResult, Stock } from '../types';

// // ── Config ────────────────────────────────
// const API_KEY = "d60kc9hr01qto1rdfg6gd60kc9hr01qto1rdfg70"; 
// const BASE_URL = 'https://api.finnhub.io/api/v1';
// const USE_MOCK = API_KEY === 'd60kc9hr01qto1rdfg6gd60kc9hr01qto1rdfg70'; // auto-switch when no key

// const client = axios.create({
//   baseURL: BASE_URL,
//   params: { token: API_KEY },
//   timeout: 10_000,
// }); 

// // ── Mock Data (deterministic, no network needed) ─
// const MOCK_STOCKS: Stock[] = [
//   { symbol: 'AAPL', name: 'Apple Inc.', price: 227.55, previousClose: 225.91, change: 1.64, changePercent: 0.73, volume: 52_300_000, marketCap: 3_440_000_000_000, high: 228.10, low: 225.50, open: 226.00, timestamp: Date.now() },
//   { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 191.85, previousClose: 189.42, change: 2.43, changePercent: 1.28, volume: 24_100_000, marketCap: 2_350_000_000_000, high: 192.30, low: 189.00, open: 190.00, timestamp: Date.now() },
//   { symbol: 'MSFT', name: 'Microsoft Corp.', price: 448.20, previousClose: 445.67, change: 2.53, changePercent: 0.57, volume: 18_900_000, marketCap: 3_330_000_000_000, high: 449.50, low: 444.20, open: 446.00, timestamp: Date.now() },
//   { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 233.10, previousClose: 230.85, change: 2.25, changePercent: 0.97, volume: 38_700_000, marketCap: 2_480_000_000_000, high: 234.00, low: 230.10, open: 231.50, timestamp: Date.now() },
//   { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 142.65, previousClose: 138.92, change: 3.73, changePercent: 2.68, volume: 42_500_000, marketCap: 3_480_000_000_000, high: 143.80, low: 138.50, open: 139.20, timestamp: Date.now() },
//   { symbol: 'META', name: 'Meta Platforms', price: 611.80, previousClose: 605.30, change: 6.50, changePercent: 1.07, volume: 15_200_000, marketCap: 1_550_000_000_000, high: 613.20, low: 604.00, open: 606.00, timestamp: Date.now() },
//   { symbol: 'TSLA', name: 'Tesla Inc.', price: 368.45, previousClose: 361.20, change: 7.25, changePercent: 2.01, volume: 78_400_000, marketCap: 1_180_000_000_000, high: 370.00, low: 360.50, open: 362.00, timestamp: Date.now() },
//   { symbol: 'JPM', name: 'JPMorgan Chase', price: 284.30, previousClose: 282.15, change: 2.15, changePercent: 0.76, volume: 9_800_000, marketCap: 770_000_000_000, high: 285.00, low: 281.50, open: 282.50, timestamp: Date.now() },
//   { symbol: 'V', name: 'Visa Inc.', price: 318.60, previousClose: 316.45, change: 2.15, changePercent: 0.68, volume: 7_200_000, marketCap: 638_000_000_000, high: 319.50, low: 315.80, open: 317.00, timestamp: Date.now() },
//   { symbol: 'WMT', name: 'Walmart Inc.', price: 172.40, previousClose: 170.85, change: 1.55, changePercent: 0.91, volume: 11_500_000, marketCap: 467_000_000_000, high: 173.20, low: 170.00, open: 171.20, timestamp: Date.now() },
//   { symbol: 'HD', name: 'Home Depot Inc.', price: 398.75, previousClose: 395.30, change: 3.45, changePercent: 0.87, volume: 6_400_000, marketCap: 428_000_000_000, high: 399.80, low: 394.50, open: 396.00, timestamp: Date.now() },
//   { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 502.30, previousClose: 499.10, change: 3.20, changePercent: 0.64, volume: 3_100_000, marketCap: 1_080_000_000_000, high: 503.50, low: 498.20, open: 500.00, timestamp: Date.now() },
//   { symbol: 'AVGO', name: 'Broadcom Inc.', price: 225.80, previousClose: 222.45, change: 3.35, changePercent: 1.51, volume: 8_900_000, marketCap: 1_080_000_000_000, high: 226.50, low: 222.00, open: 223.00, timestamp: Date.now() },
//   { symbol: 'COST', name: 'Costco Wholesale', price: 1_082.50, previousClose: 1_075.30, change: 7.20, changePercent: 0.67, volume: 2_800_000, marketCap: 487_000_000_000, high: 1_084.00, low: 1_074.00, open: 1_076.00, timestamp: Date.now() },
//   { symbol: 'SPCE', name: 'Virgin Galactic', price: 1.85, previousClose: 1.92, change: -0.07, changePercent: -3.65, volume: 12_100_000, marketCap: 490_000_000, high: 1.94, low: 1.82, open: 1.90, timestamp: Date.now() },
// ];

// // Generate deterministic OHLC candles for mock
// function generateMockCandles(basePrice: number, count: number): OHLCCandle[] {
//   const candles: OHLCCandle[] = [];
//   let price = basePrice * 0.85; // start 15% below current

//   for (let i = 0; i < count; i++) {
//     const trend = (basePrice - price) / count; // gradual move toward basePrice
//     const volatility = basePrice * 0.015;      // 1.5% daily range

//     const open = price + trend * 0.3;
//     const close = price + trend + (Math.random() - 0.45) * volatility;
//     const high = Math.max(open, close) + Math.random() * volatility * 0.5;
//     const low = Math.min(open, close) - Math.random() * volatility * 0.5;

//     candles.push({
//       timestamp: Date.now() - (count - i) * 86_400_000, // 1 day apart
//       open: +open.toFixed(2),
//       high: +high.toFixed(2),
//       low: +low.toFixed(2),
//       close: +close.toFixed(2),
//       volume: Math.floor(Math.random() * 50_000_000) + 5_000_000,
//     });

//     price = close;
//   }

//   return candles;
// }

// // ── API Functions ─────────────────────────
// // Each returns a Promise — plug directly into React Query's queryFn

// export async function fetchStockList(): Promise<Stock[]> {
//   if (USE_MOCK) return MOCK_STOCKS;

//   try {
//     const { data } = await client.get('/quote', { params: { symbol: 'AAPL' } });

//     console.log("data", data);
      

    
//     // Finnhub quote endpoint returns single stock —
//     // in production you'd batch or use market-news endpoint.
//     // For now, mock handles the list; real API supplements individual lookups.
//     return MOCK_STOCKS; // hybrid: list from mock, detail from API
//   } catch {
//     return MOCK_STOCKS;
//   }
// }

// export async function fetchStockDetail(symbol: string): Promise<Stock | null> {
//   if (USE_MOCK) {
//     return MOCK_STOCKS.find((s) => s.symbol === symbol) ?? null;
//   }

//   try {
//     const { data } = await client.get('/quote', { params: { symbol } });
//     return {
//       symbol,
//       name: data.displaySymbol || symbol,
//       price: data.c,
//       previousClose: data.pc,
//       change: data.d,
//       changePercent: data.dp,
//       volume: data.v,
//       marketCap: 0, // not in Finnhub free tier
//       high: data.h,
//       low: data.l,
//       open: data.o,
//       timestamp: Date.now(),
//     };
//   } catch {
//     return MOCK_STOCKS.find((s) => s.symbol === symbol) ?? null;
//   }
// }

// export async function fetchOHLCData(
//   symbol: string,
//   timeframe: ChartTimeframe
// ): Promise<OHLCCandle[]> {
//   const stock = MOCK_STOCKS.find((s) => s.symbol === symbol);
//   const basePrice = stock?.price ?? 100;

//   const candleCounts: Record<ChartTimeframe, number> = {
//     '1D': 78,   // 5-min candles
//     '1W': 35,   // 1-hour candles
//     '1M': 30,   // daily
//     '3M': 90,   // daily
//     '1Y': 365,  // daily
//   };

//   if (USE_MOCK) {
//     return generateMockCandles(basePrice, candleCounts[timeframe]);
//   }

//   // Finnhub candles endpoint (paid tier only for most symbols)
//   // Fallback to mock for free tier
//   try {
//     const now = Math.floor(Date.now() / 1000);
//     const from = now - getDurationSeconds(timeframe);

//     const { data } = await client.get('/candles', {
//       params: { symbol, resolution: getResolution(timeframe), from, to: now },
//     });

//     if (data.s !== 'ok') return generateMockCandles(basePrice, candleCounts[timeframe]);

//     return data.t.map((t: number, i: number) => ({
//       timestamp: t * 1000,
//       open: data.o[i],
//       high: data.h[i],
//       low: data.l[i],
//       close: data.c[i],
//       volume: data.v[i],
//     }));
//   } catch {
//     return generateMockCandles(basePrice, candleCounts[timeframe]);
//   }
// }

// export async function searchStocks(query: string): Promise<SearchResult[]> {
//   if (!query.trim()) return [];

//   if (USE_MOCK) {
//     return MOCK_STOCKS.filter(
//       (s) =>
//         s.symbol.toLowerCase().includes(query.toLowerCase()) ||
//         s.name.toLowerCase().includes(query.toLowerCase())
//     ).map((s) => ({ symbol: s.symbol, name: s.name, type: 'EQUITY' }));
//   }

//   try {
//     const { data } = await client.get('/search', { params: { q: query } });
//     return (data.result || []).slice(0, 8).map((r: Record<string, string>) => ({
//       symbol: r.symbol,
//       name: r.displaySymbol,
//       type: r.type,
//     }));
//   } catch {
//     return [];
//   }
// }

// // ── Helpers ───────────────────────────────
// function getDurationSeconds(timeframe: ChartTimeframe): number {
//   const map: Record<ChartTimeframe, number> = {
//     '1D': 86_400,
//     '1W': 604_800,
//     '1M': 2_592_000,
//     '3M': 7_776_000,
//     '1Y': 31_536_000,
//   };
//   return map[timeframe];
// }

// function getResolution(timeframe: ChartTimeframe): string {
//   const map: Record<ChartTimeframe, string> = {
//     '1D': '5',    // 5 min
//     '1W': '60',   // 1 hour
//     '1M': 'D',
//     '3M': 'D',
//     '1Y': 'D',
//   };
//   return map[timeframe];
// }

import axios from 'axios';
import { ChartTimeframe, OHLCCandle, SearchResult, Stock } from '../types';

// ── Config ────────────────────────────────
const API_KEY = 'd60kc9hr01qto1rdfg6gd60kc9hr01qto1rdfg70';
const BASE_URL = 'https://api.finnhub.io/api/v1';
const USE_MOCK = !API_KEY || API_KEY === 'd60kc9hr01qto1rdfg6gd60kc9hr01qto1rdfg70'; // only mock when key is missing

const client = axios.create({
  baseURL: BASE_URL,
  params: { token: API_KEY },
  timeout: 10_000,
});

// ── Symbols to batch-fetch on list screen ──
const TRACKED_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA',
  'META', 'TSLA', 'JPM', 'V', 'WMT',
  'HD', 'BRK.B', 'AVGO', 'COST', 'SPCE',
];

// ── Company name cache (avoid hitting /company repeatedly) ─
const companyNameCache = new Map<string, string>();

// ── Mock Data ─────────────────────────────
const MOCK_STOCKS: Stock[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.',         price: 227.55, previousClose: 225.91, change: 1.64,  changePercent: 0.73,  volume: 52_300_000, marketCap: 3_440_000_000_000, high: 228.10, low: 225.50, open: 226.00, timestamp: Date.now() },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',      price: 191.85, previousClose: 189.42, change: 2.43,  changePercent: 1.28,  volume: 24_100_000, marketCap: 2_350_000_000_000, high: 192.30, low: 189.00, open: 190.00, timestamp: Date.now() },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',    price: 448.20, previousClose: 445.67, change: 2.53,  changePercent: 0.57,  volume: 18_900_000, marketCap: 3_330_000_000_000, high: 449.50, low: 444.20, open: 446.00, timestamp: Date.now() },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',    price: 233.10, previousClose: 230.85, change: 2.25,  changePercent: 0.97,  volume: 38_700_000, marketCap: 2_480_000_000_000, high: 234.00, low: 230.10, open: 231.50, timestamp: Date.now() },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',       price: 142.65, previousClose: 138.92, change: 3.73,  changePercent: 2.68,  volume: 42_500_000, marketCap: 3_480_000_000_000, high: 143.80, low: 138.50, open: 139.20, timestamp: Date.now() },
  { symbol: 'META',  name: 'Meta Platforms',     price: 611.80, previousClose: 605.30, change: 6.50,  changePercent: 1.07,  volume: 15_200_000, marketCap: 1_550_000_000_000, high: 613.20, low: 604.00, open: 606.00, timestamp: Date.now() },
  { symbol: 'TSLA',  name: 'Tesla Inc.',         price: 368.45, previousClose: 361.20, change: 7.25,  changePercent: 2.01,  volume: 78_400_000, marketCap: 1_180_000_000_000, high: 370.00, low: 360.50, open: 362.00, timestamp: Date.now() },
  { symbol: 'JPM',   name: 'JPMorgan Chase',     price: 284.30, previousClose: 282.15, change: 2.15,  changePercent: 0.76,  volume: 9_800_000,  marketCap: 770_000_000_000,   high: 285.00, low: 281.50, open: 282.50, timestamp: Date.now() },
  { symbol: 'V',     name: 'Visa Inc.',          price: 318.60, previousClose: 316.45, change: 2.15,  changePercent: 0.68,  volume: 7_200_000,  marketCap: 638_000_000_000,   high: 319.50, low: 315.80, open: 317.00, timestamp: Date.now() },
  { symbol: 'WMT',   name: 'Walmart Inc.',       price: 172.40, previousClose: 170.85, change: 1.55,  changePercent: 0.91,  volume: 11_500_000, marketCap: 467_000_000_000,   high: 173.20, low: 170.00, open: 171.20, timestamp: Date.now() },
  { symbol: 'HD',    name: 'Home Depot Inc.',    price: 398.75, previousClose: 395.30, change: 3.45,  changePercent: 0.87,  volume: 6_400_000,  marketCap: 428_000_000_000,   high: 399.80, low: 394.50, open: 396.00, timestamp: Date.now() },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 502.30, previousClose: 499.10, change: 3.20, changePercent: 0.64,  volume: 3_100_000,  marketCap: 1_080_000_000_000, high: 503.50, low: 498.20, open: 500.00, timestamp: Date.now() },
  { symbol: 'AVGO',  name: 'Broadcom Inc.',      price: 225.80, previousClose: 222.45, change: 3.35,  changePercent: 1.51,  volume: 8_900_000,  marketCap: 1_080_000_000_000, high: 226.50, low: 222.00, open: 223.00, timestamp: Date.now() },
  { symbol: 'COST',  name: 'Costco Wholesale',   price: 1_082.50, previousClose: 1_075.30, change: 7.20, changePercent: 0.67, volume: 2_800_000, marketCap: 487_000_000_000, high: 1_084.00, low: 1_074.00, open: 1_076.00, timestamp: Date.now() },
  { symbol: 'SPCE',  name: 'Virgin Galactic',    price: 1.85,  previousClose: 1.92,   change: -0.07, changePercent: -3.65, volume: 12_100_000, marketCap: 490_000_000,       high: 1.94,   low: 1.82,  open: 1.90,  timestamp: Date.now() },
];

// ── Mock candle generator ─────────────────
function generateMockCandles(basePrice: number, count: number): OHLCCandle[] {
  const candles: OHLCCandle[] = [];
  let price = basePrice * 0.85;

  for (let i = 0; i < count; i++) {
    const trend = (basePrice - price) / count;
    const volatility = basePrice * 0.015;

    const open  = price + trend * 0.3;
    const close = price + trend + (Math.random() - 0.45) * volatility;
    const high  = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low   = Math.min(open, close) - Math.random() * volatility * 0.5;

    candles.push({
      timestamp: Date.now() - (count - i) * 86_400_000,
      open:  +open.toFixed(2),
      high:  +high.toFixed(2),
      low:   +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 50_000_000) + 5_000_000,
    });

    price = close;
  }

  return candles;
}

// ── Internal: fetch company name (cached) ─
async function getCompanyName(symbol: string): Promise<string> {
  if (companyNameCache.has(symbol)) return companyNameCache.get(symbol)!;

  try {
    const { data } = await client.get('/profile', { params: { symbol } });
    const name = data.companyName || symbol;
    companyNameCache.set(symbol, name);
    return name;
  } catch {
    companyNameCache.set(symbol, symbol); // cache the fallback too — don't retry on failure
    return symbol;
  }
}

// ── Internal: fetch a single quote + name ─
async function fetchSingleStock(symbol: string): Promise<Stock | null> {
  try {
    const [{ data: quote }, name] = await Promise.all([
      client.get('/quote', { params: { symbol } }),
      getCompanyName(symbol),
    ]);

    // Finnhub returns 0 for all fields when market is closed / symbol invalid
    if (quote.c === 0 && quote.h === 0 && quote.l === 0) return null;

    return {
      symbol,
      name,
      price:         quote.c,
      previousClose: quote.pc,
      change:        quote.d  ?? 0,
      changePercent: quote.dp ?? 0,
      volume:        quote.v  ?? 0,
      marketCap:     0, // not available on free tier
      high:          quote.h,
      low:           quote.l,
      open:          quote.o,
      timestamp:     Date.now(),
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────

/**
 * Fetches live quotes for all tracked symbols in parallel.
 * Falls back to MOCK_STOCKS for any symbol that fails or returns empty.
 */
export async function fetchStockList(): Promise<Stock[]> {
  if (USE_MOCK) return MOCK_STOCKS;

  // Fire all quotes concurrently — Finnhub free tier allows ~30 req/min
  const results = await Promise.all(
    TRACKED_SYMBOLS.map((symbol) => fetchSingleStock(symbol))
  );

  // Merge: use live data where available, fall back to mock per-symbol
  return TRACKED_SYMBOLS.map((symbol, i) => {
    const live = results[i];
    if (live) return live;
    // Partial fallback — keeps the list complete even if one symbol fails
    return MOCK_STOCKS.find((s) => s.symbol === symbol) ?? {
      symbol,
      name: symbol,
      price: 0, previousClose: 0, change: 0, changePercent: 0,
      volume: 0, marketCap: 0, high: 0, low: 0, open: 0,
      timestamp: Date.now(),
    };
  });
}

/**
 * Single stock detail — used on the [symbol] detail screen.
 */
export async function fetchStockDetail(symbol: string): Promise<Stock | null> {
  if (USE_MOCK) return MOCK_STOCKS.find((s) => s.symbol === symbol) ?? null;

  const stock = await fetchSingleStock(symbol);
  return stock ?? MOCK_STOCKS.find((s) => s.symbol === symbol) ?? null;
}

/**
 * OHLC candle data for charts.
 * Finnhub /candles is free-tier limited — falls back to mock on failure.
 */
export async function fetchOHLCData(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<OHLCCandle[]> {
  const candleCounts: Record<ChartTimeframe, number> = {
    '1D': 78,
    '1W': 35,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
  };

  // Resolve base price for mock fallback
  const mockStock = MOCK_STOCKS.find((s) => s.symbol === symbol);
  const basePrice = mockStock?.price ?? 100;

  if (USE_MOCK) return generateMockCandles(basePrice, candleCounts[timeframe]);

  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - getDurationSeconds(timeframe);

    const { data } = await client.get('/candles', {
      params: { symbol, resolution: getResolution(timeframe), from, to: now },
    });

    console.log("data", data);

    // Finnhub returns { s: 'no_data' } when no candles available
    if (data.s !== 'ok' || !data.t) {
      return generateMockCandles(basePrice, candleCounts[timeframe]);
    }

    return data.t.map((t: number, i: number) => ({
      timestamp: t * 1000,
      open:   data.o[i],
      high:   data.h[i],
      low:    data.l[i],
      close:  data.c[i],
      volume: data.v[i],
    }));
  } catch {
    return generateMockCandles(basePrice, candleCounts[timeframe]);
  }
}

/**
 * Symbol search — uses Finnhub /search.
 */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  if (USE_MOCK) {
    return MOCK_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    ).map((s) => ({ symbol: s.symbol, name: s.name, type: 'EQUITY' }));
  }

  try {
    const { data } = await client.get('/search', { params: { q: query } });
    return (data.result || [])
      .slice(0, 8)
      .map((r: Record<string, string>) => ({
        symbol: r.symbol,
        name:   r.displaySymbol,
        type:   r.type,
      }));
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────
function getDurationSeconds(timeframe: ChartTimeframe): number {
  const map: Record<ChartTimeframe, number> = {
    '1D': 86_400,
    '1W': 604_800,
    '1M': 2_592_000,
    '3M': 7_776_000,
    '1Y': 31_536_000,
  };
  return map[timeframe];
}

function getResolution(timeframe: ChartTimeframe): string {
  const map: Record<ChartTimeframe, string> = {
    '1D': '5',
    '1W': '60',
    '1M': 'D',
    '3M': 'D',
    '1Y': 'D',
  };
  return map[timeframe];
}