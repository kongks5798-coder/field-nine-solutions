/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: WEB3 CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Wagmi v2 configuration for multi-chain wallet connectivity
 * Supports: Ethereum, Arbitrum, Polygon, Base
 */

import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, polygon, base, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

// App metadata for WalletConnect
const appMetadata = {
  name: 'Field Nine',
  description: 'K-Street Fashion Commerce Platform with KAUS Token',
  url: 'https://m.fieldnine.io',
  icons: ['https://m.fieldnine.io/logo.png'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Supported chains (always include sepolia for easier configuration)
export const supportedChains = [
  mainnet,
  arbitrum,
  polygon,
  base,
  sepolia,
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORT CONFIGURATION (RPC URLs)
// ═══════════════════════════════════════════════════════════════════════════════

const getAlchemyUrl = (chainId: number): string => {
  const baseUrls: Record<number, string> = {
    1: 'https://eth-mainnet.g.alchemy.com/v2',
    42161: 'https://arb-mainnet.g.alchemy.com/v2',
    137: 'https://polygon-mainnet.g.alchemy.com/v2',
    8453: 'https://base-mainnet.g.alchemy.com/v2',
    11155111: 'https://eth-sepolia.g.alchemy.com/v2',
  };

  if (ALCHEMY_API_KEY && baseUrls[chainId]) {
    return `${baseUrls[chainId]}/${ALCHEMY_API_KEY}`;
  }

  // Fallback to public RPCs
  const publicRpcs: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    137: 'https://polygon-rpc.com',
    8453: 'https://mainnet.base.org',
    11155111: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  };

  return publicRpcs[chainId] || '';
};

// ═══════════════════════════════════════════════════════════════════════════════
// WAGMI CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    // MetaMask and other injected wallets
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect v2
    ...(WALLET_CONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLET_CONNECT_PROJECT_ID,
            metadata: appMetadata,
            showQrModal: true,
          }),
        ]
      : []),
    // Coinbase Wallet
    coinbaseWallet({
      appName: appMetadata.name,
      appLogoUrl: appMetadata.icons[0],
    }),
  ],
  transports: {
    [mainnet.id]: http(getAlchemyUrl(mainnet.id)),
    [arbitrum.id]: http(getAlchemyUrl(arbitrum.id)),
    [polygon.id]: http(getAlchemyUrl(polygon.id)),
    [base.id]: http(getAlchemyUrl(base.id)),
    [sepolia.id]: http(getAlchemyUrl(sepolia.id)),
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS TOKEN CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const KAUS_TOKEN = {
  // Arbitrum deployment (primary)
  arbitrum: {
    address: process.env.NEXT_PUBLIC_KAUS_TOKEN_ARBITRUM || '0x0000000000000000000000000000000000000000',
    decimals: 18,
    symbol: 'KAUS',
    name: 'K-AUS Energy Token',
  },
  // Polygon deployment (secondary)
  polygon: {
    address: process.env.NEXT_PUBLIC_KAUS_TOKEN_POLYGON || '0x0000000000000000000000000000000000000000',
    decimals: 18,
    symbol: 'KAUS',
    name: 'K-AUS Energy Token',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type SupportedChainId = (typeof supportedChains)[number]['id'];

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
