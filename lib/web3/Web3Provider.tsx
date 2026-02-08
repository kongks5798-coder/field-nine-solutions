'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: WEB3 PROVIDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Provides Web3 context to the entire application
 * - Wagmi for wallet connectivity
 * - React Query for state management
 * - Hydration-safe for SSR
 */

import { ReactNode, useState } from 'react';
import { WagmiProvider, State } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config';

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY CLIENT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB3 PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Web3Provider;
