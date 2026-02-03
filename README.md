# StockFlow — Real-Time Stock Trading Dashboard

A production-grade React Native mobile app featuring real-time market data streaming, interactive candlestick charts, offline-first order management, and end-to-end encrypted local storage.

---

## Features

- **Real-Time Streaming** — WebSocket connection with automatic reconnection (exponential backoff), heartbeat monitoring, and 60fps batched UI updates
- **Candlestick Charts** — Interactive Victory Native charts with timeframe switching (1D/1W/1M/3M/1Y), auto-scaling Y-axis, and data subsampling for performance
- **Offline-First Orders** — Place orders while disconnected. Orders queue locally, auto-execute on reconnection with conflict detection (price drift > 0.5%)
- **Optimistic Updates** — Orders show as PENDING immediately, roll back to FAILED + queue on error — zero blocking UX
- **Encrypted Storage** — Watchlists and orders encrypted at rest via `expo-secure-store` key management
- **Custom Virtualization** — `useVirtualizedList` hook renders only visible items + buffer. Scroll 10K+ items at 60fps
- **Search & Filter** — Debounced (300ms) real-time stock search across symbol and name

---

## Tech Stack

| Category | Technology | Why |
|----------|-----------|-----|
| Framework | React Native + Expo | Cross-platform, OTA updates |
| Language | TypeScript (strict) | Zero `any`, compile-time safety |
| State | Zustand | Lightweight, no boilerplate, persisted |
| Server State | React Query | Caching, refetch, stale-while-revalidate |
| Real-Time | WebSocket | Sub-second price updates |
| Charts | Victory Native | GPU-friendly, customizable |
| Animations | React Native Reanimated | Bridge-free 60fps animations |
| Security | expo-secure-store + expo-crypto | Keychain/Keystore encryption |
| Navigation | Expo Router | File-based routing, deep links |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                        │
│  StockList → StockItem (memoized, animated)     │
│  StockDetail → CandlestickChart → OrderModal    │
│  WatchlistScreen → OrderHistory                 │
└──────────────┬──────────────────────────────────┘
               │ reads / dispatches
┌──────────────▼──────────────────────────────────┐
│            State Layer (Zustand)                 │
│  stocks (Map)  │ watchlist │ orders │ queue     │
│  Persisted via AsyncStorage (partialize)         │
└──────┬────────────────────────┬────────────────┘
       │                        │
┌──────▼──────┐        ┌───────▼────────┐
│  WebSocket  │        │  React Query   │
│  Manager    │        │  (API Layer)   │
│  Singleton  │        │  Finnhub API   │
│  Batching   │        │  Mock fallback │
│  Heartbeat  │        │  Caching       │
└─────────────┘        └────────────────┘
       │                        │
┌──────▼────────────────────────▼────────────────┐
│              Data Sources                        │
│  WebSocket → live price stream                   │
│  REST API  → stock detail, OHLC candles         │
│  Mock Data → works without API key              │
└─────────────────────────────────────────────────┘
       │
┌──────▼─────────────────────────────────────────┐
│         Security Layer                           │
│  expo-secure-store → key storage (Keychain)     │
│  AES encryption → order / watchlist data        │
│  Token rotation → key refresh on demand         │
└────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Zustand over Redux** — Redux adds ~15KB bundle + boilerplate for this scale. Zustand achieves the same with 1KB and cleaner selectors.
2. **WebSocket batching at 16ms** — Prevents multiple re-renders per frame when 50+ symbols update simultaneously. Deduplicates by symbol (keeps latest).
3. **Partial persistence** — Only `watchlist`, `orders`, and `queue` persist. Stock prices always come fresh from WebSocket/API — no stale cached prices.
4. **Mock-first data layer** — App works out of the box without an API key. Swap `API_KEY` in `lib/api.ts` for live Finnhub data.
5. **Conflict detection on offline orders** — If price moves > 0.5% while order is queued, it surfaces a conflict card instead of auto-executing at a stale price.

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android emulator (or physical device)

