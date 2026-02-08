'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: WALLET CONNECT BUTTON
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade wallet connection button with:
 * - Multiple wallet support (MetaMask, WalletConnect, Coinbase)
 * - Network switching
 * - Balance display
 * - Transaction status
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { supportedChains, KAUS_TOKEN } from '@/lib/web3/config';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WalletConnectButtonProps {
  variant?: 'default' | 'compact' | 'minimal';
  showBalance?: boolean;
  showNetwork?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const WalletIcon = ({ type }: { type: string }) => {
  const icons: Record<string, string> = {
    MetaMask: '🦊',
    WalletConnect: '🔗',
    'Coinbase Wallet': '💰',
    Injected: '💳',
  };
  return <span className="text-lg">{icons[type] || '💳'}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function NetworkBadge({ chainId }: { chainId: number }) {
  const networkInfo: Record<number, { name: string; color: string }> = {
    1: { name: 'ETH', color: 'bg-blue-500' },
    42161: { name: 'ARB', color: 'bg-blue-600' },
    137: { name: 'MATIC', color: 'bg-purple-500' },
    8453: { name: 'BASE', color: 'bg-blue-400' },
    11155111: { name: 'SEP', color: 'bg-gray-500' },
  };

  const info = networkInfo[chainId] || { name: '??', color: 'bg-gray-400' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${info.color}`}>
      {info.name}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function WalletModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { connectors, connect, isPending } = useConnect();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const handleConnect = useCallback(
    async (connector: typeof connectors[number]) => {
      setSelectedConnector(connector.id);
      try {
        await connect({ connector });
        onClose();
      } catch (error) {
        console.error('Connection error:', error);
      } finally {
        setSelectedConnector(null);
      }
    },
    [connect, onClose]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#17171708] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-[#171717]">지갑 연결</h3>
              <p className="text-sm text-[#171717]/50">KAUS 토큰을 관리하세요</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#171717]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Wallet Options */}
          <div className="p-4 space-y-2">
            {connectors.map((connector) => {
              const isLoading = isPending && selectedConnector === connector.id;
              return (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl
                    border border-[#17171710] hover:border-amber-500/50
                    hover:bg-amber-500/5 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLoading ? 'bg-amber-500/5 border-amber-500/30' : ''}
                  `}
                >
                  <WalletIcon type={connector.name} />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-[#171717]">{connector.name}</div>
                    <div className="text-xs text-[#171717]/50">
                      {connector.name === 'MetaMask' && '가장 인기 있는 브라우저 지갑'}
                      {connector.name === 'WalletConnect' && 'QR 코드로 모바일 지갑 연결'}
                      {connector.name === 'Coinbase Wallet' && 'Coinbase 생태계 지갑'}
                      {connector.name === 'Injected' && '감지된 브라우저 지갑'}
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-[#171717]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#171717]/3 border-t border-[#17171708]">
            <p className="text-xs text-[#171717]/40 text-center">
              지갑 연결 시 <span className="text-amber-600">이용약관</span>에 동의하게 됩니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTED WALLET INFO
// ═══════════════════════════════════════════════════════════════════════════════

function ConnectedWallet({
  showBalance,
  showNetwork,
  variant,
}: {
  showBalance: boolean;
  showNetwork: boolean;
  variant: string;
}) {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const [showMenu, setShowMenu] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm font-medium"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {shortAddress}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#171717]/5 to-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
      >
        {/* Status Indicator */}
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

        {/* Wallet Info */}
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#171717] text-sm">{shortAddress}</span>
            {showNetwork && <NetworkBadge chainId={chainId} />}
          </div>
          {showBalance && balance && (
            <div className="text-xs text-[#171717]/50">
              {(Number(balance.value) / Math.pow(10, balance.decimals)).toFixed(4)} {balance.symbol}
            </div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-[#171717]/40 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-[#17171710] shadow-xl z-50 overflow-hidden"
          >
            {/* Wallet Details */}
            <div className="p-4 border-b border-[#17171708]">
              <div className="flex items-center gap-2 mb-2">
                <WalletIcon type={connector?.name || 'Injected'} />
                <span className="font-medium text-[#171717]">{connector?.name}</span>
              </div>
              <p className="text-xs text-[#171717]/50 font-mono">{address}</p>
            </div>

            {/* Network Switcher */}
            <div className="p-2 border-b border-[#17171708]">
              <p className="text-xs text-[#171717]/40 px-2 py-1 uppercase">네트워크 변경</p>
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    switchChain({ chainId: chain.id });
                    setShowMenu(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm
                    hover:bg-[#171717]/5 transition-colors
                    ${chain.id === chainId ? 'bg-amber-500/10 text-amber-600' : 'text-[#171717]'}
                  `}
                >
                  <NetworkBadge chainId={chain.id} />
                  <span>{chain.name}</span>
                  {chain.id === chainId && (
                    <svg className="w-4 h-4 ml-auto text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                연결 해제
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function WalletConnectButton({
  variant = 'default',
  showBalance = true,
  showNetwork = true,
  className = '',
}: WalletConnectButtonProps) {
  const { isConnected, isConnecting } = useAccount();
  const [showModal, setShowModal] = useState(false);

  // Connected state
  if (isConnected) {
    return (
      <div className={className}>
        <ConnectedWallet
          showBalance={showBalance}
          showNetwork={showNetwork}
          variant={variant}
        />
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-[#171717]/5 text-[#171717]/50 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-[#171717]/30 border-t-amber-500 rounded-full animate-spin" />
        연결 중...
      </button>
    );
  }

  // Disconnected state
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-gradient-to-r from-amber-500 to-orange-500
          text-white font-medium hover:shadow-lg hover:shadow-amber-500/25
          transition-all ${className}
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        {variant === 'minimal' ? '연결' : '지갑 연결'}
      </button>

      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default WalletConnectButton;
