/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 48: KAUS COIN PURCHASE API (DIRECT BUY)
 * ═══════════════════════════════════════════════════════════════════════════════
 * PayPal/카드로 KAUS 코인 직접 구매
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalClient } from '@/lib/payment/paypal';
import { logKausPurchase } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

const PURCHASE_PACKAGES = [
  { id: 'starter', kausAmount: 1000, priceKRW: 100000, priceUSD: 75, bonus: 0, label: 'Starter' },
  { id: 'growth', kausAmount: 5000, priceKRW: 475000, priceUSD: 350, bonus: 5, label: 'Growth' },
  { id: 'premium', kausAmount: 10000, priceKRW: 900000, priceUSD: 670, bonus: 10, label: 'Premium' },
  { id: 'sovereign', kausAmount: 50000, priceKRW: 4000000, priceUSD: 3000, bonus: 20, label: 'Sovereign' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, currency, paymentMethod } = body;

    const pkg = PURCHASE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Invalid package' }, { status: 400 });
    }

    const amount = currency === 'KRW' ? pkg.priceKRW : pkg.priceUSD;
    const bonusAmount = Math.floor(pkg.kausAmount * (pkg.bonus / 100));
    const totalKaus = pkg.kausAmount + bonusAmount;
    const referenceId = `KAUS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (paymentMethod === 'paypal') {
      const paypal = getPayPalClient();

      if (!paypal.isConfigured) {
        await logKausPurchase('demo-user', totalKaus, currency, referenceId, 'SUCCESS', { packageId, bonusAmount, simulated: true });
        return NextResponse.json({
          success: true,
          orderId: referenceId,
          kausAmount: pkg.kausAmount,
          bonusAmount,
          totalKaus,
          message: 'Demo purchase successful',
        });
      }

      const result = await paypal.createOrder({
        amount,
        currency,
        description: `KAUS Coin - ${pkg.label} (${totalKaus.toLocaleString()} KAUS)`,
        referenceId,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io'}/nexus/payment/success?ref=${referenceId}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io'}/nexus/exchange`,
      });

      if (!result.success || !result.order) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      await logKausPurchase('demo-user', totalKaus, currency, referenceId, 'PENDING', { paypalOrderId: result.order.id });

      const approvalUrl = result.order.links.find(link => link.rel === 'approve')?.href;
      return NextResponse.json({
        success: true,
        orderId: referenceId,
        paypalOrderId: result.order.id,
        approvalUrl,
        kausAmount: pkg.kausAmount,
        bonusAmount,
        totalKaus,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported payment method' }, { status: 400 });
  } catch (error) {
    console.error('[KAUS Buy] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    packages: PURCHASE_PACKAGES,
    rates: { KRW: 120, USD: 0.09 },
  });
}
