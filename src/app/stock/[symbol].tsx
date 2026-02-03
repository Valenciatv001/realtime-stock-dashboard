import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useStore } from '@/src/libs/store';
import { CandlestickChart } from '../../components/CandlestickChart';
import { OrderModal } from '../../components/OrderModal';
import { useStockDetail } from '../../hooks/useStockData';

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const [showOrderModal, setShowOrderModal] = useState(false);

  // ── Data sources ──────────────────────
  // Zustand has live WebSocket price; React Query has full detail
  const liveStock = useStore((s) => s.stocks.get(symbol ?? ''));
  const { data: detailStock } = useStockDetail(symbol ?? '');

  // Prefer live price from WS, fall back to fetched detail
  const stock = liveStock ?? detailStock;

  if (!stock) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.notFoundText}>Stock not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{stock.symbol}</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Price Header */}
        <View style={styles.priceBlock}>
          <Text style={styles.stockName}>{stock.name}</Text>
          <Text style={styles.price}>${stock.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={isPositive ? 'trending-up-outline' : 'trending-down-outline'}
              size={16}
              color={isPositive ? '#22C55E' : '#EF4444'}
            />
            <Text style={[styles.changeText, isPositive ? styles.changeGreen : styles.changeRed]}>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Chart */}
        <CandlestickChart symbol={stock.symbol} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Open" value={`$${stock.open.toFixed(2)}`} />
          <StatCard label="High" value={`$${stock.high.toFixed(2)}`} />
          <StatCard label="Low" value={`$${stock.low.toFixed(2)}`} />
          <StatCard label="Prev Close" value={`$${stock.previousClose.toFixed(2)}`} />
          <StatCard label="Volume" value={formatLargeNumber(stock.volume)} />
          <StatCard label="Market Cap" value={formatLargeNumber(stock.marketCap)} />
        </View>
      </ScrollView>

      {/* Sticky Order Button */}
      <View style={styles.orderButtonContainer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => setShowOrderModal(true)}
        >
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {/* Order Modal */}
      <OrderModal
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        symbol={stock.symbol}
        currentPrice={stock.price}
      />
    </View>
  );
}

// ── Reusable Stat Card ──────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ── Formatters ──────────────────────────────
function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString();
}

// ── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 56,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  notFoundText: { color: '#64748B', fontSize: 16 },
  backLink: { marginTop: 12 },
  backLinkText: { color: '#3B82F6', fontSize: 14 },

  // Nav header
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  navTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '600' },
  shareBtn: { padding: 4 },

  // Scroll
  scrollView: { flex: 1 },

  // Price block
  priceBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  stockName: { color: '#64748B', fontSize: 14 },
  price: {
    color: '#F1F5F9',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  changeText: { fontSize: 14, fontWeight: '600' },
  changeGreen: { color: '#22C55E' },
  changeRed: { color: '#EF4444' },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
  },
  statLabel: { color: '#475569', fontSize: 11, fontWeight: '500' },
  statValue: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginTop: 3 },

  // Order button
  orderButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  orderButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});