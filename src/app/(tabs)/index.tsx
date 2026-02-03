// app/index.tsx
// ─────────────────────────────────────────────
// Home screen. Renders the StockList + a simple
// top header with app title and offline queue badge.
// ─────────────────────────────────────────────

import { StockList } from '@/src/components/StockList';
import { useOfflineQueue } from '@/src/libs/store';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


export default function Home() {
  const offlineQueue = useOfflineQueue();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>StockFlow</Text>
          <Text style={styles.subtitle}>Markets</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Offline queue badge */}
          {offlineQueue.length > 0 && (
            <Link href="/watchlist" asChild>
              <View style={styles.queueBadge}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                <Text style={styles.queueBadgeText}>{offlineQueue.length}</Text>
              </View>
            </Link>
          )}

          {/* Watchlist link */}
          <Link href="/watchlist" asChild>
            <View style={styles.headerIconBtn}>
              <Ionicons name="bookmark-outline" size={22} color="#64748B" />
            </View>
          </Link>
        </View>
      </View>

      {/* Stock List */}
      <StockList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 56, // safe area top
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {},
  title: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#475569',
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    padding: 4,
  },

  // Offline queue badge
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  queueBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
});