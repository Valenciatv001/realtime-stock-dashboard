// components/SearchBar.tsx
// ─────────────────────────────────────────────
// Debounced search input (300ms). Updates Zustand
// searchQuery — StockList filters reactively.
// ─────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore } from '../libs/store';

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState('');

  // ── Debounce: only update global state after pause ─
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color="#64748B" style={styles.icon} />

      <TextInput
        style={styles.input}
        value={localQuery}
        onChangeText={setLocalQuery}
        placeholder="Search stocks..."
        placeholderTextColor="#475569"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        returnKeyType="search"
      />

      {localQuery.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  icon: {
    // fixed width for alignment
  },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 14,
    height: '100%',
  },
});