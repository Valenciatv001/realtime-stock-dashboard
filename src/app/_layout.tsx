import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      staleTime: 30_000,
      gcTime: 5 * 60_000, // 5 min garbage collection
    },
  },
});

export default function RootLayout() {
  return (
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
              <StatusBar style="auto" />  
      <Stack> 
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="stock/[symbol]" options={{ headerShown: false }} />
          <Stack.Screen name="watchlist" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
      </React.Fragment>
  );
}
