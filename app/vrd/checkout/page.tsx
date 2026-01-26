'use client';

/**
 * VRD 26SS - Checkout Page
 * Production-Grade E-commerce Checkout
 */

import { Suspense } from 'react';
import Link from 'next/link';
import VRDCheckout from '@/components/vrd/VRDCheckout';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="border-b border-[#171717]/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/vrd"
            className="text-2xl tracking-[0.3em] font-light text-[#171717]"
          >
            VRD
          </Link>
          <Link
            href="/vrd"
            className="text-sm text-[#171717]/50 hover:text-[#171717] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            쇼핑 계속하기
          </Link>
        </div>
      </header>

      {/* Checkout Component */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#171717] border-t-transparent" />
          </div>
        }
      >
        <VRDCheckout currency="KRW" />
      </Suspense>
    </div>
  );
}
