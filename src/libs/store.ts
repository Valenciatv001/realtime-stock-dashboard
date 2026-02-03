import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  Order,
  QueuedOrder,
  Stock,
  StockUpdate,
  WebSocketStatus
} from '../types';

// ── Stock Slice ───────────────────────────
interface StockSlice {
  stocks: Map<string, Stock>;
  wsStatus: WebSocketStatus;
  setStocks: (stocks: Stock[]) => void;
  applyUpdates: (updates: StockUpdate[]) => void;
  setWsStatus: (status: WebSocketStatus) => void;
  getStock: (symbol: string) => Stock | undefined;
}

// ── Watchlist Slice ─────────────────────────
interface WatchlistSlice {
  watchlist: string[]; // symbols
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

// ── Order Slice ─────────────────────────────
interface OrderSlice {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  getOrdersBySymbol: (symbol: string) => Order[];
}

// ── Offline Queue Slice ─────────────────────
interface OfflineQueueSlice {
  queue: QueuedOrder[];
  enqueue: (item: Omit<QueuedOrder, 'queuedAt' | 'retryCount'>) => void;
  dequeue: (index: number) => void;
  incrementRetry: (index: number) => void;
  clearQueue: () => void;
}

// ── Search / UI Slice ───────────────────────
interface UISlice {
  searchQuery: string;
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  setSearchQuery: (q: string) => void;
  setSelectedTimeframe: (t: UISlice['selectedTimeframe']) => void;
}

// ── Combined Store Type ─────────────────────
type StoreState = StockSlice & WatchlistSlice & OrderSlice & OfflineQueueSlice & UISlice;

// ── Helper: merge stock update into existing stock ─
function mergeUpdate(existing: Stock | undefined, update: StockUpdate): Stock {
  if (!existing) {
    // First time seeing this symbol — construct from update
    return {
      symbol: update.symbol,
      name: update.symbol, // placeholder until full data loads
      price: update.price,
      previousClose: update.price - update.change,
      change: update.change,
      changePercent: update.changePercent,
      volume: update.volume,
      marketCap: 0,
      high: update.price,
      low: update.price,
      open: update.price,
      timestamp: update.timestamp,
    };
  }

  return {
    ...existing,
    price: update.price,
    change: update.change,
    changePercent: update.changePercent,
    volume: update.volume,
    timestamp: update.timestamp,
  };
}

// ── Store ─────────────────────────────────
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ── Stock Slice ─────────────────────
      stocks: new Map<string, Stock>(),
      wsStatus: 'DISCONNECTED' as WebSocketStatus,

      setStocks: (stocks: Stock[]) =>
        set(() => {
          const map = new Map<string, Stock>();
          stocks.forEach((s) => map.set(s.symbol, s));
          return { stocks: map };
        }),

      applyUpdates: (updates: StockUpdate[]) =>
        set((state) => {
          const newMap = new Map(state.stocks);
          updates.forEach((u) => {
            newMap.set(u.symbol, mergeUpdate(newMap.get(u.symbol), u));
          });
          return { stocks: newMap };
        }),

      setWsStatus: (status: WebSocketStatus) => set({ wsStatus: status }),

      getStock: (symbol: string) => get().stocks.get(symbol),

      // ── Watchlist Slice ───────────────────
      watchlist: [] as string[],

      addToWatchlist: (symbol: string) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist
            : [...state.watchlist, symbol],
        })),

      removeFromWatchlist: (symbol: string) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
        })),

      isWatched: (symbol: string) => get().watchlist.includes(symbol),

      // ── Order Slice ─────────────────────
      orders: [] as Order[],

      addOrder: (order: Order) =>
        set((state) => ({ orders: [order, ...state.orders] })),

      updateOrder: (id: string, updates: Partial<Order>) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o
          ),
        })),

      getOrdersBySymbol: (symbol: string) =>
        get().orders.filter((o) => o.symbol === symbol),

      // ── Offline Queue Slice ─────────────
      queue: [] as QueuedOrder[],

      enqueue: (item) =>
        set((state) => ({
          queue: [
            ...state.queue,
            { ...item, queuedAt: Date.now(), retryCount: 0 } as QueuedOrder,
          ],
        })),

      dequeue: (index: number) =>
        set((state) => ({
          queue: state.queue.filter((_, i) => i !== index),
        })),

      incrementRetry: (index: number) =>
        set((state) => ({
          queue: state.queue.map((item, i) =>
            i === index ? { ...item, retryCount: item.retryCount + 1 } : item
          ),
        })),

      clearQueue: () => set({ queue: [] }),

      // ── UI Slice ────────────────────────
      searchQuery: '',
      selectedTimeframe: '1D',

      setSearchQuery: (q: string) => set({ searchQuery: q }),
      setSelectedTimeframe: (t) => set({ selectedTimeframe: t }),
    }),

    {
      name: 'stock-dashboard-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these keys — stocks come from WebSocket
      partialize: (state) => ({
        watchlist: state.watchlist,
        orders: state.orders,
        queue: state.queue,
      }),
    }
  )
);

// ── Selector helpers (prevents unnecessary re-renders) ─
export const useWatchlist = () => useStore((s) => s.watchlist);
export const useOrders = () => useStore((s) => s.orders);
export const useOfflineQueue = () => useStore((s) => s.queue);
export const useWsStatus = () => useStore((s) => s.wsStatus);
export const useSearchQuery = () => useStore((s) => s.searchQuery);
export const useSelectedTimeframe = () => useStore((s) => s.selectedTimeframe);

// Typed selector for a single stock — avoids referencing the whole Map
export const useStock = (symbol: string) =>
  useStore((s) => s.stocks.get(symbol));