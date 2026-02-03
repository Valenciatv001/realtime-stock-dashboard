// ─────────────────────────────────────────────
// Custom scroll-position-based windowing.
// Only renders items in viewport + buffer.
// This is what makes 10K+ items scroll at 60fps.
//
// Why not FlatList's built-in virtualization?
// FlatList uses getItemLayout + windowSize which
// can still drop frames under rapid updates.
// This hook gives us precise control over the
// render window and enables batch-update-aware
// re-rendering.
// ─────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';

interface UseVirtualizedListOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  bufferCount?: number; // items to render above/below viewport
}

interface VisibleRange {
  startIndex: number;
  endIndex: number;
}

export function useVirtualizedList({
  itemCount,
  itemHeight,
  containerHeight,
  bufferCount = 5,
}: UseVirtualizedListOptions) {
  const scrollOffsetRef = useRef(0);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startIndex: 0,
    endIndex: Math.ceil(containerHeight / itemHeight) + bufferCount,
  });

  // ── On scroll callback (attach to ScrollView's onScroll) ─
  const onScroll = useCallback(
    (scrollOffset: number) => {
      scrollOffsetRef.current = scrollOffset;

      const visibleStart = Math.floor(scrollOffset / itemHeight);
      const visibleEnd = visibleStart + Math.ceil(containerHeight / itemHeight);

      const startIndex = Math.max(0, visibleStart - bufferCount);
      const endIndex = Math.min(itemCount, visibleEnd + bufferCount);

      setVisibleRange((prev) => {
        // Only update state if range actually changed — prevents unnecessary re-renders
        if (prev.startIndex === startIndex && prev.endIndex === endIndex) return prev;
        return { startIndex, endIndex };
      });
    },
    [itemHeight, containerHeight, bufferCount, itemCount]
  );

  // ── Derived values ──────────────────────
  const totalHeight = itemCount * itemHeight;

  const paddingTop = visibleRange.startIndex * itemHeight;
  const paddingBottom = (itemCount - visibleRange.endIndex) * itemHeight;

  // Indices array — consumer maps over this
  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = visibleRange.startIndex; i < visibleRange.endIndex; i++) {
      indices.push(i);
    }
    return indices;
  }, [visibleRange]);

  return {
    visibleIndices,
    totalHeight,
    paddingTop,
    paddingBottom,
    onScroll,
  };
}