### Install & Run

```bash
# Clone
git clone https://github.com/valenciatv001/realtime-stock-dashboard.git
cd realtime-stock-dashboard

# Install
npm install

# Start
npx expo start
```

### Optional: Live Market Data

1. Sign up at [finnhub.io](https://finnhub.io) (free tier)
2. Copy your API key
3. In `src/lib/api.ts`, set:
   ```typescript
   const API_KEY = 'your_key_here';
   ```
4. Restart the app — it will fetch real stock data

---

## Project Structure

```
src/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root: QueryClient + navigation config
│   ├── index.tsx                 # Home: StockList
│   ├── stock/
│   │   └── [symbol].tsx          # Detail: Chart + Order
│   └── watchlist.tsx             # Watchlist + Order History
│
├── components/                   # Reusable UI
│   ├── CandlestickChart.tsx      # Victory chart + timeframe selector
│   ├── OrderModal.tsx            # Buy/Sell sheet with optimistic updates
│   ├── SearchBar.tsx             # Debounced search input
│   ├── StockItem.tsx             # Animated price row (memoized)
│   └── StockList.tsx             # FlatList + WebSocket integration
│
├── hooks/                        # Business logic hooks
│   ├── useOfflineQueue.ts        # Queue processor + conflict resolver
│   ├── useStockData.ts           # React Query wrappers
│   └── useVirtualizedList.ts     # Custom scroll windowing
│
├── lib/                          # Core infrastructure
│   ├── api.ts                    # Finnhub API + mock data
│   ├── encryption.ts             # AES encrypt/decrypt + secure key store
│   ├── store.ts                  # Zustand store (5 slices)
│   └── websocket.ts              # WebSocket manager (singleton)
│
└── types/
    └── index.ts                  # All shared TypeScript interfaces
```

---

## Performance

| Metric | Value | Method |
|--------|-------|--------|
| WebSocket update → UI render | <16ms | Batched at 60fps |
| FlatList scroll (15 items) | 60fps | `getItemLayout` + `maxToRenderPerBatch` |
| Custom virtualized scroll (10K items) | 60fps | `useVirtualizedList` hook |
| Chart render (100 candles) | <100ms | Victory Native + data subsampling |
| Search filter (15 stocks) | <5ms | In-memory filter, debounced input |
| Bundle size | ~12MB | Expo managed |

---

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watchAll
```

### Test Coverage
- `lib/websocket.ts` — reconnection, batching, heartbeat
- `lib/store.ts` — all slice mutations and selectors
- `lib/encryption.ts` — encrypt/decrypt roundtrip
- `hooks/useOfflineQueue.ts` — conflict detection logic
- `components/StockItem.tsx` — render and memoization

---

## Offline Flow

```
User places order
       │
       ▼
Optimistic update (status: PENDING)
       │
       ├── Network OK ──► API call ──► FILLED ✓
       │
       └── Network FAIL ─► Rollback to FAILED
                           Push to offline queue
                                  │
                    App foreground / reconnect
                                  │
                    ▼
              Price drift check
                  │         │
                  ▼         ▼
              <0.5%      >0.5%
              Auto-exec   Show conflict card
              FILLED ✓    User decides: execute / cancel
```

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):
1. TypeScript type check
2. ESLint
3. Jest test suite
4. Expo build (EAS)

---

## What's Next

- [ ] WebSocket reconnection with token refresh (auth flow)
- [ ] Portfolio P&L calculations
- [ ] Push notifications for price alerts
- [ ] React Native Skia candlestick renderer (GPU)
- [ ] Detox E2E test suite
- [ ] Dark/Light theme toggle

---

## Author

**Agwu Ezekiel** — Senior React Native Engineer

- [LinkedIn](https://linkedin.com/in/agwuezekiel)
- [Portfolio](https://agwuezekiel.vercel.app)
- [GitHub](https://github.com/valenciatv001)

---

*Built with performance and security in mind. Every architectural decision is documented in the code comments and this README.*