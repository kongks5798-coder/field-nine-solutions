/**
 * VRD 26SS - Stripe Payment API
 * Production-Grade Payment Processing
 *
 * Endpoints:
 * - POST: Create Payment Intent
 * - GET: Check Payment Status
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { calculateBundlePrice, getProductById, CartItem } from '@/lib/vrd/products';

export const runtime = 'nodejs';

// ============================================
// Configuration
// ============================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Stripe (lazy)
const getStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
};

// Initialize Supabase Admin (lazy)
const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
};

// ============================================
// Types
// ============================================

interface CreatePaymentRequest {
  items: CartItem[];
  currency: 'KRW' | 'USD';
  customer: {
    email: string;
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
    };
  };
  shippingMethod: 'standard' | 'express';
  metadata?: Record<string, string>;
}

interface VRDOrder {
  id: string;
  stripe_payment_intent_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  bundle_type: string;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
}

// ============================================
// POST - Create Payment Intent
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();

    // Validate request
    const validationError = validatePaymentRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Calculate order summary
    const orderSummary = calculateBundlePrice(body.items, body.currency);

    // Add shipping cost based on method
    if (body.shippingMethod === 'express') {
      const expressCost = body.currency === 'KRW' ? 5000 : 45;
      orderSummary.shippingCost = orderSummary.shippingCost > 0
        ? expressCost
        : 0; // Still free if over threshold
      orderSummary.total = orderSummary.subtotal - orderSummary.bundleDiscount + orderSummary.shippingCost + orderSummary.tax;
    }

    const stripe = getStripe();
    const supabase = getSupabase();

    // Create or retrieve Stripe customer
    let customerId: string;

    const existingCustomers = await stripe.customers.list({
      email: body.customer.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Update customer info
      await stripe.customers.update(customerId, {
        name: body.customer.name,
        phone: body.customer.phone,
        address: body.customer.address,
        shipping: {
          name: body.customer.name,
          phone: body.customer.phone,
          address: body.customer.address,
        },
      });
    } else {
      const customer = await stripe.customers.create({
        email: body.customer.email,
        name: body.customer.name,
        phone: body.customer.phone,
        address: body.customer.address,
        shipping: {
          name: body.customer.name,
          phone: body.customer.phone,
          address: body.customer.address,
        },
        metadata: {
          source: 'vrd_26ss',
        },
      });
      customerId = customer.id;
    }

    // Generate order ID
    const orderId = `VRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create line items description
    const lineItemsDescription = body.items
      .map(item => {
        const product = getProductById(item.productId);
        return product ? `${product.name} (${item.color}, ${item.size}) x${item.quantity}` : '';
      })
      .filter(Boolean)
      .join(', ');

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderSummary.total,
      currency: body.currency.toLowerCase(),
      customer: customerId,
      description: `VRD 26SS Order: ${orderId}`,
      metadata: {
        order_id: orderId,
        bundle_type: orderSummary.bundleType,
        discount_percent: String(getDiscountPercent(orderSummary.bundleType)),
        items_count: String(body.items.reduce((sum, i) => sum + i.quantity, 0)),
        line_items: lineItemsDescription.substring(0, 500), // Stripe metadata limit
        ...body.metadata,
      },
      receipt_email: body.customer.email,
      shipping: {
        name: body.customer.name,
        phone: body.customer.phone,
        address: body.customer.address,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create order record in database
    const orderData: Partial<VRDOrder> = {
      id: orderId,
      stripe_payment_intent_id: paymentIntent.id,
      customer_email: body.customer.email,
      customer_name: body.customer.name,
      customer_phone: body.customer.phone,
      shipping_address: JSON.stringify(body.customer.address),
      items: body.items,
      subtotal: orderSummary.subtotal,
      discount: orderSummary.bundleDiscount,
      bundle_type: orderSummary.bundleType,
      shipping_cost: orderSummary.shippingCost,
      tax: orderSummary.tax,
      total: orderSummary.total,
      currency: body.currency,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('vrd_orders')
      .insert(orderData);

    if (dbError) {
      console.error('[VRD Payment] Database error:', dbError);
      // Continue anyway - payment is more important
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: orderSummary.total,
        currency: body.currency,
        breakdown: {
          subtotal: orderSummary.subtotal,
          bundleDiscount: orderSummary.bundleDiscount,
          bundleType: orderSummary.bundleType,
          shippingCost: orderSummary.shippingCost,
          tax: orderSummary.tax,
          total: orderSummary.total,
        },
      },
    });
  } catch (error) {
    console.error('[VRD Payment] Error creating payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Check Payment Status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!orderId && !paymentIntentId) {
      return NextResponse.json(
        { error: 'orderId or paymentIntentId is required' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const supabase = getSupabase();

    let order: VRDOrder | null = null;

    // Fetch order from database
    if (orderId) {
      const { data, error } = await supabase
        .from('vrd_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      order = data as VRDOrder;
    } else if (paymentIntentId) {
      const { data, error } = await supabase
        .from('vrd_orders')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      order = data as VRDOrder;
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get payment intent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.stripe_payment_intent_id
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        paymentStatus: paymentIntent.status,
        amount: order.total,
        currency: order.currency,
        customerEmail: order.customer_email,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    console.error('[VRD Payment] Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function validatePaymentRequest(body: CreatePaymentRequest): string | null {
  if (!body.items || body.items.length === 0) {
    return 'No items in cart';
  }

  if (!body.currency || !['KRW', 'USD'].includes(body.currency)) {
    return 'Invalid currency';
  }

  if (!body.customer) {
    return 'Customer information is required';
  }

  if (!body.customer.email || !isValidEmail(body.customer.email)) {
    return 'Valid email is required';
  }

  if (!body.customer.name || body.customer.name.trim().length < 2) {
    return 'Valid name is required';
  }

  if (!body.customer.phone) {
    return 'Phone number is required';
  }

  if (!body.customer.address) {
    return 'Shipping address is required';
  }

  const { address } = body.customer;
  if (!address.line1 || !address.city || !address.postal_code || !address.country) {
    return 'Complete shipping address is required';
  }

  // Validate items
  for (const item of body.items) {
    const product = getProductById(item.productId);
    if (!product) {
      return `Product not found: ${item.productId}`;
    }
    if (item.quantity < 1 || item.quantity > 10) {
      return 'Invalid quantity (1-10 allowed)';
    }
  }

  return null;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getDiscountPercent(bundleType: string): number {
  const discounts: Record<string, number> = {
    single: 0,
    couple: 25,
    crew: 30,
    full_collection: 35,
  };
  return discounts[bundleType] || 0;
}
