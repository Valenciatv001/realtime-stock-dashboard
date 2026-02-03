import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Stock } from '../types';

interface StockItemProps {
  stock: Stock;
  onPress?: () => void;
}

const FLASH_DURATION_MS = 300;
const GREEN_FLASH = 'rgba(34, 197, 94, 0.25)';   // green-500 @ 25%
const RED_FLASH   = 'rgba(239, 68, 68, 0.25)';   // red-500 @ 25%
const DEFAULT_BG  = 'transparent';

export const StockItem = React.memo(({ stock, onPress }: StockItemProps) => {
  const router = useRouter();
  const flashOpacity = useSharedValue(0);
  const prevPriceRef = useRef(stock.price);
  const isPositive = stock.change >= 0;

  // ── Flash animation on price change ──────
  useEffect(() => {
    if (stock.price !== prevPriceRef.current) {
      prevPriceRef.current = stock.price;

      // Trigger flash: opacity 1 → 0
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: FLASH_DURATION_MS })
      );
    }
  }, [stock.price, flashOpacity]);

  const flashColor = useSharedValue(isPositive ? GREEN_FLASH : RED_FLASH);

  useEffect(() => {
    flashColor.value = isPositive ? GREEN_FLASH : RED_FLASH;
  }, [isPositive, flashColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isPositive ? GREEN_FLASH : RED_FLASH,
    opacity: flashOpacity.value,
  }));

  // ── Navigate to detail ──────────────────
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/stock/${stock.symbol}`);
    }
  }, [onPress, stock.symbol, router]);

  // ── Format helpers ──────────────────────
  const formattedPrice = formatCurrency(stock.price);
  const formattedChange = `${isPositive ? '+' : ''}${stock.change.toFixed(2)}`;
  const formattedPercent = `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
  const formattedVolume = formatVolume(stock.volume);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.container}>
      {/* Flash overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle, styles.flashOverlay]} />

      {/* Symbol + Name */}
      <View style={styles.leftBlock}>
        <Text style={styles.symbol}>{stock.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{stock.name}</Text>
      </View>

      {/* Price + Change */}
      <View style={styles.rightBlock}>
        <Text style={styles.price}>{formattedPrice}</Text>
        <View style={[styles.badge, isPositive ? styles.badgeGreen : styles.badgeRed]}>
          <Text style={[styles.badgeText, isPositive ? styles.badgeTextGreen : styles.badgeTextRed]}>
            {formattedChange} ({formattedPercent})
          </Text>
        </View>
      </View>

      {/* Volume (subtle) */}
      <View style={styles.volumeBlock}>
        <Text style={styles.volume}>{formattedVolume}</Text>
      </View>
    </TouchableOpacity>
  );
});

StockItem.displayName = 'StockItem';

// ── Formatters ──────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(2)}`;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

// ── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    height: 72,
    position: 'relative',
  },
  flashOverlay: {
    borderRadius: 8,
  },

  // Left: Symbol + Name
  leftBlock: {
    flex: 1,
    zIndex: 1,
  },
  symbol: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  // Right: Price + Change
  rightBlock: {
    alignItems: 'flex-end',
    zIndex: 1,
  },
  price: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextGreen: {
    color: '#22C55E',
  },
  badgeTextRed: {
    color: '#EF4444',
  },

  // Volume
  volumeBlock: {
    width: 56,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  volume: {
    color: '#475569',
    fontSize: 11,
  },
});