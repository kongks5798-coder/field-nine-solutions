/**
 * K-UNIVERSAL Top-up Widget
 * Framer Motion-powered payment interface
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from '@/lib/stripe/client';

const stripePromise = loadStripe(getStripePublishableKey());

interface TopupWidgetProps {
  userId: string;
  onSuccess: (amount: number) => void;
  onError: (error: string) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function TopupWidget({ userId, onSuccess, onError }: TopupWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopup = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < 1) {
      onError('Please select or enter an amount');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Payment Intent
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment failed');
      }

      // 2. Redirect to Stripe Checkout (or use Elements)
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      // For demo: Show success immediately
      // Production: Integrate Stripe Elements or redirect to checkout
      setTimeout(() => {
        onSuccess(amount);
        setIsProcessing(false);
        setSelectedAmount(null);
        setCustomAmount('');
      }, 2000);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Up Wallet</h2>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PRESET_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`
                p-4 rounded-xl font-semibold transition-all
                ${
                  selectedAmount === amount
                    ? 'bg-[#0066FF] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ${amount}
            </motion.button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or enter custom amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              $
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
              min="1"
              step="0.01"
            />
          </div>
        </div>

        {/* Selected Amount Display */}
        <AnimatePresence>
          {(selectedAmount || customAmount) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
            >
              <p className="text-sm text-blue-900 mb-1">You'll receive</p>
              <p className="text-3xl font-bold text-blue-900">
                ${(selectedAmount || parseFloat(customAmount) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                ≈ ₩{((selectedAmount || parseFloat(customAmount) || 0) * 1300).toLocaleString()} KRW
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Button */}
        <motion.button
          onClick={handleTopup}
          disabled={isProcessing || (!selectedAmount && !customAmount)}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all
            ${
              isProcessing || (!selectedAmount && !customAmount)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0066FF] text-white hover:bg-[#0052CC] shadow-lg'
            }
          `}
          whileHover={
            !isProcessing && (selectedAmount || customAmount)
              ? { scale: 1.02 }
              : {}
          }
          whileTap={
            !isProcessing && (selectedAmount || customAmount)
              ? { scale: 0.98 }
              : {}
          }
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚡
              </motion.span>
              Processing...
            </span>
          ) : (
            'Continue to Payment'
          )}
        </motion.button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Secured by Stripe. Your payment information is encrypted.
        </p>
      </motion.div>
    </div>
  );
}
