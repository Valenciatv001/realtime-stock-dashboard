// ── Stock Data ──────────────────────────────
export interface Stock {
    symbol: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;        // absolute
    changePercent: number; // percentage
    volume: number;
    marketCap: number;
    high: number;
    low: number;
    open: number;
    timestamp: number;
  }
  
  export interface StockUpdate {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
  }
  
  // ── Chart / OHLC ────────────────────────────
  export interface OHLCCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
  
  export type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y';
  
  // ── Orders ──────────────────────────────────
  export type OrderType = 'BUY' | 'SELL';
  export type OrderStatus = 'PENDING' | 'FILLED' | 'FAILED' | 'CANCELLED';
  
  export interface Order {
    id: string;
    symbol: string;
    type: OrderType;
    quantity: number;
    price: number;
    status: OrderStatus;
    createdAt: number;
    updatedAt: number;
  }
  
  // ── Offline Queue ───────────────────────────
  export interface QueuedOrder extends Omit<Order, 'id' | 'status' | 'updatedAt'> {
    queuedAt: number;
    retryCount: number;
  }
  
  // ── WebSocket ───────────────────────────────
  export type WebSocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  
  export interface WebSocketMessage {
    type: 'STOCK_UPDATE' | 'ORDER_UPDATE' | 'PING' | 'PONG';
    payload: StockUpdate | Order | null;
  }
  
  // ── UI / Navigation ─────────────────────────
  export interface SearchResult {
    symbol: string;
    name: string;
    type: string; // EQUITY | ETF | CRYPTO
  }