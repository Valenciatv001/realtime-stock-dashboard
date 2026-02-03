import { useQuery } from '@tanstack/react-query';
import { fetchOHLCData, fetchStockDetail, fetchStockList, searchStocks } from '../libs/api';
import { useStore } from '../libs/store';
import { ChartTimeframe } from '../types';

// ── Query Keys (centralized — prevents stale key bugs) ─
export const QUERY_KEYS = {
  stockList: ['stocks', 'list'] as const,
  stockDetail: (symbol: string) => ['stocks', 'detail', symbol] as const,
  ohlcData: (symbol: string, timeframe: ChartTimeframe) => ['stocks', 'ohlc', symbol, timeframe] as const,
  search: (query: string) => ['stocks', 'search', query] as const,
};

// ── Stock List ────────────────────────────
export function useStockList() {
  const setStocks = useStore((s) => s.setStocks);

  return useQuery({
    queryKey: QUERY_KEYS.stockList,
    queryFn: async () => {
      const stocks = await fetchStockList();
      setStocks(stocks); // sync to Zustand for WebSocket updates
      return stocks;
    },
    staleTime: 30_000,       // data fresh for 30s
    refetchInterval: 60_000, // background refetch every 60s
  });
}

// ── Single Stock ──────────────────────────
export function useStockDetail(symbol: string) {
  return useQuery({
    queryKey: QUERY_KEYS.stockDetail(symbol),
    queryFn: () => fetchStockDetail(symbol),
    staleTime: 10_000,
    enabled: symbol.length > 0,
  });
}

// ── OHLC Chart Data ───────────────────────
export function useOHLCData(symbol: string, timeframe: ChartTimeframe) {
  return useQuery({
    queryKey: QUERY_KEYS.ohlcData(symbol, timeframe),
    queryFn: () => fetchOHLCData(symbol, timeframe),
    staleTime: 60_000,
    enabled: symbol.length > 0,
  });
}

// ── Search ────────────────────────────────
export function useStockSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchStocks(query),
    staleTime: 5_000,
    enabled: query.trim().length >= 1,
  });
}