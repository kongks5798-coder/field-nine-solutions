/**
 * K-UNIVERSAL Ghost Wallet Page
 * Tesla/Apple-grade payment interface
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentCard } from '@/components/wallet/payment-card';
import { TopupWidget } from '@/components/wallet/topup-widget';

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [balance, setBalance] = useState(0);

  // Demo data
  const demoCard = {
    cardholderName: 'K-Universal User',
    cardNumber: '**** **** **** 1234',
    expiryMonth: '12',
    expiryYear: '27',
    balance: balance,
    currency: 'USD',
    status: 'active' as const,
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            👻 Ghost Wallet
          </h1>
          <p className="text-xl text-gray-600">
            Your non-custodial payment solution
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Payment Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PaymentCard {...demoCard} />

            {/* Card Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setShowTopup(!showTopup)}
                className="w-full px-6 py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold transition-colors shadow-lg"
              >
                💳 Top Up Balance
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                📊 View Transactions
              </button>
              <button className="w-full px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold border-2 border-gray-200 transition-colors">
                ➕ Create Virtual Card
              </button>
            </div>
          </motion.div>

          {/* Top-up Widget */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {showTopup ? (
              <TopupWidget
                userId="demo-user-id"
                onSuccess={(amount) => {
                  setBalance(balance + amount);
                  setShowTopup(false);
                  alert(`✅ Successfully added $${amount} to your wallet!`);
                }}
                onError={(error) => {
                  alert(`❌ ${error}`);
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Wallet Features
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">💳</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Virtual Cards
                      </h3>
                      <p className="text-sm text-gray-600">
                        Generate unlimited virtual cards for secure online payments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔒</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Biometric Security
                      </h3>
                      <p className="text-sm text-gray-600">
                        Face ID / Touch ID authentication for all transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⚡</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Instant Top-up
                      </h3>
                      <p className="text-sm text-gray-600">
                        Add funds instantly with any credit/debit card
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🌍</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Global Payments
                      </h3>
                      <p className="text-sm text-gray-600">
                        Pay anywhere in the world with automatic currency conversion
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
