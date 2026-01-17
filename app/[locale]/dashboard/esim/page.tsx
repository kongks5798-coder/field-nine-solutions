/**
 * NOMAD - eSIM Marketplace
 * Browse and purchase eSIMs for 190+ countries
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Globe,
  Wifi,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Check,
  Smartphone,
  Clock,
  Zap,
  X,
  QrCode,
  Shield,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

// ============================================
// Types
// ============================================
interface EsimPackage {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  dataGB: number;
  validityDays: number;
  price: number;
  currency: string;
  type: 'local' | 'regional' | 'global';
}

interface Destination {
  code: string;
  name: string;
  flag: string;
  packages: EsimPackage[];
  networks: string[];
  coverage: 'excellent' | 'good' | 'moderate';
}

// ============================================
// eSIM Marketplace Page
// ============================================
export default function EsimMarketplacePage() {
  const locale = useLocale();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<EsimPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Fetch packages and destinations
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, destinationsRes] = await Promise.all([
        fetch('/api/esim?action=packages'),
        fetch('/api/esim?action=destinations'),
      ]);

      const packagesData = await packagesRes.json();
      const destinationsData = await destinationsRes.json();

      if (packagesData.success) {
        setPackages(packagesData.packages);
      }
      if (destinationsData.success) {
        setDestinations(destinationsData.destinations);
      }
    } catch (error) {
      console.error('Failed to fetch eSIM data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || pkg.type === selectedType;
    const matchesDestination =
      !selectedDestination || pkg.destinationCode === selectedDestination;
    return matchesSearch && matchesType && matchesDestination;
  });

  // Group packages by destination
  const groupedPackages = filteredPackages.reduce((acc, pkg) => {
    if (!acc[pkg.destination]) {
      acc[pkg.destination] = [];
    }
    acc[pkg.destination].push(pkg);
    return acc;
  }, {} as Record<string, EsimPackage[]>);

  const handlePurchase = (pkg: EsimPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`}>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">eSIM Store</h1>
                <p className="text-sm text-white/50">190+ countries covered</p>
              </div>
            </div>

            <Link href={`/${locale}/dashboard/esim/my-esims`}>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                My eSIMs
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'local', label: 'Local' },
              { id: 'regional', label: 'Regional' },
              { id: 'global', label: 'Global' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === type.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Destinations */}
        {!searchQuery && selectedType === 'all' && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4">Popular Destinations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {destinations.slice(0, 6).map((dest) => (
                <motion.button
                  key={dest.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDestination(dest.code === selectedDestination ? null : dest.code)}
                  className={`p-4 rounded-xl border text-center transition-colors ${
                    selectedDestination === dest.code
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{dest.flag}</span>
                  <p className="font-medium text-sm">{dest.name}</p>
                  <p className="text-xs text-white/40">{dest.packages.length} plans</p>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Package List */}
        {!loading && (
          <section>
            {Object.entries(groupedPackages).map(([destination, pkgs]) => (
              <div key={destination} className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  {destination}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pkgs.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onPurchase={handlePurchase} />
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(groupedPackages).length === 0 && (
              <div className="text-center py-20">
                <Wifi className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No packages found</p>
                <p className="text-sm text-white/30">Try a different search term</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal
            pkg={selectedPackage}
            onClose={() => {
              setShowPurchaseModal(false);
              setSelectedPackage(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Package Card Component
// ============================================
function PackageCard({
  pkg,
  onPurchase,
}: {
  pkg: EsimPackage;
  onPurchase: (pkg: EsimPackage) => void;
}) {
  const formatData = (gb: number) => {
    if (gb === -1) return 'Unlimited';
    return `${gb}GB`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'local':
        return 'bg-blue-500/20 text-blue-400';
      case 'regional':
        return 'bg-purple-500/20 text-purple-400';
      case 'global':
        return 'bg-emerald-500/20 text-emerald-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold">{pkg.name}</h4>
          <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getTypeColor(pkg.type)}`}>
            {pkg.type}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">${pkg.price}</p>
          <p className="text-xs text-white/40">one-time</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Wifi className="w-4 h-4 text-white/40" />
          <span>{formatData(pkg.dataGB)} data</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Clock className="w-4 h-4 text-white/40" />
          <span>{pkg.validityDays} days validity</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Zap className="w-4 h-4 text-white/40" />
          <span>Instant activation</span>
        </div>
      </div>

      <button
        onClick={() => onPurchase(pkg)}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
      >
        Purchase
      </button>
    </motion.div>
  );
}

// ============================================
// Purchase Modal
// ============================================
function PurchaseModal({
  pkg,
  onClose,
}: {
  pkg: EsimPackage;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/esim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          useSubscription: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setQrCode(data.esim.qrCodeUrl);
      } else {
        setError(data.error || 'Purchase failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="relative w-full sm:max-w-md bg-[#12121A] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{success ? 'Purchase Complete!' : 'Confirm Purchase'}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success ? (
            <>
              {/* Package Details */}
              <div className="p-4 bg-white/5 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">{pkg.name}</h4>
                  <p className="text-xl font-bold text-emerald-400">${pkg.price}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    {pkg.dataGB === -1 ? 'Unlimited' : `${pkg.dataGB}GB`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {pkg.validityDays} days
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {pkg.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Instant
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {[
                  'Works with all eSIM-compatible devices',
                  'No physical SIM required',
                  'Activate instantly via QR code',
                  'Keep your main number active',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Pay ${pkg.price}
                  </>
                )}
              </button>

              <p className="text-xs text-white/40 text-center mt-4">
                Secure payment powered by Stripe
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>

                <h4 className="text-lg font-bold mb-2">Your eSIM is Ready!</h4>
                <p className="text-white/50 text-sm mb-6">
                  Scan the QR code below to install your eSIM
                </p>

                {/* QR Code */}
                {qrCode && (
                  <div className="p-4 bg-white rounded-2xl inline-block mb-6">
                    <img src={qrCode} alt="eSIM QR Code" className="w-48 h-48" />
                  </div>
                )}

                <div className="space-y-3 text-left mb-6">
                  <h5 className="font-medium">Installation Steps:</h5>
                  {[
                    'Go to Settings > Cellular > Add eSIM',
                    'Choose "Use QR Code"',
                    'Scan the QR code above',
                    'Follow the on-screen instructions',
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-white/70">
                      <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
