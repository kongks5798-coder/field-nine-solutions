'use client';

/**
 * VRD 26SS - Checkout Component
 * Production-Grade with Real-time Bundle Pricing
 *
 * Features:
 * - Real-time bundle discount calculation
 * - Mobile-first thumb-friendly design
 * - Stripe Payment Element integration
 * - Order summary with live updates
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  VRD_PRODUCTS,
  BUNDLE_CONFIGS,
  calculateBundlePrice,
  formatPrice,
  getProductById,
  type CartItem,
  type ProductSize,
  type OrderSummary,
} from '@/lib/vrd/products';

// ============================================
// Stripe Initialization
// ============================================

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// ============================================
// Types
// ============================================

interface CheckoutProps {
  initialCart?: CartItem[];
  currency?: 'KRW' | 'USD';
  onOrderComplete?: (orderId: string) => void;
}

interface CustomerInfo {
  email: string;
  name: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';

// ============================================
// Main Component
// ============================================

export default function VRDCheckout({
  initialCart = [],
  currency = 'KRW',
  onOrderComplete,
}: CheckoutProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    name: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'KR',
    },
  });
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate order summary with bundle pricing
  const orderSummary = useMemo(() => {
    return calculateBundlePrice(cart, currency);
  }, [cart, currency]);

  // Get bundle info
  const bundleInfo = useMemo(() => {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    return BUNDLE_CONFIGS.find(
      b => totalQuantity >= b.minItems && totalQuantity <= b.maxItems
    ) || BUNDLE_CONFIGS[0];
  }, [cart]);

  // Next bundle info (for upsell)
  const nextBundleInfo = useMemo(() => {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const currentIndex = BUNDLE_CONFIGS.findIndex(
      b => totalQuantity >= b.minItems && totalQuantity <= b.maxItems
    );
    return currentIndex < BUNDLE_CONFIGS.length - 1
      ? BUNDLE_CONFIGS[currentIndex + 1]
      : null;
  }, [cart]);

  // Cart operations
  const addToCart = useCallback((productId: string, color: string, size: ProductSize) => {
    setCart(prev => {
      const existing = prev.find(
        item => item.productId === productId && item.color === color && item.size === size
      );
      if (existing) {
        return prev.map(item =>
          item === existing
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
            : item
        );
      }
      return [...prev, { productId, color, size, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity < 1) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else {
      setCart(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, quantity: Math.min(quantity, 10) } : item
        )
      );
    }
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Create payment intent
  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vrd/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          currency,
          customer: customerInfo,
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed');
      }

      setClientSecret(data.data.clientSecret);
      setOrderId(data.data.orderId);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate shipping info
  const isShippingValid = useMemo(() => {
    const { email, name, phone, address } = customerInfo;
    return (
      email.includes('@') &&
      name.trim().length >= 2 &&
      phone.trim().length >= 10 &&
      address.line1.trim().length > 0 &&
      address.city.trim().length > 0 &&
      address.postal_code.trim().length > 0
    );
  }, [customerInfo]);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Progress Bar */}
      <ProgressBar currentStep={step} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 'cart' && (
                <CartStep
                  cart={cart}
                  currency={currency}
                  orderSummary={orderSummary}
                  bundleInfo={bundleInfo}
                  nextBundleInfo={nextBundleInfo}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  addToCart={addToCart}
                  onContinue={() => setStep('shipping')}
                />
              )}

              {step === 'shipping' && (
                <ShippingStep
                  customerInfo={customerInfo}
                  setCustomerInfo={setCustomerInfo}
                  shippingMethod={shippingMethod}
                  setShippingMethod={setShippingMethod}
                  currency={currency}
                  isValid={isShippingValid}
                  isLoading={isLoading}
                  error={error}
                  onBack={() => setStep('cart')}
                  onContinue={createPaymentIntent}
                />
              )}

              {step === 'payment' && clientSecret && (
                <PaymentStep
                  clientSecret={clientSecret}
                  orderId={orderId}
                  onBack={() => setStep('shipping')}
                  onComplete={(id) => {
                    setStep('confirmation');
                    onOrderComplete?.(id);
                  }}
                />
              )}

              {step === 'confirmation' && orderId && (
                <ConfirmationStep
                  orderId={orderId}
                  customerEmail={customerInfo.email}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          {step !== 'confirmation' && (
            <OrderSummarySidebar
              cart={cart}
              currency={currency}
              orderSummary={orderSummary}
              bundleInfo={bundleInfo}
              shippingMethod={shippingMethod}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Progress Bar Component
// ============================================

function ProgressBar({ currentStep }: { currentStep: CheckoutStep }) {
  const steps: { id: CheckoutStep; label: string }[] = [
    { id: 'cart', label: '장바구니' },
    { id: 'shipping', label: '배송정보' },
    { id: 'payment', label: '결제' },
    { id: 'confirmation', label: '완료' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="sticky top-0 z-40 bg-[#171717] text-[#F9F9F7]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-300
                    ${i <= currentIndex
                      ? 'bg-[#F9F9F7] text-[#171717]'
                      : 'bg-[#F9F9F7]/20 text-[#F9F9F7]/50'
                    }
                  `}
                >
                  {i < currentIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`
                    hidden sm:inline text-sm transition-colors duration-300
                    ${i <= currentIndex ? 'text-[#F9F9F7]' : 'text-[#F9F9F7]/50'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`
                    w-8 sm:w-16 h-0.5 mx-2 transition-colors duration-300
                    ${i < currentIndex ? 'bg-[#F9F9F7]' : 'bg-[#F9F9F7]/20'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Cart Step Component
// ============================================

interface CartStepProps {
  cart: CartItem[];
  currency: 'KRW' | 'USD';
  orderSummary: OrderSummary;
  bundleInfo: typeof BUNDLE_CONFIGS[0];
  nextBundleInfo: typeof BUNDLE_CONFIGS[0] | null;
  updateQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  addToCart: (productId: string, color: string, size: ProductSize) => void;
  onContinue: () => void;
}

function CartStep({
  cart,
  currency,
  orderSummary,
  bundleInfo,
  nextBundleInfo,
  updateQuantity,
  removeFromCart,
  addToCart,
  onContinue,
}: CartStepProps) {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-light text-[#171717]">장바구니</h2>

      {/* Bundle Progress */}
      {bundleInfo.discountPercent > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-lg">🎉</span>
            <span className="font-medium">
              {bundleInfo.nameKo} 적용! {bundleInfo.discountPercent}% 할인
            </span>
          </div>
        </div>
      )}

      {/* Upsell to next bundle */}
      {nextBundleInfo && (
        <div className="bg-[#171717]/5 rounded-xl p-4">
          <p className="text-sm text-[#171717]/70">
            <span className="font-medium">{nextBundleInfo.minItems - totalQuantity}개</span> 더 추가하면{' '}
            <span className="text-[#171717] font-medium">
              {nextBundleInfo.nameKo} ({nextBundleInfo.discountPercent}% 할인)
            </span>{' '}
            적용!
          </p>
          <div className="mt-2 h-2 bg-[#171717]/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(totalQuantity / nextBundleInfo.minItems) * 100}%`,
              }}
              className="h-full bg-[#171717] rounded-full"
            />
          </div>
        </div>
      )}

      {/* Cart Items */}
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <p className="text-[#171717]/50 text-lg">장바구니가 비어있습니다</p>
          <p className="text-[#171717]/30 text-sm mt-2">제품을 추가해주세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item, index) => {
            const product = getProductById(item.productId);
            if (!product) return null;

            const price = currency === 'KRW' ? product.basePrice : product.priceUSD;

            return (
              <motion.div
                key={`${item.productId}-${item.color}-${item.size}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Product Image Placeholder */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#171717]/5 to-[#171717]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-[#171717]/20">VRD</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#171717] truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#171717]/50 mt-0.5">
                      {item.color} · {item.size}
                    </p>
                    <p className="text-[#171717] font-medium mt-2">
                      {formatPrice(price * item.quantity, currency)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-[#171717]/30 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 bg-[#F9F9F7] rounded-lg">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#171717]/60 hover:text-[#171717] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#171717]/60 hover:text-[#171717] transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Add Section */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="font-medium text-[#171717] mb-4">빠른 추가</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VRD_PRODUCTS.slice(0, 6).map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product.id, product.colors[0].name, product.sizes[0])}
              className="p-3 border border-[#171717]/10 rounded-lg hover:border-[#171717]/30 transition-colors text-left"
            >
              <p className="text-sm font-medium text-[#171717] truncate">{product.name}</p>
              <p className="text-xs text-[#171717]/50 mt-1">
                {formatPrice(currency === 'KRW' ? product.basePrice : product.priceUSD, currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={cart.length === 0}
        className={`
          w-full py-4 rounded-xl font-medium text-lg transition-all duration-300
          ${cart.length > 0
            ? 'bg-[#171717] text-[#F9F9F7] hover:bg-[#171717]/90 active:scale-[0.98]'
            : 'bg-[#171717]/20 text-[#171717]/40 cursor-not-allowed'
          }
        `}
      >
        배송정보 입력
      </button>
    </motion.div>
  );
}

// ============================================
// Shipping Step Component
// ============================================

interface ShippingStepProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  shippingMethod: 'standard' | 'express';
  setShippingMethod: (method: 'standard' | 'express') => void;
  currency: 'KRW' | 'USD';
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onContinue: () => void;
}

function ShippingStep({
  customerInfo,
  setCustomerInfo,
  shippingMethod,
  setShippingMethod,
  currency,
  isValid,
  isLoading,
  error,
  onBack,
  onContinue,
}: ShippingStepProps) {
  const updateCustomerInfo = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setCustomerInfo(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const standardShipping = currency === 'KRW' ? 3000 : 25;
  const expressShipping = currency === 'KRW' ? 5000 : 45;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-light text-[#171717]">배송 정보</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 space-y-5">
        <h3 className="font-medium text-[#171717]">연락처</h3>

        {/* Email */}
        <InputField
          label="이메일"
          type="email"
          value={customerInfo.email}
          onChange={(v) => updateCustomerInfo('email', v)}
          placeholder="your@email.com"
          required
        />

        {/* Name & Phone */}
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            label="이름"
            value={customerInfo.name}
            onChange={(v) => updateCustomerInfo('name', v)}
            placeholder="홍길동"
            required
          />
          <InputField
            label="연락처"
            type="tel"
            value={customerInfo.phone}
            onChange={(v) => updateCustomerInfo('phone', v)}
            placeholder="010-0000-0000"
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 space-y-5">
        <h3 className="font-medium text-[#171717]">배송지</h3>

        {/* Address */}
        <InputField
          label="주소"
          value={customerInfo.address.line1}
          onChange={(v) => updateCustomerInfo('address.line1', v)}
          placeholder="도로명 주소"
          required
        />

        <InputField
          label="상세주소"
          value={customerInfo.address.line2}
          onChange={(v) => updateCustomerInfo('address.line2', v)}
          placeholder="동/호수 (선택)"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            label="도시"
            value={customerInfo.address.city}
            onChange={(v) => updateCustomerInfo('address.city', v)}
            placeholder="서울"
            required
          />
          <InputField
            label="우편번호"
            value={customerInfo.address.postal_code}
            onChange={(v) => updateCustomerInfo('address.postal_code', v)}
            placeholder="00000"
            required
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-[#171717]/70 mb-2">국가</label>
          <select
            value={customerInfo.address.country}
            onChange={(e) => updateCustomerInfo('address.country', e.target.value)}
            className="w-full px-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
          >
            <option value="KR">대한민국</option>
            <option value="US">United States</option>
            <option value="JP">Japan</option>
            <option value="CN">China</option>
            <option value="GB">United Kingdom</option>
          </select>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="bg-white rounded-xl p-6 space-y-4">
        <h3 className="font-medium text-[#171717]">배송 방법</h3>

        <div className="space-y-3">
          <ShippingOption
            id="standard"
            label="일반배송"
            description="2-3 영업일"
            price={formatPrice(standardShipping, currency)}
            selected={shippingMethod === 'standard'}
            onSelect={() => setShippingMethod('standard')}
          />
          <ShippingOption
            id="express"
            label="익일배송"
            description="1 영업일"
            price={formatPrice(expressShipping, currency)}
            selected={shippingMethod === 'express'}
            onSelect={() => setShippingMethod('express')}
          />
        </div>
      </div>

      {/* Continue Button - Mobile Optimized */}
      <button
        onClick={onContinue}
        disabled={!isValid || isLoading}
        className={`
          w-full py-5 rounded-xl font-medium text-lg transition-all duration-300
          min-h-[60px]
          ${isValid && !isLoading
            ? 'bg-[#171717] text-[#F9F9F7] hover:bg-[#171717]/90 active:scale-[0.98]'
            : 'bg-[#171717]/20 text-[#171717]/40 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            처리 중...
          </span>
        ) : (
          '결제하기'
        )}
      </button>
    </motion.div>
  );
}

// ============================================
// Payment Step Component
// ============================================

interface PaymentStepProps {
  clientSecret: string;
  orderId: string | null;
  onBack: () => void;
  onComplete: (orderId: string) => void;
}

function PaymentStep({ clientSecret, orderId, onBack, onComplete }: PaymentStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-light text-[#171717]">결제</h2>
      </div>

      <div className="bg-white rounded-xl p-6">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'flat',
              variables: {
                colorPrimary: '#171717',
                colorBackground: '#F9F9F7',
                colorText: '#171717',
                colorDanger: '#ef4444',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '12px',
                spacingUnit: '4px',
              },
            },
          }}
        >
          <PaymentForm orderId={orderId} onComplete={onComplete} />
        </Elements>
      </div>
    </motion.div>
  );
}

