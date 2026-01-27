'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT PURCHASE MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Purchase NFTs using KAUS tokens
 * Integrates with wagmi wallet connection
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { KAUS_TOKEN } from '@/lib/web3/config';
import { NFTService } from '@/lib/nft';
import type { NFT, NFTListing } from '@/lib/nft';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NFTPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: NFTListing;
  nft: NFT;
  onPurchaseSuccess?: (txHash?: string) => void;
}

type PurchaseStep = 'confirm' | 'approve' | 'purchasing' | 'success' | 'error';

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS TOKEN ABI (ERC20 approve + transfer)
// ═══════════════════════════════════════════════════════════════════════════════

const KAUS_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function NFTPurchaseModal({
  isOpen,
  onClose,
  listing,
  nft,
  onPurchaseSuccess,
}: NFTPurchaseModalProps) {
  const { address, isConnected, chain } = useAccount();
  const [step, setStep] = useState<PurchaseStep>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | undefined>();

  // Get KAUS token config for current chain
  const kausConfig = chain?.id === 137
    ? KAUS_TOKEN.polygon
    : KAUS_TOKEN.arbitrum;

  // Get KAUS balance using ERC20 balanceOf
  const { data: kausBalanceRaw } = useReadContract({
    address: kausConfig.address as `0x${string}`,
    abi: KAUS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Format balance
  const kausBalance = kausBalanceRaw !== undefined
    ? { value: kausBalanceRaw as bigint, decimals: kausConfig.decimals }
    : undefined;

  // Contract write hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate if user has enough balance
  const priceInWei = parseUnits(listing.price.toString(), kausConfig.decimals);
  const hasEnoughBalance = kausBalance && kausBalance.value >= priceInWei;

  // Format balance for display
  const formattedBalance = kausBalance
    ? formatUnits(kausBalance.value, kausBalance.decimals)
    : '0';

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!address || !isConnected) {
      setError('지갑을 연결해주세요');
      return;
    }

    if (!hasEnoughBalance) {
      setError('KAUS 잔액이 부족합니다');
      return;
    }

    try {
      setStep('purchasing');
      setError(null);

      // Call the marketplace API to process purchase
      const result = await NFTService.buyNFT({
        listingId: listing.id,
        buyerAddress: address,
      });

      setPurchaseTxHash(result.txHash);
      setStep('success');
      onPurchaseSuccess?.(result.txHash);

    } catch (err) {
      console.error('[NFT Purchase] Error:', err);
      setError(err instanceof Error ? err.message : '구매 중 오류가 발생했습니다');
      setStep('error');
    }
  }, [address, isConnected, hasEnoughBalance, listing.id, onPurchaseSuccess]);

  // Handle approve (for on-chain purchases)
  const handleApprove = useCallback(() => {
    if (!address) return;

    setStep('approve');

    writeContract({
      address: kausConfig.address as `0x${string}`,
      abi: KAUS_ABI,
      functionName: 'approve',
      args: [
        nft.collectionId as `0x${string}`, // Marketplace contract (placeholder)
        priceInWei,
      ],
    });
  }, [address, kausConfig.address, nft.collectionId, priceInWei, writeContract]);

  // Close and reset
  const handleClose = useCallback(() => {
    setStep('confirm');
    setError(null);
    setPurchaseTxHash(undefined);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
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
              <h3 className="font-bold text-lg text-[#171717]">NFT 구매</h3>
              <p className="text-sm text-[#171717]/50">KAUS로 결제</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#171717]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content based on step */}
          {step === 'confirm' && (
            <div className="p-6">
              {/* NFT Preview */}
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-3xl">
                  {nft.image.startsWith('http') ? (
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    nft.image
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#171717]">{nft.nameKo || nft.name}</h4>
                  <p className="text-sm text-[#171717]/50">{nft.collectionName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`
                      px-2 py-0.5 rounded text-[10px] font-bold text-white
                      ${nft.rarity === 'LEGENDARY' ? 'bg-amber-500' :
                        nft.rarity === 'EPIC' ? 'bg-violet-500' :
                        nft.rarity === 'RARE' ? 'bg-blue-500' :
                        'bg-neutral-400'}
                    `}>
                      {nft.rarity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-[#171717]/3 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#171717]/60">가격</span>
                  <span className="font-bold text-[#171717]">
                    {listing.price.toLocaleString()} KAUS
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#171717]/60">플랫폼 수수료 (2.5%)</span>
                  <span className="text-[#171717]">
                    {(listing.price * 0.025).toLocaleString()} KAUS
                  </span>
                </div>
                <div className="border-t border-[#17171710] pt-3 flex justify-between items-center">
                  <span className="font-medium text-[#171717]">총 결제 금액</span>
                  <span className="font-bold text-lg text-amber-600">
                    {(listing.price * 1.025).toLocaleString()} KAUS
                  </span>
                </div>
              </div>

              {/* Balance Check */}
              <div className={`
                p-3 rounded-lg mb-6 flex items-center gap-2
                ${hasEnoughBalance ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
              `}>
                <span className={hasEnoughBalance ? 'text-green-500' : 'text-red-500'}>
                  {hasEnoughBalance ? '✓' : '✗'}
                </span>
                <span className={`text-sm ${hasEnoughBalance ? 'text-green-700' : 'text-red-700'}`}>
                  내 잔액: {Number(formattedBalance).toLocaleString()} KAUS
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl border border-[#17171720] text-[#171717] font-medium hover:bg-[#171717]/5 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!isConnected || !hasEnoughBalance}
                  className={`
                    flex-1 py-3 rounded-xl font-medium transition-all
                    ${isConnected && hasEnoughBalance
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25'
                      : 'bg-[#171717]/10 text-[#171717]/40 cursor-not-allowed'}
                  `}
                >
                  {!isConnected ? '지갑 연결 필요' :
                   !hasEnoughBalance ? '잔액 부족' :
                   '구매하기'}
                </button>
              </div>
            </div>
          )}

          {step === 'purchasing' && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h4 className="font-bold text-lg text-[#171717] mb-2">결제 처리 중...</h4>
              <p className="text-sm text-[#171717]/50">잠시만 기다려주세요</p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                🎉
              </div>
              <h4 className="font-bold text-lg text-[#171717] mb-2">구매 완료!</h4>
              <p className="text-sm text-[#171717]/50 mb-4">
                NFT가 지갑에 추가되었습니다
              </p>
              {purchaseTxHash && (
                <p className="text-xs text-[#171717]/40 font-mono mb-4 truncate">
                  TX: {purchaseTxHash}
                </p>
              )}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium"
              >
                확인
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                ❌
              </div>
              <h4 className="font-bold text-lg text-[#171717] mb-2">구매 실패</h4>
              <p className="text-sm text-red-600 mb-4">
                {error || '알 수 없는 오류가 발생했습니다'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl border border-[#17171720] text-[#171717] font-medium"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    setStep('confirm');
                    setError(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NFTPurchaseModal;
