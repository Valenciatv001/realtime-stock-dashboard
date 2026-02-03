import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { useStockList } from '../hooks/useStockData';
import { useSearchQuery, useStore, useWsStatus } from '../libs/store';
import { stockWS } from '../libs/websocket';
import { Stock } from '../types';
import { SearchBar } from './SearchBar';
import { StockItem } from './StockItem';

// ── Symbols to subscribe to via WebSocket ────
const DEFAULT_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA',
  'META', 'TSLA', 'JPM', 'V', 'WMT',
  'HD', 'BRK.B', 'AVGO', 'COST', 'SPCE',
];

export function StockList() {
  const stocks = useStore((s) => s.stocks);
  const applyUpdates = useStore((s) => s.applyUpdates);
  const setWsStatus = useStore((s) => s.setWsStatus);
  const searchQuery = useSearchQuery();
  const wsStatus = useWsStatus();

  // ── Initial data fetch ──────────────────
  const { isLoading } = useStockList();

  // ── WebSocket lifecycle ───────────────────
  useEffect(() => {
    // Subscribe to updates
    const unsubUpdate = stockWS.onUpdate((updates) => {
      applyUpdates(updates);
    });

    const unsubStatus = stockWS.onStatusChange((status) => {
      setWsStatus(status);
    });

    // Connect + subscribe to symbols
    stockWS.connect();
    stockWS.subscribe(DEFAULT_SYMBOLS);

    return () => {
      unsubUpdate();
      unsubStatus();
      stockWS.disconnect();
    };
  }, [applyUpdates, setWsStatus]);

  // ── Filtered + sorted list ──────────────
  const filteredStocks: Stock[] = useMemo(() => {
    const arr = Array.from(stocks.values());

    if (!searchQuery.trim()) return arr;

    const q = searchQuery.toLowerCase();
    return arr.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [stocks, searchQuery]);

  // ── FlatList render item ────────────────
  const renderItem = useCallback(
    ({ item }: { item: Stock }) => <StockItem stock={item} />,
    []
  );

  const keyExtractor = useCallback((item: Stock) => item.symbol, []);

  // ── Item layout for FlatList optimization ─
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: 72,
      offset: 72 * index,
      index,
    }),
    []
  );

  // ── Empty / Loading states ──────────────
  if (isLoading && stocks.size === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading stocks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <SearchBar />

      {/* WebSocket status indicator */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, styles[`dot_${wsStatus}`]]} />
        <Text style={styles.statusText}>
          {wsStatus === 'CONNECTED'
            ? 'Live'
            : wsStatus === 'RECONNECTING'
            ? 'Reconnecting...'
            : 'Disconnected'}
        </Text>
        <Text style={styles.countText}>{filteredStocks.length} stocks</Text>
      </View>

      {/* Stock List */}
      <FlatList
        data={filteredStocks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={12}
        windowSize={15}
        initialNumToRender={10}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stocks found</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 14,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot_CONNECTED: {
     backgroundColor: '#22C55E' 
    },
  dot_CONNECTING: { 
    backgroundColor: '#F59E0B' 
  },
  dot_RECONNECTING: { 
    backgroundColor: '#F59E0B' 
  },
  dot_DISCONNECTED: {
     backgroundColor: '#EF4444' 
    },
  statusText: {
    color: '#64748B',
    fontSize: 12,
    marginRight: 8,
  },
  countText: {
    color: '#475569',
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Empty
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
  },
});