function PaymentForm({
  orderId,
  onComplete,
}: {
  orderId: string | null;
  onComplete: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vrd/order-confirmation?orderId=${orderId}`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsProcessing(false);
    } else if (orderId) {
      onComplete(orderId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`
          w-full py-5 rounded-xl font-medium text-lg transition-all duration-300
          min-h-[60px]
          ${!isProcessing
            ? 'bg-[#171717] text-[#F9F9F7] hover:bg-[#171717]/90 active:scale-[0.98]'
            : 'bg-[#171717]/50 text-[#F9F9F7]/50 cursor-not-allowed'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            결제 처리 중...
          </span>
        ) : (
          '결제 완료'
        )}
      </button>

      <p className="text-center text-xs text-[#171717]/40">
        결제는 Stripe를 통해 안전하게 처리됩니다
      </p>
    </form>
  );
}

// ============================================
// Confirmation Step Component
// ============================================

function ConfirmationStep({
  orderId,
  customerEmail,
}: {
  orderId: string;
  customerEmail: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
      >
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <div>
        <h2 className="text-2xl font-light text-[#171717] mb-2">주문이 완료되었습니다</h2>
        <p className="text-[#171717]/60">감사합니다. VRD와 함께해 주셔서 감사합니다.</p>
      </div>

      <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
        <p className="text-sm text-[#171717]/50 mb-2">주문번호</p>
        <p className="text-lg font-mono font-medium text-[#171717]">{orderId}</p>
      </div>

      <p className="text-sm text-[#171717]/50">
        주문 확인 이메일이 <strong>{customerEmail}</strong>으로 발송되었습니다.
      </p>

      <button
        onClick={() => window.location.href = '/vrd'}
        className="px-8 py-3 bg-[#171717] text-[#F9F9F7] rounded-xl font-medium hover:bg-[#171717]/90 transition-colors"
      >
        쇼핑 계속하기
      </button>
    </motion.div>
  );
}

