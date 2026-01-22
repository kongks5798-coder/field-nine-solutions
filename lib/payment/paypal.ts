/**
 * PayPal Payment Integration
 * Production-grade PayPal REST API client
 */

// ============================================
// Types
// ============================================

export interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  payer?: {
    name?: {
      given_name: string;
      surname: string;
    };
    email_address?: string;
    payer_id?: string;
  };
  create_time: string;
  update_time?: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResult {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  payment_source: {
    paypal?: {
      email_address: string;
      account_id: string;
      name: {
        given_name: string;
        surname: string;
      };
    };
  };
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        seller_protection: {
          status: string;
        };
        create_time: string;
      }>;
    };
  }>;
  payer: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
}

export interface CreateOrderParams {
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
  returnUrl?: string;
  cancelUrl?: string;
}

// ============================================
// PayPal Client
// ============================================

class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

    // Use sandbox for development, live for production
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    this.baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  get isSandbox(): boolean {
    return this.baseUrl.includes('sandbox');
  }

  /**
   * Get access token for API calls
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal auth error:', error);
      throw new Error('Failed to authenticate with PayPal');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken!;
  }

  /**
   * Create a PayPal order
   */
  async createOrder(params: CreateOrderParams): Promise<{
    success: boolean;
    order?: PayPalOrder;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'PayPal is not configured' };
    }

    try {
      const token = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.referenceId,
            description: params.description,
            amount: {
              currency_code: params.currency,
              value: params.amount.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'K-Universal',
              locale: 'en-US',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paypal/success`,
              cancel_url: params.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paypal/cancel`,
            },
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `${params.referenceId}-${Date.now()}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('PayPal create order error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create PayPal order',
        };
      }

      const order: PayPalOrder = await response.json();
      return { success: true, order };
    } catch (error) {
      console.error('PayPal createOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  /**
   * Capture payment for an approved order
   */
  async captureOrder(orderId: string): Promise<{
    success: boolean;
    capture?: PayPalCaptureResult;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'PayPal is not configured' };
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('PayPal capture error:', error);
        return {
          success: false,
          error: error.message || 'Failed to capture payment',
        };
      }

      const capture: PayPalCaptureResult = await response.json();

      if (capture.status !== 'COMPLETED') {
        return {
          success: false,
          error: `Payment not completed. Status: ${capture.status}`,
        };
      }

      return { success: true, capture };
    } catch (error) {
      console.error('PayPal captureOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment',
      };
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<{
    success: boolean;
    order?: PayPalOrder;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'PayPal is not configured' };
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to get order',
        };
      }

      const order: PayPalOrder = await response.json();
      return { success: true, order };
    } catch (error) {
      console.error('PayPal getOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order',
      };
    }
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(
    captureId: string,
    amount?: { value: string; currency_code: string },
    reason?: string
  ): Promise<{
    success: boolean;
    refund?: {
      id: string;
      status: string;
      amount: { value: string; currency_code: string };
    };
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'PayPal is not configured' };
    }

    try {
      const token = await this.getAccessToken();

      const refundData: Record<string, unknown> = {};
      if (amount) {
        refundData.amount = amount;
      }
      if (reason) {
        refundData.note_to_payer = reason;
      }

      const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to refund payment',
        };
      }

      const refund = await response.json();
      return {
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
        },
      };
    } catch (error) {
      console.error('PayPal refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund payment',
      };
    }
  }
}

// Singleton instance
let paypalClient: PayPalClient | null = null;

export function getPayPalClient(): PayPalClient {
  if (!paypalClient) {
    paypalClient = new PayPalClient();
  }
  return paypalClient;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get PayPal Client ID for frontend
 */
export function getPayPalClientId(): string {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '';
}

/**
 * Check if PayPal is in sandbox mode
 */
export function isPayPalSandbox(): boolean {
  return (process.env.PAYPAL_MODE || 'sandbox') === 'sandbox';
}
