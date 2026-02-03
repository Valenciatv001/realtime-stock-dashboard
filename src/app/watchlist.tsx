// ─────────────────────────────────────────────
// Two sections:
//   1. Watchlist — stocks the user is watching
//   2. Order History — all orders with status badges
//      and offline queue indicator
// ─────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StockItem } from '../components/StockItem';
import { useOfflineQueue, useOrders, useStore, useWatchlist } from '../libs/store';
import { Order, OrderStatus } from '../types';

export default function WatchlistScreen() {
  const router = useRouter();
  const watchlist = useWatchlist();
  const orders = useOrders();
  const offlineQueue = useOfflineQueue();
  const stocks = useStore((s) => s.stocks);
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist);

  // Watched stocks that we have data for
  const watchedStocks = watchlist
    .map((symbol) => stocks.get(symbol))
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Watchlist Section ──────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watchlist</Text>

          {watchedStocks.length === 0 ? (
            <Text style={styles.emptyText}>
              No stocks in watchlist. Tap a stock and bookmark it.
            </Text>
          ) : (
            watchedStocks.map((stock) => (
              <View key={stock!.symbol} style={styles.watchedRow}>
                <View style={styles.watchedItemWrapper}>
                  <StockItem
                    stock={stock!}
                    onPress={() => router.push(`/stock/${stock!.symbol}`)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeFromWatchlist(stock!.symbol)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Offline Queue Section ──────────── */}
        {offlineQueue.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pending Orders</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{offlineQueue.length} queued</Text>
              </View>
            </View>

            {offlineQueue.map((item, i) => (
              <View key={i} style={styles.queuedOrderCard}>
                <View style={styles.queuedOrderHeader}>
                  <Text style={[styles.queuedOrderType, item.type === 'BUY' ? styles.typeBuy : styles.typeSell]}>
                    {item.type}
                  </Text>
                  <Text style={styles.queuedOrderSymbol}>{item.symbol}</Text>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                </View>
                <Text style={styles.queuedOrderDetail}>
                  {item.quantity} shares @ ${item.price.toFixed(2)} · Retries: {item.retryCount}/3
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Order History Section ──────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order History</Text>

          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders placed yet.</Text>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Order Card ────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
    PENDING: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' },
    FILLED: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22C55E' },
    FAILED: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444' },
    CANCELLED: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B' },
  };

  const { bg, text } = statusColors[order.status];

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <Text style={[styles.orderType, order.type === 'BUY' ? styles.typeBuy : styles.typeSell]}>
          {order.type}
        </Text>
        <Text style={styles.orderSymbol}>{order.symbol}</Text>
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Text style={[styles.statusText, { color: text }]}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.orderDetail}>
        {order.quantity} shares @ ${order.price.toFixed(2)}
        <Text style={styles.orderMeta}> · {formatTime(order.createdAt)}</Text>
      </Text>
    </View>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 56,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '600', marginLeft: 4 },
  spacer: { flex: 1 },

  scroll: { flex: 1 },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emptyText: { color: '#475569', fontSize: 13, paddingVertical: 8 },

  // Watchlist row
  watchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchedItemWrapper: { flex: 1 },
  removeBtn: { padding: 8 },

  // Queued orders
  queuedOrderCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  queuedOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queuedOrderType: { fontSize: 13, fontWeight: '700' },
  queuedOrderSymbol: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', flex: 1 },
  queuedOrderDetail: { color: '#64748B', fontSize: 12, marginTop: 4 },

  // Order card
  orderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderType: { fontSize: 12, fontWeight: '700' },
  typeBuy: { color: '#22C55E' },
  typeSell: { color: '#EF4444' },
  orderSymbol: { color: '#F1F5F9', fontSize: 14, fontWeight: '600', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  orderDetail: { color: '#64748B', fontSize: 12, marginTop: 4 },
  orderMeta: { color: '#475569' },

  // Pending badge
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
});