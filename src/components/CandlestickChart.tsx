
import { useFont } from '@shopify/react-native-skia';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { useOHLCData } from '../hooks/useStockData';
import { useStore } from '../libs/store';
import { ChartTimeframe } from '../types';

const TIMEFRAMES: ChartTimeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

interface CandlestickChartProps {
  symbol: string;
}

export function CandlestickChart({ symbol }: CandlestickChartProps) {
  const selectedTimeframe = useStore((s) => s.selectedTimeframe);
  const setSelectedTimeframe = useStore((s) => s.setSelectedTimeframe);

  // Load font for chart labels - using system font via require
  // Note: In production, you'd want to use a custom font file
  const font = useFont(require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'), 12);

  const { data: candles, isLoading } = useOHLCData(symbol, selectedTimeframe);

  // ── Subsample data if too many candles (perf) ─
  const chartData = useMemo(() => {
    if (!candles) return [];
    // Target max 100 data points on screen
    const MAX_POINTS = 100;
    if (candles.length <= MAX_POINTS) return candles;

    const step = Math.ceil(candles.length / MAX_POINTS);
    return candles.filter((_, i) => i % step === 0);
  }, [candles]);

  // ── Y-axis domain (auto-fit with padding) ─
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };

    const allPrices = chartData.flatMap((c) => [c.low, c.high]);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = (max - min) * 0.05;

    return { min: min - padding, max: max + padding };
  }, [chartData]);

  // ── X-axis label formatter ──────────────
  const formatXLabel = useCallback((value: number) => {
    if (!value || typeof value !== 'number') return '';
    const date = new Date(value);

    switch (selectedTimeframe) {
      case '1D':
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      case '1W':
        return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
      default:
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }, [selectedTimeframe]);

  if (isLoading || chartData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeRow}>
        {TIMEFRAMES.map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setSelectedTimeframe(tf)}
            style={[styles.tfButton, selectedTimeframe === tf && styles.tfButtonActive]}
          >
            <Text style={[styles.tfText, selectedTimeframe === tf && styles.tfTextActive]}>
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart - Note: victory-native v41+ uses CartesianChart API */}
      {/* Candlestick charts require custom implementation with victory-native-xl */}
      {/* For now, using Line chart for all timeframes */}
      {/* Type assertions used below due to victory-native-xl complex type definitions */}
      <View style={styles.chartContainer}>
        {font && (
          <CartesianChart
            data={chartData as unknown as Record<string, unknown>[]}
            xKey={"timestamp" as never}
            yKeys={["close"] as never}
            domain={{ y: [yDomain.min, yDomain.max] }}
            domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
            axisOptions={{
              font,
              tickCount: 5,
              formatXLabel: formatXLabel,
              formatYLabel: (v: any) => `$${v.toFixed(0)}`,
              lineColor: '#1E293B',
              labelColor: '#64748B',
            }}
          >
            {({ points }: any) => (
              <Line
                points={points.close}
                color="#3B82F6"
                strokeWidth={2}
                animate={{ type: "timing", duration: 300 }}
              />
            )}
          </CartesianChart>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
  },
  chartContainer: {
    height: 240,
  },

  // Timeframe selector
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tfButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tfButtonActive: {
    backgroundColor: '#1E293B',
  },
  tfText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  tfTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});