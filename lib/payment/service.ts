/**
 * K-UNIVERSAL Unified Payment Service
 * Production-grade payment processing with Supabase integration
 *
 * Supported providers:
 * - Toss Payments (Korea)
 * - PayPal (International)
 *
 * @module lib/payment/service
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { logger, auditLog, paymentLogger } from '@/lib/logging/logger';
import {
  withIdempotency,
  generateIdempotencyKey,
  type IdempotentRequestContext,
} from './idempotency';
import { confirmPayment as confirmTossPayment, cancelPayment as cancelTossPayment } from '@/lib/toss/client';
import { getPayPalClient } from './paypal';

// ============================================
// Types
// ============================================

export type PaymentProvider = 'toss' | 'paypal' | 'wallet';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type BookingStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'refunded' | 'completed' | 'failed';

export interface PaymentRequest {
  userId: string;
  bookingId?: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  // Provider-specific fields
  toss?: {
    paymentKey: string;
    orderId: string;
  };
  paypal?: {
    orderId: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  providerPaymentId?: string;
  status?: PaymentStatus;
  error?: string;
  errorCode?: string;
}

export interface BookingPaymentRequest {
  userId: string;
  bookingType: 'flight' | 'hotel' | 'package';
  provider: PaymentProvider;
  amount: number;
  currency: string;
  details: Record<string, unknown>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  idempotencyKey?: string;
  // Provider-specific
  toss?: {
    paymentKey: string;
    orderId: string;
  };
  paypal?: {
    orderId: string;
  };
}

export interface BookingPaymentResult {
  success: boolean;
  bookingId?: string;
  paymentId?: string;
  confirmationNumber?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  error?: string;
}

// ============================================
// Payment Service Class
// ============================================

class PaymentService {
  /**
   * Process Toss payment confirmation
   */
  async confirmTossPayment(
    userId: string,
    paymentKey: string,
    orderId: string,
    amount: number,
    bookingId?: string,
    idempotencyKey?: string
  ): Promise<PaymentResult> {
    const key = idempotencyKey || generateIdempotencyKey('toss');
    const requestPath = '/api/payment/toss/confirm';

    return withIdempotency(
      key,
      userId,
      requestPath,
      'POST',
      { paymentKey, orderId, amount },
      async (ctx: IdempotentRequestContext) => {
        paymentLogger.info('toss_payment_confirm_start', {
          userId,
          orderId,
          amount,
          idempotencyKey: ctx.idempotencyKey,
          isRetry: ctx.isRetry,
        });

        // Call Toss API
        const result = await confirmTossPayment({
          paymentKey,
          orderId,
          amount,
        });

        if (!result.success) {
          await ctx.fail(result.error || 'Toss payment failed');
          return {
            success: false,
            error: result.error,
          };
        }

        // Create payment record in database
        const paymentRecord = await this.createPaymentRecord({
          userId,
          bookingId,
          provider: 'toss',
          providerPaymentId: paymentKey,
          providerOrderId: orderId,
          amount,
          currency: 'KRW',
          status: 'completed',
          method: result.method,
          metadata: {
            toss_status: result.status,
            toss_total_amount: result.totalAmount,
          },
        });

        // Update booking if linked
        if (bookingId) {
          await this.updateBookingPayment(bookingId, paymentRecord.id, 'confirmed');
        }

        await ctx.complete(200, {
          success: true,
          paymentId: paymentRecord.id,
          providerPaymentId: paymentKey,
          status: 'completed',
        });

        // Audit log
        auditLog({
          action: 'payment_completed',
          actor: { userId },
          resource: { type: 'payment', id: paymentRecord.id },
          result: 'success',
          details: { provider: 'toss', amount, orderId },
        });

        return {
          success: true,
          paymentId: paymentRecord.id,
          providerPaymentId: paymentKey,
          status: 'completed' as PaymentStatus,
        };
      }
    ).then((result) => {
      if (result.cached) {
        paymentLogger.info('toss_payment_returned_cached', { userId, orderId });
      }
      return result.data || { success: false, error: result.error };
    });
  }

  /**
   * Process PayPal payment capture
   */
  async capturePayPalPayment(
    userId: string,
    paypalOrderId: string,
    bookingId?: string,
    idempotencyKey?: string
  ): Promise<PaymentResult> {
    const key = idempotencyKey || generateIdempotencyKey('paypal');
    const requestPath = '/api/payment/paypal/capture-order';

    return withIdempotency(
      key,
      userId,
      requestPath,
      'POST',
      { orderId: paypalOrderId },
      async (ctx: IdempotentRequestContext) => {
        paymentLogger.info('paypal_payment_capture_start', {
          userId,
          paypalOrderId,
          idempotencyKey: ctx.idempotencyKey,
          isRetry: ctx.isRetry,
        });

        const paypal = getPayPalClient();

        if (!paypal.isConfigured) {
          await ctx.fail('PayPal not configured');
          return { success: false, error: 'PayPal not configured' };
        }

        const result = await paypal.captureOrder(paypalOrderId);

        if (!result.success || !result.capture) {
          await ctx.fail(result.error || 'PayPal capture failed');
          return { success: false, error: result.error };
        }

        const capture = result.capture;
        const captureDetails = capture.purchase_units[0]?.payments?.captures[0];

        if (!captureDetails) {
          await ctx.fail('No capture details');
          return { success: false, error: 'No capture details found' };
        }

        // Create payment record
        const paymentRecord = await this.createPaymentRecord({
          userId,
          bookingId,
          provider: 'paypal',
          providerPaymentId: captureDetails.id,
          providerOrderId: paypalOrderId,
          amount: parseFloat(captureDetails.amount.value),
          currency: captureDetails.amount.currency_code,
          status: 'completed',
          payerEmail: capture.payer?.email_address,
          payerName: capture.payer?.name
            ? `${capture.payer.name.given_name} ${capture.payer.name.surname}`
            : undefined,
          metadata: {
            paypal_payer_id: capture.payer?.payer_id,
            seller_protection: captureDetails.seller_protection?.status,
          },
        });

        // Update booking if linked
        if (bookingId) {
          await this.updateBookingPayment(bookingId, paymentRecord.id, 'confirmed');
        }

        await ctx.complete(200, {
          success: true,
          paymentId: paymentRecord.id,
          providerPaymentId: captureDetails.id,
          status: 'completed',
        });

        auditLog({
          action: 'payment_completed',
          actor: { userId },
          resource: { type: 'payment', id: paymentRecord.id },
          result: 'success',
          details: { provider: 'paypal', amount: captureDetails.amount.value },
        });

        return {
          success: true,
          paymentId: paymentRecord.id,
          providerPaymentId: captureDetails.id,
          status: 'completed' as PaymentStatus,
        };
      }
    ).then((result) => {
      if (result.cached) {
        paymentLogger.info('paypal_payment_returned_cached', { userId, paypalOrderId });
      }
      return result.data || { success: false, error: result.error };
    });
  }

  /**
   * Cancel/Refund Toss payment
   */
  async cancelTossPaymentByKey(
    userId: string,
    paymentKey: string,
    reason: string
  ): Promise<PaymentResult> {
    paymentLogger.info('toss_payment_cancel_start', { userId, paymentKey, reason });

    const result = await cancelTossPayment(paymentKey, reason);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'cancelled',
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq('provider_payment_id', paymentKey);

    if (updateError) {
      paymentLogger.warn('toss_payment_record_update_failed', {
        paymentKey,
        error: updateError.message,
      });
    }

    auditLog({
      action: 'payment_cancelled',
      actor: { userId },
      resource: { type: 'payment', id: paymentKey },
      result: 'success',
      details: { provider: 'toss', reason },
    });

    return {
      success: true,
      providerPaymentId: paymentKey,
      status: 'cancelled',
    };
  }

  /**
   * Create booking with payment
   */
  async createBookingWithPayment(
    request: BookingPaymentRequest
  ): Promise<BookingPaymentResult> {
    const idempotencyKey = request.idempotencyKey || generateIdempotencyKey('booking');

    return withIdempotency(
      idempotencyKey,
      request.userId,
      '/api/bookings',
      'POST',
      request,
      async (ctx: IdempotentRequestContext) => {
        paymentLogger.info('booking_with_payment_start', {
          userId: request.userId,
          bookingType: request.bookingType,
          provider: request.provider,
          amount: request.amount,
          isRetry: ctx.isRetry,
        });

        // 1. Create booking record (pending_payment)
        const booking = await this.createBookingRecord({
          userId: request.userId,
          bookingType: request.bookingType,
          details: request.details,
          amount: request.amount,
          currency: request.currency,
          contactName: request.contactName,
          contactEmail: request.contactEmail,
          contactPhone: request.contactPhone,
        });

        // 2. Process payment based on provider
        let paymentResult: PaymentResult;

        try {
          if (request.provider === 'toss' && request.toss) {
            paymentResult = await this.confirmTossPayment(
              request.userId,
              request.toss.paymentKey,
              request.toss.orderId,
              request.amount,
              booking.id
            );
          } else if (request.provider === 'paypal' && request.paypal) {
            paymentResult = await this.capturePayPalPayment(
              request.userId,
              request.paypal.orderId,
              booking.id
            );
          } else {
            throw new Error(`Unsupported payment provider: ${request.provider}`);
          }

          if (!paymentResult.success) {
            // Payment failed - update booking status
            await this.updateBookingStatus(booking.id, 'failed');
            await ctx.fail(paymentResult.error || 'Payment failed');
            return {
              success: false,
              bookingId: booking.id,
              error: paymentResult.error,
            };
          }
        } catch (paymentError) {
          // Rollback booking on payment error
          await this.updateBookingStatus(booking.id, 'failed');
          await ctx.fail(paymentError instanceof Error ? paymentError.message : 'Payment error');
          throw paymentError;
        }

        // 3. Generate confirmation number
        const confirmationNumber = this.generateConfirmationNumber(request.bookingType);
        await supabaseAdmin
          .from('bookings')
          .update({ confirmation_number: confirmationNumber })
          .eq('id', booking.id);

        await ctx.complete(200, {
          success: true,
          bookingId: booking.id,
          paymentId: paymentResult.paymentId,
          confirmationNumber,
          status: 'confirmed',
          paymentStatus: 'completed',
        });

        return {
          success: true,
          bookingId: booking.id,
          paymentId: paymentResult.paymentId,
          confirmationNumber,
          status: 'confirmed' as BookingStatus,
          paymentStatus: 'completed' as PaymentStatus,
        };
      }
    ).then((result) => {
      return result.data || { success: false, error: result.error };
    });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async createPaymentRecord(data: {
    userId: string;
    bookingId?: string;
    provider: PaymentProvider;
    providerPaymentId?: string;
    providerOrderId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method?: string;
    payerEmail?: string;
    payerName?: string;
    cardLastFour?: string;
    cardBrand?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: data.userId,
        booking_id: data.bookingId,
        payment_provider: data.provider,
        provider_payment_id: data.providerPaymentId,
        provider_order_id: data.providerOrderId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        payment_method: data.method,
        payer_email: data.payerEmail,
        payer_name: data.payerName,
        card_last_four: data.cardLastFour,
        card_brand: data.cardBrand,
        metadata: data.metadata,
        completed_at: data.status === 'completed' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('payment_record_create_failed', { error: error.message, userId: data.userId });
      throw error;
    }

    return payment!;
  }

  private async createBookingRecord(data: {
    userId: string;
    bookingType: 'flight' | 'hotel' | 'package';
    details: Record<string, unknown>;
    amount: number;
    currency: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<{ id: string }> {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: data.userId,
        booking_type: data.bookingType,
        status: 'pending_payment',
        payment_status: 'pending',
        details: data.details,
        base_price: data.amount,
        total_price: data.amount,
        currency: data.currency,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('booking_record_create_failed', { error: error.message, userId: data.userId });
      throw error;
    }

    return booking!;
  }

  private async updateBookingPayment(
    bookingId: string,
    paymentId: string,
    status: BookingStatus
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        status,
        payment_status: 'paid',
        payment_reference: paymentId,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      logger.error('booking_payment_update_failed', {
        bookingId,
        paymentId,
        error: error.message,
      });
    }
  }

  private async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      logger.error('booking_status_update_failed', { bookingId, status, error: error.message });
    }
  }

  private generateConfirmationNumber(bookingType: string): string {
    const prefix = bookingType === 'flight' ? 'FL' : bookingType === 'hotel' ? 'HT' : 'PK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string, userId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('get_payment_failed', { paymentId, error: error.message });
      return null;
    }

    return data;
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(
    userId: string,
    options: { limit?: number; offset?: number; status?: PaymentStatus } = {}
  ): Promise<Record<string, unknown>[]> {
    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('get_user_payments_failed', { userId, error: error.message });
      return [];
    }

    return data || [];
  }
}

// Singleton instance
let paymentService: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentService) {
    paymentService = new PaymentService();
  }
  return paymentService;
}

// Export for direct use
export const paymentServiceInstance = getPaymentService();
