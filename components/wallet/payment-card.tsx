/**
 * K-UNIVERSAL Payment Card Component
 * Tesla/Apple-style 3D card with Framer Motion
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PaymentCardProps {
  cardholderName: string;
  cardNumber: string; // Masked: **** **** **** 1234
  expiryMonth: string;
  expiryYear: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'expired';
  onFreeze?: () => void;
  onUnfreeze?: () => void;
}

export function PaymentCard({
  cardholderName,
  cardNumber,
  expiryMonth,
  expiryYear,
  balance,
  currency,
  status,
  onFreeze,
  onUnfreeze,
}: PaymentCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-full max-w-sm mx-auto">
      <motion.div
        className="relative w-full h-56 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Card Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">Balance</p>
                <p className="text-white text-2xl font-bold">
                  {currency === 'KRW' ? '₩' : '$'}
                  {balance.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status === 'active' && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                    ACTIVE
                  </span>
                )}
                {status === 'frozen' && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                    FROZEN
                  </span>
                )}
              </div>
            </div>

            {/* Chip */}
            <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg" />

            {/* Card Number */}
            <div>
              <p className="text-white text-xl font-mono tracking-wider mb-4">
                {cardNumber}
              </p>

              {/* Card Footer */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/40 text-xs mb-1">Cardholder</p>
                  <p className="text-white text-sm font-medium uppercase">
                    {cardholderName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs mb-1">Expires</p>
                  <p className="text-white text-sm font-medium">
                    {expiryMonth}/{expiryYear}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Back */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Magnetic Stripe */}
            <div className="w-full h-12 bg-black mt-6" />

            {/* Signature & CVV */}
            <div className="p-6">
              <div className="bg-white h-10 rounded mb-4 flex items-center px-3 justify-end">
                <span className="text-gray-900 font-mono font-bold">***</span>
              </div>

              <p className="text-white/60 text-xs mb-4">
                For security, never share your CVV with anyone.
              </p>

              {/* Controls */}
              <div className="space-y-2">
                {status === 'active' && onFreeze && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFreeze();
                    }}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    ❄️ Freeze Card
                  </button>
                )}
                {status === 'frozen' && onUnfreeze && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnfreeze();
                    }}
                    className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    ✓ Unfreeze Card
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Tap card to flip
      </p>
    </div>
  );
}
