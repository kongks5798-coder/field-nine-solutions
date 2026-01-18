/**
 * K-Universal Order History Page
 * Tesla-grade order tracking with service categorization
 * @version 1.0.0 - Production Ready
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  Hotel,
  Plane,
  Wifi,
  Receipt,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatKRW } from '@/lib/toss/client';

// ============================================
// Types
// ============================================

type OrderStatus = 'completed' | 'in_progress' | 'cancelled' | 'refunded';
type OrderCategory = 'all' | 'taxi' | 'food' | 'shopping' | 'hotel' | 'esim' | 'flight';

interface Order {
  id: string;
  category: Exclude<OrderCategory, 'all'>;
  title: string;
  subtitle: string;
  amount: number;
  status: OrderStatus;
  date: Date;
  details?: {
    from?: string;
    to?: string;
    items?: string[];
    nights?: number;
  };
}

// ============================================
// Demo Data
// ============================================

const DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    category: 'taxi',
    title: 'UT Taxi',
    subtitle: 'Gangnam → Hongdae',
    amount: 18500,
    status: 'completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    details: { from: 'Gangnam Station', to: 'Hongdae Station' },
  },
  {
    id: 'ORD-2026-002',
    category: 'food',
    title: 'Baemin Delivery',
    subtitle: 'Chicken & Beer',
    amount: 32000,
    status: 'completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    details: { items: ['Fried Chicken', 'Beer 2x', 'Pickled Radish'] },
  },
  {
    id: 'ORD-2026-003',
    category: 'esim',
    title: 'Korea eSIM',
    subtitle: '10GB / 30 Days',
    amount: 25000,
    status: 'completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: 'ORD-2026-004',
    category: 'hotel',
    title: 'Lotte Hotel Seoul',
    subtitle: 'Superior Room',
    amount: 280000,
    status: 'completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    details: { nights: 2 },
  },
  {
    id: 'ORD-2026-005',
    category: 'taxi',
    title: 'UT Taxi',
    subtitle: 'Itaewon → Myeongdong',
    amount: 12000,
    status: 'cancelled',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    details: { from: 'Itaewon', to: 'Myeongdong' },
  },
  {
    id: 'ORD-2026-006',
    category: 'shopping',
    title: 'Olive Young',
    subtitle: 'K-Beauty Products',
    amount: 45000,
    status: 'completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    details: { items: ['Sunscreen', 'Sheet Masks 10x', 'Lip Tint'] },
  },
];

// ============================================
// Constants
// ============================================

const CATEGORY_CONFIG: Record<Exclude<OrderCategory, 'all'>, {
  icon: typeof Car;
  color: string;
  bgColor: string;
  label: string;
}> = {
  taxi: { icon: Car, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Taxi' },
  food: { icon: UtensilsCrossed, color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Food' },
  shopping: { icon: ShoppingBag, color: 'text-pink-400', bgColor: 'bg-pink-500/20', label: 'Shopping' },
  hotel: { icon: Hotel, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Hotel' },
  esim: { icon: Wifi, color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'eSIM' },
  flight: { icon: Plane, color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Flight' },
};

const STATUS_CONFIG: Record<OrderStatus, {
  icon: typeof CheckCircle;
  color: string;
  bgColor: string;
  label: string;
}> = {
  completed: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Completed' },
  in_progress: { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'In Progress' },
  cancelled: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Cancelled' },
  refunded: { icon: RefreshCw, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Refunded' },
};

const FILTER_CATEGORIES: { key: OrderCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'taxi', label: 'Taxi' },
  { key: 'food', label: 'Food' },
  { key: 'shopping', label: 'Shop' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'esim', label: 'eSIM' },
];

// ============================================
// Utilities
// ============================================

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Components
// ============================================

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const categoryConfig = CATEGORY_CONFIG[order.category];
  const statusConfig = STATUS_CONFIG[order.status];
  const CategoryIcon = categoryConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className={`p-3 rounded-xl ${categoryConfig.bgColor}`}>
          <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-semibold">{order.title}</h3>
              <p className="text-white/60 text-sm truncate">{order.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{formatKRW(order.amount)}</p>
              <p className="text-white/40 text-xs">{formatDate(order.date)}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between mt-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
              <span className={`text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const categoryConfig = CATEGORY_CONFIG[order.category];
  const statusConfig = STATUS_CONFIG[order.status];
  const CategoryIcon = categoryConfig.icon;

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative w-full sm:max-w-md bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${categoryConfig.bgColor}`}>
              <CategoryIcon className={`w-6 h-6 ${categoryConfig.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-white text-xl font-bold">{order.title}</h2>
              <p className="text-white/60">{order.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order ID & Date */}
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Order ID</span>
            <span className="text-white font-mono text-sm">{order.id}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Date</span>
            <span className="text-white">{formatFullDate(order.date)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Status</span>
            <span className={`${statusConfig.color} font-medium`}>{statusConfig.label}</span>
          </div>

          {/* Order Details */}
          {order.details?.from && order.details?.to && (
            <div className="py-3 border-b border-white/10">
              <span className="text-white/60 text-sm">Route</span>
              <p className="text-white mt-1">{order.details.from} → {order.details.to}</p>
            </div>
          )}
          {order.details?.items && (
            <div className="py-3 border-b border-white/10">
              <span className="text-white/60 text-sm">Items</span>
              <ul className="text-white mt-1 space-y-1">
                {order.details.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {order.details?.nights && (
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/60">Duration</span>
              <span className="text-white">{order.details.nights} nights</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center py-4 bg-white/5 rounded-xl px-4 -mx-2">
            <span className="text-white font-medium">Total Amount</span>
            <span className="text-white text-xl font-bold">{formatKRW(order.amount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Close
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Receipt
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export default function OrderHistoryPage() {
  const locale = useLocale();
  const [orders] = useState<Order[]>(DEMO_ORDERS);
  const [selectedCategory, setSelectedCategory] = useState<OrderCategory>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = selectedCategory === 'all'
    ? orders
    : orders.filter((o) => o.category === selectedCategory);

  const totalSpent = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Order History</h1>
            <p className="text-white/50 text-xs">{orders.length} orders</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Calendar className="w-5 h-5 text-white/70" />
          </motion.button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/60 text-sm">Total Spent (This Month)</span>
          </div>
          <p className="text-white text-3xl font-bold">{formatKRW(totalSpent)}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            <div className="flex-1">
              <p className="text-white/40 text-xs">Completed</p>
              <p className="text-green-400 font-semibold">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-xs">Cancelled</p>
              <p className="text-red-400 font-semibold">
                {orders.filter((o) => o.status === 'cancelled').length}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-xs">In Progress</p>
              <p className="text-yellow-400 font-semibold">
                {orders.filter((o) => o.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {FILTER_CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Orders List */}
        <div className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No orders found</p>
              </motion.div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Demo Badge */}
        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
            🎭 Demo Data - Real orders will appear here
          </span>
        </div>
      </main>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
