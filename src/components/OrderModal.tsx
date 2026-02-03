

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useStore } from '../libs/store';
import { OrderType } from '../types';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
}

// ── Simulated order API ────────────────────
async function submitOrder(symbol: string, type: OrderType, quantity: number, price: number) {
  await new Promise((resolve) => setTimeout(resolve, 1200)); // simulate latency

  // 10% chance of failure (simulates network/server error)
  if (Math.random() < 0.1) throw new Error('Order submission failed');

  return { success: true };
}

export function OrderModal({ visible, onClose, symbol, currentPrice }: OrderModalProps) {
  const [orderType, setOrderType] = useState<OrderType>('BUY');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrder = useStore((s) => s.addOrder);
  const updateOrder = useStore((s) => s.updateOrder);
  const enqueue = useStore((s) => s.queue ? s.enqueue : () => {});

  // ── Derived ────────────────────────────
  const qty = parseInt(quantity, 10) || 0;
  const isValidQty = qty > 0 && qty <= 10_000;
  const totalCost = (qty * currentPrice).toFixed(2);

  // ── Submit handler ──────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isValidQty) return;
    setIsSubmitting(true);
    setError(null);

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    // ── Optimistic update: add as PENDING ─
    addOrder({
      id: orderId,
      symbol,
      type: orderType,
      quantity: qty,
      price: currentPrice,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });

    try {
      await submitOrder(symbol, orderType, qty, currentPrice);

      // ── Success: update to FILLED ─────
      updateOrder(orderId, { status: 'FILLED' });
      onClose();
    } catch {
      // ── Failure: rollback + queue ──────
      updateOrder(orderId, { status: 'FAILED' });

      // Push to offline queue for later retry
      enqueue({
        symbol,
        type: orderType,
        quantity: qty,
        price: currentPrice,
        createdAt: now,
      });

      setError('Order failed. Added to offline queue — will retry automatically.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isValidQty, symbol, orderType, qty, currentPrice, addOrder, updateOrder, enqueue, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSymbol}>{symbol}</Text>
              <Text style={styles.headerPrice}>${currentPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Order Type Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'BUY' && styles.toggleBtnBuy]}
              onPress={() => setOrderType('BUY')}
            >
              <Text style={[styles.toggleText, orderType === 'BUY' && styles.toggleTextActive]}>
                BUY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'SELL' && styles.toggleBtnSell]}
              onPress={() => setOrderType('SELL')}
            >
              <Text style={[styles.toggleText, orderType === 'SELL' && styles.toggleTextActive]}>
                SELL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quantity Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (shares)</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#475569"
              maxLength={6}
            />
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per share</Text>
              <Text style={styles.summaryValue}>${currentPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{qty}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={[styles.summaryValue, styles.summaryTotalValue]}>
                ${totalCost}
              </Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              orderType === 'BUY' ? styles.submitBtnBuy : styles.submitBtnSell,
              (!isValidQty || isSubmitting) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValidQty || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.submitText}>
                {orderType} {qty} {symbol}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {},
  headerSymbol: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  headerPrice: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 2,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  toggleBtnBuy: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  toggleBtnSell: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  toggleText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#F1F5F9' },

  // Input
  inputGroup: { marginBottom: 16 },
  label: { color: '#64748B', fontSize: 12, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
  },

  // Summary
  summary: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { color: '#64748B', fontSize: 13 },
  summaryValue: { color: '#CBD5E1', fontSize: 13, fontWeight: '500' },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 6,
    paddingTop: 10,
  },
  summaryTotalValue: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: '#F59E0B', fontSize: 12, flex: 1 },

  // Submit
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnBuy: { backgroundColor: '#22C55E' },
  submitBtnSell: { backgroundColor: '#EF4444' },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
});