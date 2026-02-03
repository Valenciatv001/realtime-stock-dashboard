import { StockUpdate, WebSocketMessage, WebSocketStatus } from '../types';

type UpdateListener = (updates: StockUpdate[]) => void;
type StatusListener = (status: WebSocketStatus) => void;

const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 30_000;   // 30s ping
const HEARTBEAT_TIMEOUT_MS = 10_000;    // 10s wait for pong
const RECONNECT_BASE_DELAY_MS = 1_000;  // exponential backoff base
const BATCH_INTERVAL_MS = 16;           // ~60fps batching

// ── Simulated WebSocket URL ─────────────────
// Replace with real endpoint when available.
// For local dev: ws://localhost:3001/stocks
const WS_URL = 'wss://echo.websocket.org'; // placeholder — swap in real URL

export class StockWebSocketManager {
  private static instance: StockWebSocketManager;

  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  // Batching
  private pendingUpdates: StockUpdate[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  // Listeners
  private updateListeners = new Set<UpdateListener>();
  private statusListeners = new Set<StatusListener>();

  // Subscribed symbols
  private subscribedSymbols = new Set<string>();

  // ── Singleton ─────────────────────────────
  static getInstance(): StockWebSocketManager {
    if (!StockWebSocketManager.instance) {
      StockWebSocketManager.instance = new StockWebSocketManager();
    }
    return StockWebSocketManager.instance;
  }

  private constructor() {}

  // ── Public API ────────────────────────────
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.createConnection();
  }

  disconnect(): void {
    this.clearTimers();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
    this.setStatus('DISCONNECTED');
  }

  subscribe(symbols: string[]): void {
    symbols.forEach((s) => this.subscribedSymbols.add(s.toUpperCase()));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'SUBSCRIBE', symbols: [...this.subscribedSymbols] });
    }
  }

  unsubscribe(symbols: string[]): void {
    symbols.forEach((s) => this.subscribedSymbols.delete(s.toUpperCase()));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'UNSUBSCRIBE', symbols });
    }
  }

  onUpdate(listener: UpdateListener): () => void {
    this.updateListeners.add(listener);
    return () => this.updateListeners.delete(listener); // returns unsubscribe fn
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  // ── Connection Lifecycle ──────────────────
  private createConnection(): void {
    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.startHeartbeat();

        // Re-subscribe to all symbols on reconnect
        if (this.subscribedSymbols.size > 0) {
          this.sendMessage({ type: 'SUBSCRIBE', symbols: [...this.subscribedSymbols] });
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = () => {
        // Don't log in production — just let onclose handle it
        this.ws?.close();
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.stopHeartbeat();
        if (event.code !== 1000) {
          // Abnormal close — attempt reconnect
          this.attemptReconnect();
        } else {
          this.setStatus('DISCONNECTED');
        }
      };
    } catch {
      this.setStatus('DISCONNECTED');
    }
  }

  // ── Message Handling ──────────────────────
  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(rawData);

      switch (message.type) {
        case 'STOCK_UPDATE':
          if (message.payload) {
            this.batchUpdate(message.payload as StockUpdate);
          }
          break;
        case 'PONG':
          this.clearHeartbeatTimeout();
          break;
        default:
          break;
      }
    } catch {
      // Malformed message — ignore silently
    }
  }

  // ── Batched Updates (60fps max) ───────────
  private batchUpdate(update: StockUpdate): void {
    this.pendingUpdates.push(update);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, BATCH_INTERVAL_MS);
    }
  }

  private flushBatch(): void {
    if (this.pendingUpdates.length === 0) return;

    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];
    this.batchTimer = null;

    // Deduplicate: keep only latest update per symbol
    const deduped = new Map<string, StockUpdate>();
    updates.forEach((u) => deduped.set(u.symbol, u));

    const dedupedArray = Array.from(deduped.values());
    this.updateListeners.forEach((listener) => listener(dedupedArray));
  }

  // ── Heartbeat ─────────────────────────────
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage({ type: 'PING', payload: null });
      this.startHeartbeatTimeout();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  private startHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeoutTimer = setTimeout(() => {
      // No PONG received — connection is dead
      this.ws?.close(1006, 'Heartbeat timeout');
    }, HEARTBEAT_TIMEOUT_MS);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  // ── Reconnection (Exponential Backoff) ────
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setStatus('DISCONNECTED');
      return;
    }

    this.setStatus('RECONNECTING');
    this.reconnectAttempts++;

    const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  // ── Utility ───────────────────────────────
  private sendMessage(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.stopHeartbeat();
  }
}

// ── Default export: singleton accessor ────
export const stockWS = StockWebSocketManager.getInstance();