/**
 * K-UNIVERSAL Checkout
 * Production-grade booking checkout with real auth
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ArrowLeft,
  Plane,
  Building2,
  CreditCard,
  Wallet,
  User,
  Mail,
  Phone,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  MapPin,
  LogIn,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NaverPriceBadgeLarge } from '@/components/hotels/naver-price-badge';

// Dynamic import PayPal button (client-side only)
const PayPalButton = dynamic(() => import('@/components/payment/PayPalButton'), {
  ssr: false,
  loading: () => (
    <div className="w-full p-4 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#0070ba]" />
    </div>
  ),
});

// ============================================
// Types
// ============================================

interface BookingItem {
  type: 'flight' | 'hotel';
  id: string;
  name: string;
  details: {
    origin?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    date?: string;
    time?: string;
    duration?: string;
    carrier?: string;
    guests?: number;
    rooms?: number;
    nights?: number;
  };
  price: {
    base: number;
    markup: number;
    total: number;
    currency: string;
    naverMatched?: boolean;
  };
  shadowPricing?: {
    finalPrice: number;
    naverPrice: number;
    stay22NetRate: number;
    margin: number;
    marginPercent: number;
    priceSource: string;
    naverProvider?: string;
  } | null;
}

interface PassengerInfo {
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'm' | 'f';
  email: string;
  phone: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
}

interface UserSession {
  id: string;
  email: string;
}

// ============================================
// Constants
// ============================================

const STEPS = [
  { id: 'details', label: 'Details', labelKo: '정보 입력' },
  { id: 'payment', label: 'Payment', labelKo: '결제' },
  { id: 'confirm', label: 'Confirm', labelKo: '확인' },
];

// ============================================
// Main Component
// ============================================

export default function CheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKo = locale === 'ko';

  // Auth state
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // Booking item from URL params
  const [bookingItem, setBookingItem] = useState<BookingItem | null>(null);

  // Form data
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    {
      title: 'mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'm',
      email: '',
      phone: '',
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'paypal'>('wallet');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Booking result
  const [bookingResult, setBookingResult] = useState<{
    confirmationNumber: string;
    id: string;
  } | null>(null);

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });

          // Pre-fill email if available
          if (session.user.email) {
            setPassengers(prev => [{
              ...prev[0],
              email: session.user.email || '',
            }]);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load booking item
  useEffect(() => {
    const type = searchParams.get('type') as 'flight' | 'hotel';
    const itemData = searchParams.get('item');

    if (itemData) {
      try {
        setBookingItem(JSON.parse(decodeURIComponent(itemData)));
      } catch (e) {
        console.error('Failed to parse booking item:', e);
        setError(isKo ? '예약 정보를 불러올 수 없습니다' : 'Failed to load booking information');
      }
    } else {
      // No booking data - redirect back
      router.push(`/${locale}/dashboard`);
    }
  }, [searchParams, isKo, locale, router]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) {
        setWalletLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/wallet/balance');
        const data = await response.json();

        if (data.success) {
          setWalletBalance(data.balance || 0);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletBalance();
  }, [user]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!bookingItem) return;

    // Check authentication
    if (!user) {
      setError(isKo ? '로그인이 필요합니다' : 'Please log in to continue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate
      if (!agreeTerms) {
        throw new Error(isKo ? '약관에 동의해주세요' : 'Please agree to the terms');
      }

      const passenger = passengers[0];
      if (!passenger.firstName || !passenger.lastName || !passenger.email || !passenger.phone) {
        throw new Error(isKo ? '필수 정보를 입력해주세요' : 'Please fill in all required fields');
      }

      // Check wallet balance
      if (paymentMethod === 'wallet' && walletBalance < bookingItem.price.total) {
        throw new Error(isKo ? '잔액이 부족합니다' : 'Insufficient wallet balance');
      }

      // Prepare request body
      const endpoint = bookingItem.type === 'flight'
        ? '/api/booking/flights/book'
        : '/api/booking/hotels/book';

      const requestBody = bookingItem.type === 'flight'
        ? {
            offerId: bookingItem.id,
            passengers: passengers.map((p) => ({
              type: 'adult',
              title: p.title,
              givenName: p.firstName,
              familyName: p.lastName,
              dateOfBirth: p.dateOfBirth || '1990-01-01',
              gender: p.gender,
              email: p.email,
              phone: p.phone,
              ...(p.passportNumber && {
                passport: {
                  number: p.passportNumber,
                  issuingCountry: p.passportCountry || 'KR',
                  expiresOn: p.passportExpiry || '',
                },
              }),
            })),
            paymentMethod,
          }
        : {
            hotelId: bookingItem.id,
            hotelName: bookingItem.name,
            roomTypeId: 'standard',
            checkIn: bookingItem.details.checkIn,
            checkOut: bookingItem.details.checkOut,
            guests: {
              adults: bookingItem.details.guests || 2,
            },
            contactInfo: {
              firstName: passengers[0].firstName,
              lastName: passengers[0].lastName,
              email: passengers[0].email,
              phone: passengers[0].phone,
            },
            pricing: {
              wholesale: bookingItem.price.base,
              markup: bookingItem.price.markup,
              final: bookingItem.price.total,
              currency: bookingItem.price.currency,
              nights: bookingItem.details.nights || 1,
            },
            paymentMethod,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingResult({
        confirmationNumber: data.booking.confirmationNumber,
        id: data.booking.id,
      });
      setCurrentStep(2);

      // Refresh wallet balance
      if (paymentMethod === 'wallet') {
        const balanceResponse = await fetch('/api/wallet/balance');
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          setWalletBalance(balanceData.balance || 0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Login redirect
  const handleLogin = () => {
    // Store current URL to redirect back after login
    sessionStorage.setItem('checkoutRedirect', window.location.href);
    router.push(`/${locale}/auth/login`);
  };

  // Loading state
  if (authLoading || !bookingItem) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#171717]" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#171717]/5 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#171717]/5 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-[#171717]" />
          </div>
          <h2 className="text-xl font-bold text-[#171717] mb-2">
            {isKo ? '로그인이 필요합니다' : 'Login Required'}
          </h2>
          <p className="text-[#171717]/60 mb-6">
            {isKo
              ? '예약을 진행하려면 로그인해주세요.'
              : 'Please log in to proceed with your booking.'}
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-[#171717] text-white rounded-2xl font-semibold"
          >
            {isKo ? '로그인' : 'Log In'}
          </button>
          <Link href={`/${locale}/dashboard`}>
            <button className="w-full py-4 mt-3 bg-[#171717]/10 text-[#171717] rounded-2xl font-semibold">
              {isKo ? '돌아가기' : 'Go Back'}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7] border-b border-[#171717]/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard/${bookingItem.type}s`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-[#171717]/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#171717]" />
              </motion.button>
            </Link>
            <h1 className="text-lg font-semibold text-[#171717]">
              {isKo ? '예약 확인' : 'Checkout'}
            </h1>
            <div className="w-9" />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i <= currentStep
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#171717]/10 text-[#171717]/50'
                  }`}
                >
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-colors ${
                      i < currentStep ? 'bg-[#171717]' : 'bg-[#171717]/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {currentStep === 0 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Booking Summary Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#171717]/5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#171717]/5 flex items-center justify-center">
                    {bookingItem.type === 'flight' ? (
                      <Plane className="w-6 h-6 text-[#171717]" />
                    ) : (
                      <Building2 className="w-6 h-6 text-[#171717]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#171717]">
                      {bookingItem.name}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#171717]/60">
                      {bookingItem.type === 'flight' ? (
                        <>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {bookingItem.details.origin} → {bookingItem.details.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {bookingItem.details.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {bookingItem.details.time}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {bookingItem.details.checkIn} ~ {bookingItem.details.checkOut}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {bookingItem.details.guests} {isKo ? '명' : 'guests'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#171717]">
                      {formatPrice(bookingItem.price.total, bookingItem.price.currency)}
                    </p>
                    <p className="text-xs text-[#171717]/50">
                      {isKo ? '총 금액' : 'Total'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Passenger/Guest Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#171717]/5 mb-6">
                <h3 className="text-lg font-semibold text-[#171717] mb-4">
                  {bookingItem.type === 'flight'
                    ? (isKo ? '탑승자 정보' : 'Passenger Information')
                    : (isKo ? '예약자 정보' : 'Guest Information')}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '호칭' : 'Title'}
                    </label>
                    <select
                      value={passengers[0].title}
                      onChange={(e) =>
                        setPassengers([
                          { ...passengers[0], title: e.target.value as PassengerInfo['title'] },
                        ])
                      }
                      className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] focus:outline-none focus:border-[#171717]/30"
                    >
                      <option value="mr">Mr.</option>
                      <option value="ms">Ms.</option>
                      <option value="mrs">Mrs.</option>
                      <option value="miss">Miss</option>
                      <option value="dr">Dr.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '성별' : 'Gender'}
                    </label>
                    <select
                      value={passengers[0].gender}
                      onChange={(e) =>
                        setPassengers([
                          { ...passengers[0], gender: e.target.value as 'm' | 'f' },
                        ])
                      }
                      className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] focus:outline-none focus:border-[#171717]/30"
                    >
                      <option value="m">{isKo ? '남성' : 'Male'}</option>
                      <option value="f">{isKo ? '여성' : 'Female'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '이름 (영문)' : 'First Name'} *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                      <input
                        type="text"
                        value={passengers[0].firstName}
                        onChange={(e) =>
                          setPassengers([{ ...passengers[0], firstName: e.target.value.toUpperCase() }])
                        }
                        placeholder="GILDONG"
                        className="w-full pl-11 pr-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '성 (영문)' : 'Last Name'} *
                    </label>
                    <input
                      type="text"
                      value={passengers[0].lastName}
                      onChange={(e) =>
                        setPassengers([{ ...passengers[0], lastName: e.target.value.toUpperCase() }])
                      }
                      placeholder="HONG"
                      className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '생년월일' : 'Date of Birth'}
                    </label>
                    <input
                      type="date"
                      value={passengers[0].dateOfBirth}
                      onChange={(e) =>
                        setPassengers([{ ...passengers[0], dateOfBirth: e.target.value }])
                      }
                      className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] focus:outline-none focus:border-[#171717]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#171717]/60 mb-1">
                      {isKo ? '전화번호' : 'Phone'} *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                      <input
                        type="tel"
                        value={passengers[0].phone}
                        onChange={(e) =>
                          setPassengers([{ ...passengers[0], phone: e.target.value }])
                        }
                        placeholder="+82 10 1234 5678"
                        className="w-full pl-11 pr-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-[#171717]/60 mb-1">
                    {isKo ? '이메일' : 'Email'} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                    <input
                      type="email"
                      value={passengers[0].email}
                      onChange={(e) =>
                        setPassengers([{ ...passengers[0], email: e.target.value }])
                      }
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30"
                    />
                  </div>
                </div>

                {/* Passport Info (for flights) */}
                {bookingItem.type === 'flight' && (
                  <div className="mt-6 pt-6 border-t border-[#171717]/10">
                    <h4 className="text-sm font-semibold text-[#171717] mb-4">
                      {isKo ? '여권 정보 (국제선 필수)' : 'Passport Information (Required for international)'}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-[#171717]/60 mb-1">
                          {isKo ? '여권번호' : 'Passport No.'}
                        </label>
                        <input
                          type="text"
                          value={passengers[0].passportNumber || ''}
                          onChange={(e) =>
                            setPassengers([{ ...passengers[0], passportNumber: e.target.value.toUpperCase() }])
                          }
                          placeholder="M12345678"
                          className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#171717]/60 mb-1">
                          {isKo ? '만료일' : 'Expiry Date'}
                        </label>
                        <input
                          type="date"
                          value={passengers[0].passportExpiry || ''}
                          onChange={(e) =>
                            setPassengers([{ ...passengers[0], passportExpiry: e.target.value }])
                          }
                          className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] focus:outline-none focus:border-[#171717]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#171717]/60 mb-1">
                          {isKo ? '발급국' : 'Country'}
                        </label>
                        <input
                          type="text"
                          value={passengers[0].passportCountry || ''}
                          onChange={(e) =>
                            setPassengers([{ ...passengers[0], passportCountry: e.target.value.toUpperCase() }])
                          }
                          placeholder="KR"
                          maxLength={2}
                          className="w-full px-4 py-3 border border-[#171717]/10 rounded-xl text-[#171717] bg-[#F9F9F7] placeholder:text-[#171717]/30 focus:outline-none focus:border-[#171717]/30 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(1)}
                disabled={!passengers[0].firstName || !passengers[0].lastName || !passengers[0].email || !passengers[0].phone}
                className="w-full py-4 bg-[#171717] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isKo ? '결제하기' : 'Continue to Payment'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 1 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Price Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#171717]/5 mb-6">
                <h3 className="text-lg font-semibold text-[#171717] mb-4">
                  {isKo ? '결제 금액' : 'Price Breakdown'}
                </h3>

                {/* Naver Price Badge for Hotels */}
                {bookingItem.type === 'hotel' && bookingItem.price.naverMatched && (
                  <div className="mb-4">
                    <NaverPriceBadgeLarge
                      price={formatPrice(bookingItem.price.total, bookingItem.price.currency)}
                      isMatched={true}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between text-[#171717]/60">
                    <span>{isKo ? '객실 요금' : 'Room Rate'} {bookingItem.details.nights ? `(${bookingItem.details.nights}${isKo ? '박' : ' nights'})` : ''}</span>
                    <span>{formatPrice(bookingItem.price.total, bookingItem.price.currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#171717]/60">
                    <span>{isKo ? '세금 및 수수료' : 'Taxes & Fees'}</span>
                    <span>{isKo ? '포함' : 'Included'}</span>
                  </div>
                  <div className="border-t border-[#171717]/10 pt-3 flex justify-between font-semibold text-[#171717]">
                    <span>{isKo ? '총 결제 금액' : 'Total'}</span>
                    <span className="text-xl">
                      {formatPrice(bookingItem.price.total, bookingItem.price.currency)}
                    </span>
                  </div>
                </div>

                {/* Naver Price Note */}
                {bookingItem.type === 'hotel' && bookingItem.price.naverMatched && (
                  <p className="mt-3 text-xs text-[#171717]/40 text-center">
                    {isKo ? '네이버 실시간 최저가와 100% 동일합니다' : 'Matches Naver\'s real-time lowest price 100%'}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#171717]/5 mb-6">
                <h3 className="text-lg font-semibold text-[#171717] mb-4">
                  {isKo ? '결제 수단' : 'Payment Method'}
                </h3>

                <div className="space-y-3">
                  {/* Ghost Wallet */}
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center gap-4 ${
                      paymentMethod === 'wallet'
                        ? 'border-[#171717] bg-[#171717]/5'
                        : 'border-[#171717]/10 hover:border-[#171717]/30'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-[#171717]">Ghost Wallet</p>
                      <p className="text-sm text-[#171717]/60">
                        {walletLoading ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          `${isKo ? '잔액' : 'Balance'}: ${formatPrice(walletBalance, 'USD')}`
                        )}
                      </p>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <div className="w-6 h-6 rounded-full bg-[#171717] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Card */}
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center gap-4 ${
                      paymentMethod === 'card'
                        ? 'border-[#171717] bg-[#171717]/5'
                        : 'border-[#171717]/10 hover:border-[#171717]/30'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#171717]/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#171717]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-[#171717]">
                        {isKo ? '신용/체크카드' : 'Credit/Debit Card'}
                      </p>
                      <p className="text-sm text-[#171717]/60">
                        Visa, Mastercard, Amex
                      </p>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="w-6 h-6 rounded-full bg-[#171717] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  {/* PayPal */}
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center gap-4 ${
                      paymentMethod === 'paypal'
                        ? 'border-[#0070ba] bg-[#0070ba]/5'
                        : 'border-[#171717]/10 hover:border-[#171717]/30'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0070ba] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.607c-.564 0-1.04.407-1.127.963l-1.404 8.043z"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-[#171717]">PayPal</p>
                      <p className="text-sm text-[#171717]/60">
                        {isKo ? '안전한 PayPal 결제' : 'Secure PayPal checkout'}
                      </p>
                    </div>
                    {paymentMethod === 'paypal' && (
                      <div className="w-6 h-6 rounded-full bg-[#0070ba] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Low balance warning */}
                {paymentMethod === 'wallet' && !walletLoading && walletBalance < bookingItem.price.total && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        {isKo ? '잔액 부족' : 'Insufficient Balance'}
                      </p>
                      <p className="text-amber-700 text-sm">
                        {isKo
                          ? `${formatPrice(bookingItem.price.total - walletBalance, 'USD')} 더 충전이 필요합니다`
                          : `You need ${formatPrice(bookingItem.price.total - walletBalance, 'USD')} more`}
                      </p>
                      <Link href={`/${locale}/wallet`}>
                        <button className="mt-2 text-sm font-medium text-amber-800 underline">
                          {isKo ? '지갑 충전하기' : 'Top up wallet'}
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#171717]/5 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-[#171717]/20 mt-0.5 accent-[#171717]"
                  />
                  <span className="text-sm text-[#171717]/70">
                    {isKo
                      ? '예약 조건 및 취소/환불 정책에 동의합니다. 결제 후 취소 시 수수료가 발생할 수 있습니다.'
                      : 'I agree to the booking terms and cancellation policy. Cancellation fees may apply after payment.'}
                  </span>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* PayPal Button */}
              {paymentMethod === 'paypal' && agreeTerms && (
                <div className="mb-6">
                  <PayPalButton
                    amount={bookingItem.price.total}
                    currency={bookingItem.price.currency}
                    description={`${bookingItem.type === 'flight' ? 'Flight' : 'Hotel'}: ${bookingItem.name}`}
                    bookingType={bookingItem.type}
                    bookingId={bookingItem.id}
                    disabled={!agreeTerms}
                    onSuccess={(captureData) => {
                      // PayPal payment successful
                      setBookingResult({
                        confirmationNumber: captureData.captureId,
                        id: captureData.captureId,
                      });
                      setCurrentStep(2);
                    }}
                    onError={(errorMessage) => {
                      setError(errorMessage);
                    }}
                    onCancel={() => {
                      setError(isKo ? '결제가 취소되었습니다' : 'Payment was cancelled');
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 py-4 bg-[#171717]/10 text-[#171717] rounded-2xl font-semibold"
                >
                  {isKo ? '이전' : 'Back'}
                </button>
                {paymentMethod !== 'paypal' ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isLoading || !agreeTerms || (paymentMethod === 'wallet' && walletBalance < bookingItem.price.total)}
                    className="flex-[2] py-4 bg-[#171717] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        {isKo ? '결제하기' : 'Pay Now'}
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div className="flex-[2] py-4 bg-[#0070ba]/10 text-[#0070ba] rounded-2xl font-semibold text-center">
                    {agreeTerms
                      ? (isKo ? '위 PayPal 버튼으로 결제하세요' : 'Use PayPal button above to pay')
                      : (isKo ? '약관에 동의해주세요' : 'Please agree to terms')}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation - Tesla Minimal */}
          {currentStep === 2 && bookingResult && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8"
            >
              {/* Large Check Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
                className="w-32 h-32 mb-12 rounded-full bg-[#171717] flex items-center justify-center"
              >
                <Check className="w-16 h-16 text-white" strokeWidth={3} />
              </motion.div>

              {/* Simple Message */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-[#171717] mb-16"
              >
                {isKo ? '결제가 완료되었습니다' : 'Payment Complete'}
              </motion.h1>

              {/* Single Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs"
              >
                <Link href={`/${locale}/dashboard`}>
                  <button className="w-full py-5 bg-[#171717] text-white text-lg font-semibold rounded-2xl hover:bg-[#171717]/90 transition-colors">
                    {isKo ? '메인으로' : 'Back to Main'}
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
