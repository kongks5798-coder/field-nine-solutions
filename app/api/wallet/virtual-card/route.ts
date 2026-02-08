/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: VIRTUAL CARD API (Production Enhanced)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Full virtual card management with database persistence
 * - Create cards with spending limits
 * - List user's cards
 * - Freeze/unfreeze cards
 * - Top up balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createVirtualCard, maskCardNumber } from '@/lib/wallet/virtual-card';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const runtime = 'nodejs';

// ============================================
// GET: List User's Virtual Cards
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const cardId = searchParams.get('cardId');

    switch (action) {
      // ========================================
      // List all cards
      // ========================================
      case 'list': {
        const { data: cards, error } = await supabase
          .from('virtual_cards')
          .select(`
            id,
            card_number_masked,
            expiry_month,
            expiry_year,
            cardholder_name,
            balance,
            currency,
            status,
            daily_limit,
            monthly_limit,
            daily_spent,
            monthly_spent,
            last_used_at,
            created_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Virtual Card API] List error:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to fetch cards' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          cards: cards || [],
          count: cards?.length || 0,
        });
      }

      // ========================================
      // Get single card details
      // ========================================
      case 'details': {
        if (!cardId) {
          return NextResponse.json(
            { success: false, error: 'Card ID required' },
            { status: 400 }
          );
        }

        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (error || !card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        // Log access
        await logAuditEvent({
          eventType: 'ACCESS',
          eventSubtype: 'VIEW',
          actorId: user.id,
          resourceType: 'card',
          resourceId: cardId,
          action: 'View virtual card details',
        });

        return NextResponse.json({
          success: true,
          card: {
            ...card,
            card_number_hash: undefined, // Never expose encrypted data
            cvv_hash: undefined,
          },
        });
      }

      // ========================================
      // Get card transactions
      // ========================================
      case 'transactions': {
        if (!cardId) {
          return NextResponse.json(
            { success: false, error: 'Card ID required' },
            { status: 400 }
          );
        }

        // Verify ownership
        const { data: card } = await supabase
          .from('virtual_cards')
          .select('id')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (!card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        const limit = parseInt(searchParams.get('limit') || '50');
        const { data: transactions, error } = await supabase
          .from('virtual_card_transactions')
          .select('*')
          .eq('card_id', cardId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          transactions: transactions || [],
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Virtual Card API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Card Operations
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ========================================
      // Create new virtual card
      // ========================================
      case 'create': {
        const { cardholderName, initialBalance, currency, dailyLimit, monthlyLimit } = body;

        if (!cardholderName) {
          return NextResponse.json(
            { success: false, error: 'Cardholder name required' },
            { status: 400 }
          );
        }

        // Check user's existing card count (limit to 5)
        const { count: existingCards } = await supabase
          .from('virtual_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        if ((existingCards || 0) >= 5) {
          return NextResponse.json(
            { success: false, error: 'Maximum 5 active cards allowed' },
            { status: 400 }
          );
        }

        // Create card using existing function
        const result = await createVirtualCard({
          userId: user.id,
          cardholderName,
          initialBalance: initialBalance || 0,
          currency: currency || 'KRW',
        });

        if (!result.success || !result.card) {
          return NextResponse.json(
            { success: false, error: result.error || 'Card creation failed' },
            { status: 500 }
          );
        }

        // Store in database
        const { data: newCard, error } = await supabase
          .from('virtual_cards')
          .insert({
            user_id: user.id,
            wallet_id: result.card.walletId,
            card_number_masked: result.card.cardNumber,
            card_number_hash: result.card.cardNumberHash,
            cvv_hash: result.card.cvv,
            expiry_month: result.card.expiryMonth,
            expiry_year: result.card.expiryYear,
            cardholder_name: cardholderName,
            balance: initialBalance || 0,
            currency: currency || 'KRW',
            status: 'active',
            daily_limit: dailyLimit || 5000000,
            monthly_limit: monthlyLimit || 50000000,
          })
          .select()
          .single();

        if (error) {
          console.error('[Virtual Card API] Insert error:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to save card' },
            { status: 500 }
          );
        }

        // Log audit event
        await logAuditEvent({
          eventType: 'DATA_CHANGE',
          eventSubtype: 'CREATE',
          actorId: user.id,
          resourceType: 'card',
          resourceId: newCard.id,
          action: 'Create virtual card',
          details: { cardholderName, initialBalance },
        });

        return NextResponse.json({
          success: true,
          card: {
            ...newCard,
            card_number_hash: undefined,
            cvv_hash: undefined,
          },
          message: 'Virtual card created successfully',
        });
      }

      // ========================================
      // Freeze/Unfreeze card
      // ========================================
      case 'toggle-status': {
        const { cardId, status } = body;

        if (!cardId || !['active', 'frozen'].includes(status)) {
          return NextResponse.json(
            { success: false, error: 'Card ID and valid status required' },
            { status: 400 }
          );
        }

        // Verify ownership
        const { data: card } = await supabase
          .from('virtual_cards')
          .select('id, status')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (!card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        const { error } = await supabase
          .from('virtual_cards')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', cardId);

        if (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to update card status' },
            { status: 500 }
          );
        }

        // Log audit event
        await logAuditEvent({
          eventType: 'DATA_CHANGE',
          eventSubtype: 'UPDATE',
          actorId: user.id,
          resourceType: 'card',
          resourceId: cardId,
          action: `${status === 'frozen' ? 'Freeze' : 'Unfreeze'} virtual card`,
          beforeState: { status: card.status },
          afterState: { status },
        });

        return NextResponse.json({
          success: true,
          message: `Card ${status === 'frozen' ? 'frozen' : 'activated'} successfully`,
        });
      }

      // ========================================
      // Top up card balance
      // ========================================
      case 'topup': {
        const { cardId, amount } = body;

        if (!cardId || !amount || amount <= 0) {
          return NextResponse.json(
            { success: false, error: 'Card ID and positive amount required' },
            { status: 400 }
          );
        }

        // Verify ownership and get current balance
        const { data: card } = await supabase
          .from('virtual_cards')
          .select('id, balance, status')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (!card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        if (card.status !== 'active') {
          return NextResponse.json(
            { success: false, error: 'Cannot top up inactive card' },
            { status: 400 }
          );
        }

        // Create topup transaction
        const { error: txError } = await supabase
          .from('virtual_card_transactions')
          .insert({
            card_id: cardId,
            transaction_type: 'topup',
            amount,
            currency: 'KRW',
            status: 'completed',
            processed_at: new Date().toISOString(),
          });

        if (txError) {
          return NextResponse.json(
            { success: false, error: 'Failed to process top up' },
            { status: 500 }
          );
        }

        // Note: Balance update is handled by trigger

        return NextResponse.json({
          success: true,
          message: `Card topped up with ${amount.toLocaleString()} KRW`,
          newBalance: (card.balance || 0) + amount,
        });
      }

      // ========================================
      // Update spending limits
      // ========================================
      case 'update-limits': {
        const { cardId, dailyLimit, monthlyLimit } = body;

        if (!cardId) {
          return NextResponse.json(
            { success: false, error: 'Card ID required' },
            { status: 400 }
          );
        }

        // Verify ownership
        const { data: card } = await supabase
          .from('virtual_cards')
          .select('id')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (!card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        const updates: Record<string, number | string> = { updated_at: new Date().toISOString() };
        if (dailyLimit !== undefined) updates.daily_limit = dailyLimit;
        if (monthlyLimit !== undefined) updates.monthly_limit = monthlyLimit;

        const { error } = await supabase
          .from('virtual_cards')
          .update(updates)
          .eq('id', cardId);

        if (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to update limits' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Spending limits updated',
        });
      }

      // ========================================
      // Cancel card
      // ========================================
      case 'cancel': {
        const { cardId } = body;

        if (!cardId) {
          return NextResponse.json(
            { success: false, error: 'Card ID required' },
            { status: 400 }
          );
        }

        // Verify ownership
        const { data: card } = await supabase
          .from('virtual_cards')
          .select('id, balance')
          .eq('id', cardId)
          .eq('user_id', user.id)
          .single();

        if (!card) {
          return NextResponse.json(
            { success: false, error: 'Card not found' },
            { status: 404 }
          );
        }

        if ((card.balance || 0) > 0) {
          return NextResponse.json(
            { success: false, error: 'Please withdraw remaining balance before cancelling' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('virtual_cards')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', cardId);

        if (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to cancel card' },
            { status: 500 }
          );
        }

        // Log audit event
        await logAuditEvent({
          eventType: 'DATA_CHANGE',
          eventSubtype: 'DELETE',
          actorId: user.id,
          resourceType: 'card',
          resourceId: cardId,
          action: 'Cancel virtual card',
        });

        return NextResponse.json({
          success: true,
          message: 'Card cancelled successfully',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['create', 'toggle-status', 'topup', 'update-limits', 'cancel'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Virtual Card API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
