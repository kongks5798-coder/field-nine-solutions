/**
 * K-UNIVERSAL Virtual Card System
 * Generate virtual card tokens for domestic merchant payments
 */

import { supabase } from '@/lib/supabase/client';

export interface VirtualCard {
  id: string;
  walletId: string;
  cardNumber: string; // Masked: **** **** **** 1234
  cardNumberHash: string; // Full card number (encrypted)
  cvv: string; // Encrypted
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'expired';
  createdAt: string;
}

export interface CreateVirtualCardParams {
  userId: string;
  cardholderName: string;
  initialBalance: number;
  currency: string;
}

/**
 * Generate a virtual card number (16 digits)
 * Production: Use Stripe Issuing or Marqeta API
 */
function generateCardNumber(): string {
  // Generate 15 random digits
  const randomDigits = Array.from({ length: 15 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  // Add Luhn check digit
  const checkDigit = calculateLuhnCheckDigit(randomDigits);
  
  return `5${randomDigits}${checkDigit}`; // Starts with 5 (Mastercard BIN)
}

/**
 * Luhn algorithm for credit card validation
 */
function calculateLuhnCheckDigit(cardNumber: string): number {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Generate CVV (3 digits)
 */
function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Generate expiry date (3 years from now)
 */
function generateExpiry(): { month: string; year: string } {
  const now = new Date();
  const expiryDate = new Date(now.setFullYear(now.getFullYear() + 3));
  
  return {
    month: (expiryDate.getMonth() + 1).toString().padStart(2, '0'),
    year: expiryDate.getFullYear().toString().slice(-2),
  };
}

/**
 * Simple encryption for demo (production: use AWS KMS or Vault)
 */
function encryptData(data: string, key: string): string {
  // Base64 encode for demo (NOT secure for production)
  return Buffer.from(data + key).toString('base64');
}

function decryptData(encrypted: string, key: string): string {
  // Base64 decode for demo
  return Buffer.from(encrypted, 'base64').toString().replace(key, '');
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string): string {
  return `**** **** **** ${cardNumber.slice(-4)}`;
}

/**
 * Create a new virtual card
 */
export async function createVirtualCard(
  params: CreateVirtualCardParams
): Promise<{ success: boolean; card?: VirtualCard; error?: string }> {
  try {
    // 1. Get user's wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, user_id, balance')
      .eq('user_id', params.userId)
      .single();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    // 2. Generate card details
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const expiry = generateExpiry();

    // 3. Encrypt sensitive data
    const encryptionKey = process.env.CARD_ENCRYPTION_KEY || 'demo-key';
    const cardNumberHash = encryptData(cardNumber, encryptionKey);
    const cvvHash = encryptData(cvv, encryptionKey);

    // 4. Store in database (you'll need to add virtual_cards table to schema)
    const virtualCard: Omit<VirtualCard, 'id' | 'createdAt'> = {
      walletId: wallet.id,
      cardNumber: maskCardNumber(cardNumber),
      cardNumberHash,
      cvv: cvvHash,
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cardholderName: params.cardholderName,
      balance: params.initialBalance,
      currency: params.currency,
      status: 'active',
    };

    // Production: Insert into virtual_cards table
    // For now, return the generated card
    return {
      success: true,
      card: {
        ...virtualCard,
        id: Math.random().toString(36).substring(2, 18),
        createdAt: new Date().toISOString(),
      } as VirtualCard,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Card creation failed',
    };
  }
}

/**
 * Process a payment with virtual card
 */
export async function processVirtualCardPayment(params: {
  cardId: string;
  amount: number;
  merchantName: string;
  merchantId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Production: Integrate with payment gateway (KG Inicis, Toss Payments, etc.)
    
    // For demo: Simple balance check and deduction
    // const card = await getVirtualCard(params.cardId);
    
    // if (!card || card.balance < params.amount) {
    //   return { success: false, error: 'Insufficient balance' };
    // }

    // Deduct balance and create transaction record
    const transactionId = Math.random().toString(36).substring(2, 18);

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
}

/**
 * Freeze/unfreeze virtual card
 */
export async function toggleCardStatus(
  cardId: string,
  status: 'active' | 'frozen'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Production: Update virtual_cards table
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Status update failed',
    };
  }
}
