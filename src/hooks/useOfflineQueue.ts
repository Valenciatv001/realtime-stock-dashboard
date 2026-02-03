
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useStore } from '../libs/store';
import { Order, QueuedOrder } from '../types';

const MAX_RETRIES = 3;
const PRICE_CONFLICT_THRESHOLD = 0.005; // 0.5%

// ── Simulated order execution ──────────────
// Replace with real API call in production
async function executeOrder(order: QueuedOrder, currentPrice: number): Promise<Order> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 5% chance of random failure (simulates network issues)
  if (Math.random() < 0.05) {
    throw new Error('Network error');
  }

  return {
    id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    symbol: order.symbol,
    type: order.type,
    quantity: order.quantity,
    price: currentPrice,
    status: 'FILLED',
    createdAt: order.createdAt,
    updatedAt: Date.now(),
  };
}

export interface ConflictInfo {
  order: QueuedOrder;
  queuedPrice: number;
  currentPrice: number;
  priceDiff: number;
}

export function useOfflineQueue() {
  const queue = useStore((s) => s.queue);
  const dequeue = useStore((s) => s.dequeue);
  const incrementRetry = useStore((s) => s.incrementRetry);
  const addOrder = useStore((s) => s.addOrder);
  const stocks = useStore((s) => s.stocks);

  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const isProcessing = useRef(false);

  // ── Process queue ───────────────────────
  const processQueue = useCallback(async () => {
    if (isProcessing.current || queue.length === 0) return;
    isProcessing.current = true;

    const indicesToRemove: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      // Skip if max retries exceeded
      if (item.retryCount >= MAX_RETRIES) {
        // Create a FAILED order record
        const failedOrder: Order = {
          id: `ORD-FAILED-${Date.now()}`,
          symbol: item.symbol,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          status: 'FAILED',
          createdAt: item.createdAt,
          updatedAt: Date.now(),
        };
        addOrder(failedOrder);
        indicesToRemove.push(i);
        continue;
      }

      // Check for price conflict
      const currentStock = stocks.get(item.symbol);
      const currentPrice = currentStock?.price ?? item.price;
      const priceDiff = Math.abs(currentPrice - item.price) / item.price;

      if (priceDiff > PRICE_CONFLICT_THRESHOLD) {
        // Flag conflict — don't auto-execute
        setConflicts((prev) => [
          ...prev,
          {
            order: item,
            queuedPrice: item.price,
            currentPrice,
            priceDiff: priceDiff * 100,
          },
        ]);
        indicesToRemove.push(i);
        continue;
      }

      // Execute order
      try {
        const order = await executeOrder(item, currentPrice);
        addOrder(order);
        indicesToRemove.push(i);
      } catch {
        incrementRetry(i);
        // Exponential backoff before next retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, item.retryCount))
        );
      }
    }

    // Remove processed items (reverse to preserve indices)
    indicesToRemove.reverse().forEach((i) => dequeue(i));

    isProcessing.current = false;
  }, [queue, stocks, addOrder, dequeue, incrementRetry]);

  // ── Auto-process on app foreground ──────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (newState) => {
      if (newState === 'active') processQueue();
    });
    return () => subscription.remove();
  }, [processQueue]);

  // ── Process when queue changes ──────────
  useEffect(() => {
    if (queue.length > 0) processQueue();
  }, [queue.length, processQueue]);

  // ── Resolve a conflict manually ─────────
  const resolveConflict = useCallback(
    async (conflict: ConflictInfo, action: 'EXECUTE' | 'CANCEL') => {
      if (action === 'EXECUTE') {
        try {
          const order = await executeOrder(conflict.order, conflict.currentPrice);
          addOrder(order);
        } catch {
          const failedOrder: Order = {
            id: `ORD-FAILED-${Date.now()}`,
            symbol: conflict.order.symbol,
            type: conflict.order.type,
            quantity: conflict.order.quantity,
            price: conflict.currentPrice,
            status: 'FAILED',
            createdAt: conflict.order.createdAt,
            updatedAt: Date.now(),
          };
          addOrder(failedOrder);
        }
      } else {
        const cancelledOrder: Order = {
          id: `ORD-CANCELLED-${Date.now()}`,
          symbol: conflict.order.symbol,
          type: conflict.order.type,
          quantity: conflict.order.quantity,
          price: conflict.order.price,
          status: 'CANCELLED',
          createdAt: conflict.order.createdAt,
          updatedAt: Date.now(),
        };
        addOrder(cancelledOrder);
      }

      setConflicts((prev) => prev.filter((c) => c !== conflict));
    },
    [addOrder]
  );

  return {
    isProcessing: isProcessing.current,
    conflicts,
    resolveConflict,
    processQueue,
  };
}