// ============================================
// Order Summary Sidebar
// ============================================

interface OrderSummarySidebarProps {
  cart: CartItem[];
  currency: 'KRW' | 'USD';
  orderSummary: OrderSummary;
  bundleInfo: typeof BUNDLE_CONFIGS[0];
  shippingMethod: 'standard' | 'express';
}

function OrderSummarySidebar({
  cart,
  currency,
  orderSummary,
  bundleInfo,
  shippingMethod,
}: OrderSummarySidebarProps) {
  const expressExtra = shippingMethod === 'express' ? (currency === 'KRW' ? 2000 : 20) : 0;
  const finalShipping = orderSummary.shippingCost > 0 ? orderSummary.shippingCost + expressExtra : expressExtra;
  const finalTotal = orderSummary.subtotal - orderSummary.bundleDiscount + finalShipping + orderSummary.tax;

  return (
    <div className="hidden lg:block">
      <div className="sticky top-[80px] bg-white rounded-2xl p-6 space-y-6">
        <h3 className="font-medium text-[#171717]">주문 요약</h3>

        {/* Items */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.map((item, i) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F9F9F7] rounded-lg flex items-center justify-center text-xs text-[#171717]/30">
                  VRD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#171717] truncate">{product.name}</p>
                  <p className="text-xs text-[#171717]/50">{item.color} · {item.size} · x{item.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#171717]/10 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#171717]/60">소계</span>
            <span>{formatPrice(orderSummary.subtotal, currency)}</span>
          </div>

          {orderSummary.bundleDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{bundleInfo.nameKo} ({bundleInfo.discountPercent}%)</span>
              <span>-{formatPrice(orderSummary.bundleDiscount, currency)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-[#171717]/60">배송비</span>
            <span>
              {finalShipping === 0 ? '무료' : formatPrice(finalShipping, currency)}
            </span>
          </div>

          {orderSummary.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">세금</span>
              <span>{formatPrice(orderSummary.tax, currency)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#171717]/10 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-[#171717]">총 결제금액</span>
            <span className="text-xl font-medium text-[#171717]">
              {formatPrice(finalTotal, currency)}
            </span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#171717]/10">
          <span className="text-xs text-[#171717]/40">🔒 SSL 보안결제</span>
          <span className="text-xs text-[#171717]/40">💳 Stripe</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Utility Components
// ============================================

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#171717]/70 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 bg-[#F9F9F7] border border-[#171717]/10 rounded-xl text-[#171717] placeholder-[#171717]/30 focus:outline-none focus:ring-2 focus:ring-[#171717]/20 transition-all"
      />
    </div>
  );
}

function ShippingOption({
  id,
  label,
  description,
  price,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  price: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`
        flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all
        ${selected
          ? 'bg-[#171717] text-[#F9F9F7]'
          : 'bg-[#F9F9F7] text-[#171717] hover:bg-[#171717]/5'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name="shipping"
          value={id}
          checked={selected}
          onChange={onSelect}
          className="sr-only"
        />
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selected ? 'border-[#F9F9F7]' : 'border-[#171717]/30'}
          `}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#F9F9F7]" />}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className={`text-sm ${selected ? 'text-[#F9F9F7]/70' : 'text-[#171717]/50'}`}>
            {description}
          </p>
        </div>
      </div>
      <span className="font-medium">{price}</span>
    </label>
  );
}
