'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  amount: number;
  currency: string;
  description: string;
  bookingType: 'flight' | 'hotel';
  bookingId: string;
  onSuccess: (captureData: {
    captureId: string;
    status: string;
    payer?: { email?: string; name?: string };
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: {
          layout?: 'vertical' | 'horizontal';
          color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
          shape?: 'rect' | 'pill';
          label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
          height?: number;
        };
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (err: Error) => void;
      }) => {
        render: (container: HTMLElement) => Promise<void>;
      };
    };
  }
}

export default function PayPalButton({
  amount,
  currency,
  description,
  bookingType,
  bookingId,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);

  // Load PayPal SDK
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (window.paypal) {
      setSdkReady(true);
      setIsLoading(false);
      return;
    }

    // Load SDK script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;

    script.onload = () => {
      setSdkReady(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
    };
  }, [currency]);

  // Render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current || disabled) {
      return;
    }

    // Clear previous buttons
    paypalRef.current.innerHTML = '';

    window.paypal
      .Buttons({
        style: {
          layout: 'horizontal',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 48,
        },

        // Create order
        createOrder: async () => {
          try {
            const response = await fetch('/api/payment/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount,
                currency,
                description,
                bookingType,
                bookingId,
              }),
            });

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Failed to create order');
            }

            return data.orderId;
          } catch (error) {
            console.error('Create order error:', error);
            onError(error instanceof Error ? error.message : 'Failed to create order');
            throw error;
          }
        },

        // Capture payment on approval
        onApprove: async (data: { orderID: string }) => {
          try {
            const response = await fetch('/api/payment/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                bookingType,
                bookingId,
              }),
            });

            const captureData = await response.json();

            if (!captureData.success) {
              throw new Error(captureData.error || 'Payment capture failed');
            }

            onSuccess({
              captureId: captureData.captureId,
              status: captureData.status,
              payer: captureData.payer,
            });
          } catch (error) {
            console.error('Capture error:', error);
            onError(error instanceof Error ? error.message : 'Payment failed');
          }
        },

        onCancel: () => {
          console.log('Payment cancelled');
          onCancel?.();
        },

        onError: (err: Error) => {
          console.error('PayPal error:', err);
          onError(err.message || 'Payment error occurred');
        },
      })
      .render(paypalRef.current)
      .catch((err: Error) => {
        console.error('PayPal render error:', err);
      });
  }, [sdkReady, amount, currency, description, bookingType, bookingId, onSuccess, onError, onCancel, disabled]);

  // No client ID configured
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-xl text-center text-gray-500 text-sm">
        PayPal is not configured
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#0070ba]" />
      </div>
    );
  }

  // Disabled state
  if (disabled) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-xl text-center text-gray-400">
        Complete previous steps first
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={paypalRef} className="paypal-button-container" />
    </div>
  );
}
