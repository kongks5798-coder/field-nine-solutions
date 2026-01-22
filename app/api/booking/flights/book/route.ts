/**
 * Flight Booking Confirmation API
 * Production-grade booking with security
 *
 * POST /api/booking/flights/book
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDuffelClient, DuffelPassenger } from '@/lib/travel/duffel';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateBookingRevenue } from '@/lib/pricing/markup-engine';
import {
  apiGuard,
  FLIGHT_BOOKING_RULES,
  validateInput,
  PASSENGER_RULES,
  errorResponse,
} from '@/lib/security/api-guard';

export const runtime = 'nodejs';

interface BookingRequest {
  offerId: string;
  passengers: Array<{
    type: 'adult' | 'child' | 'infant_without_seat';
    title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    gender: 'm' | 'f';
    email: string;
    phone: string;
    passport?: {
      number: string;
      issuingCountry: string;
      expiresOn: string;
    };
  }>;
  contactInfo: {
    email: string;
    phone: string;
  };
  paymentMethod: 'wallet' | 'card';
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // Security: Auth + Rate Limit + Validation
    // ========================================
    const guard = await apiGuard(request, {
      requireAuth: true,
      rateLimit: { maxRequests: 10, windowMs: 60000 }, // 10 bookings per minute
      validationRules: FLIGHT_BOOKING_RULES,
    });

    if (!guard.passed) {
      return guard.response;
    }

    const { user, body } = guard;
    const bookingData = body as unknown as BookingRequest;

    // Validate passengers
    if (!bookingData.passengers || bookingData.passengers.length === 0) {
      return errorResponse('At least one passenger is required');
    }

    for (let i = 0; i < bookingData.passengers.length; i++) {
      const passenger = bookingData.passengers[i];
      const validation = validateInput(
        {
          givenName: passenger.givenName,
          familyName: passenger.familyName,
          email: passenger.email,
          phone: passenger.phone,
          dateOfBirth: passenger.dateOfBirth,
        },
        PASSENGER_RULES
      );

      if (!validation.valid) {
        return errorResponse(`Passenger ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }

    // Use authenticated user ID instead of body userId
    const userId = user?.id || 'demo-user';

    // ========================================
    // Business Logic
    // ========================================
    const duffel = getDuffelClient();

    // Demo mode when API not configured
    if (!duffel.isConfigured) {
      const demoBooking = {
        id: `demo_${Date.now()}`,
        confirmationNumber: `KUNIV${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed',
        passengers: bookingData.passengers,
        totalAmount: '299.25',
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };

      // Still record in database for demo
      try {
        await supabaseAdmin.from('bookings').insert({
          user_id: userId,
          booking_type: 'flight',
          provider: 'demo',
          provider_booking_id: demoBooking.id,
          confirmation_number: demoBooking.confirmationNumber,
          status: 'confirmed',
          total_amount: 299.25,
          currency: 'USD',
          booking_data: demoBooking,
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.warn('Demo booking DB save failed:', dbError);
      }

      return NextResponse.json({
        success: true,
        booking: demoBooking,
        source: 'demo',
        note: 'Demo booking created. Configure DUFFEL_API_KEY for live bookings.',
      });
    }

    // ========================================
    // Live Booking Flow
    // ========================================

    // Step 1: Get offer details and verify availability
    const offerResult = await duffel.getOffer(bookingData.offerId);
    if (!offerResult.success || !offerResult.offer) {
      return errorResponse('Flight offer not found or expired. Please search again.', 404);
    }

    const totalAmount = parseFloat(offerResult.offer.total_amount);

    // Step 2: Verify wallet balance if paying with wallet
    if (bookingData.paymentMethod === 'wallet') {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return errorResponse('Wallet not found. Please set up your wallet first.', 404);
      }

      if (wallet.balance < totalAmount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient wallet balance',
            required: totalAmount,
            available: wallet.balance,
          },
          { status: 400 }
        );
      }
    }

    // Step 3: Format passengers for Duffel
    const duffelPassengers: DuffelPassenger[] = bookingData.passengers.map((p) => ({
      type: p.type,
      title: p.title,
      given_name: p.givenName,
      family_name: p.familyName,
      born_on: p.dateOfBirth,
      gender: p.gender,
      email: p.email,
      phone_number: p.phone,
      ...(p.passport && {
        identity_documents: [
          {
            type: 'passport' as const,
            unique_identifier: p.passport.number,
            issuing_country_code: p.passport.issuingCountry,
            expires_on: p.passport.expiresOn,
          },
        ],
      }),
    }));

    // Step 4: Create booking order
    const orderResult = await duffel.createOrder({
      selectedOffers: [bookingData.offerId],
      passengers: duffelPassengers,
      metadata: {
        userId,
        platform: 'k-universal',
        ...bookingData.metadata,
      },
    });

    if (!orderResult.success || !orderResult.order) {
      return errorResponse(orderResult.error || 'Booking failed. Please try again.', 500);
    }

    const order = orderResult.order;

    // Step 5: Process payment
    if (bookingData.paymentMethod === 'wallet') {
      const orderAmount = parseFloat(order.total_amount);

      // Deduct from wallet (atomic operation)
      const { error: deductError } = await supabaseAdmin.rpc('deduct_wallet_balance', {
        p_user_id: userId,
        p_amount: orderAmount,
      });

      if (deductError) {
        // Payment failed - need to cancel the order
        console.error('Wallet deduction failed:', deductError);
        await duffel.cancelOrder(order.id);
        return errorResponse('Payment failed. Booking has been cancelled.', 500);
      }

      // Record transaction
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'payment',
        amount: -orderAmount,
        currency: order.total_currency,
        status: 'completed',
        description: `Flight booking: ${order.booking_reference}`,
        merchant_name: 'K-Universal Flights',
        merchant_category: 'travel',
        reference_id: order.id,
      });
    }

    // Step 6: Store booking record
    await supabaseAdmin.from('bookings').insert({
      user_id: userId,
      booking_type: 'flight',
      provider: 'duffel',
      provider_booking_id: order.id,
      confirmation_number: order.booking_reference,
      status: 'confirmed',
      total_amount: parseFloat(order.total_amount),
      currency: order.total_currency,
      booking_data: order,
      created_at: new Date().toISOString(),
    });

    // Step 7: Calculate revenue
    const revenue = calculateBookingRevenue(
      order.id,
      'flights',
      parseFloat(order.base_amount),
      parseFloat(order.total_amount),
      order.total_currency
    );

    return NextResponse.json({
      success: true,
      booking: {
        id: order.id,
        confirmationNumber: order.booking_reference,
        status: 'confirmed',
        passengers: order.passengers,
        totalAmount: order.total_amount,
        currency: order.total_currency,
        createdAt: order.created_at,
        documents: order.documents,
      },
      revenue: {
        markup: revenue.markup,
        percentage: revenue.markupPercentage.toFixed(2) + '%',
      },
      source: duffel.isTestMode ? 'duffel_test' : 'duffel_live',
    });
  } catch (error) {
    console.error('Flight booking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
