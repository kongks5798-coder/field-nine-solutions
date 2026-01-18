/**
 * K-Food - Netflix-style Food Delivery
 * Horizontal scroll menus with Ghost Wallet payment
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Star,
  Clock,
  Flame,
  ChevronRight,
  Wallet,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================
interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  image: string;
  spicyLevel?: number;
  rating: number;
  reviews: number;
  prepTime: string;
  popular?: boolean;
}

interface Category {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  items: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
  options?: string[];
}

// ============================================
// Menu Data
// ============================================
const menuCategories: Category[] = [
  {
    id: 'popular',
    name: '인기 메뉴',
    nameEn: 'Popular',
    emoji: '🔥',
    items: [
      {
        id: 'chicken-1',
        name: '양념치킨',
        nameEn: 'Korean Fried Chicken',
        description: '달콤 매콤한 양념이 듬뿍',
        descriptionEn: 'Sweet & spicy glazed chicken',
        price: 22000,
        image: '🍗',
        spicyLevel: 2,
        rating: 4.9,
        reviews: 3240,
        prepTime: '25-35',
        popular: true,
      },
      {
        id: 'jjajang-1',
        name: '짜장면',
        nameEn: 'Jjajangmyeon',
        description: '진한 춘장의 맛',
        descriptionEn: 'Black bean noodles',
        price: 8000,
        image: '🍜',
        rating: 4.8,
        reviews: 2890,
        prepTime: '20-30',
        popular: true,
      },
      {
        id: 'bibimbap-1',
        name: '비빔밥',
        nameEn: 'Bibimbap',
        description: '건강한 한 그릇',
        descriptionEn: 'Mixed rice with vegetables',
        price: 12000,
        image: '🍚',
        spicyLevel: 1,
        rating: 4.7,
        reviews: 1560,
        prepTime: '15-25',
      },
    ],
  },
  {
    id: 'chicken',
    name: '치킨',
    nameEn: 'Chicken',
    emoji: '🍗',
    items: [
      {
        id: 'chicken-2',
        name: '후라이드 치킨',
        nameEn: 'Original Fried Chicken',
        description: '바삭바삭 오리지널',
        descriptionEn: 'Classic crispy fried chicken',
        price: 20000,
        image: '🍗',
        rating: 4.8,
        reviews: 4520,
        prepTime: '25-35',
      },
      {
        id: 'chicken-3',
        name: '간장치킨',
        nameEn: 'Soy Garlic Chicken',
        description: '달콤한 간장 소스',
        descriptionEn: 'Sweet soy garlic glazed',
        price: 22000,
        image: '🍗',
        rating: 4.7,
        reviews: 2340,
        prepTime: '25-35',
      },
      {
        id: 'chicken-4',
        name: '파닭',
        nameEn: 'Green Onion Chicken',
        description: '시원한 파절이와 함께',
        descriptionEn: 'With fresh green onions',
        price: 24000,
        image: '🍗',
        rating: 4.6,
        reviews: 1890,
        prepTime: '25-35',
      },
    ],
  },
  {
    id: 'korean',
    name: '한식',
    nameEn: 'Korean Food',
    emoji: '🇰🇷',
    items: [
      {
        id: 'korean-1',
        name: '삼겹살 세트',
        nameEn: 'Pork Belly Set',
        description: '두툼한 삼겹살 300g',
        descriptionEn: '300g thick-cut pork belly',
        price: 28000,
        image: '🥓',
        rating: 4.9,
        reviews: 3210,
        prepTime: '30-40',
      },
      {
        id: 'korean-2',
        name: '김치찌개',
        nameEn: 'Kimchi Stew',
        description: '얼큰하고 시원한 맛',
        descriptionEn: 'Spicy fermented kimchi stew',
        price: 9000,
        image: '🍲',
        spicyLevel: 3,
        rating: 4.7,
        reviews: 2130,
        prepTime: '15-25',
      },
      {
        id: 'korean-3',
        name: '불고기',
        nameEn: 'Bulgogi',
        description: '달콤한 소고기 불고기',
        descriptionEn: 'Marinated beef BBQ',
        price: 18000,
        image: '🥩',
        rating: 4.8,
        reviews: 1870,
        prepTime: '20-30',
      },
    ],
  },
  {
    id: 'chinese',
    name: '중식',
    nameEn: 'Chinese',
    emoji: '🥟',
    items: [
      {
        id: 'chinese-1',
        name: '짬뽕',
        nameEn: 'Jjamppong',
        description: '얼큰한 해물 짬뽕',
        descriptionEn: 'Spicy seafood noodle soup',
        price: 9000,
        image: '🍜',
        spicyLevel: 3,
        rating: 4.8,
        reviews: 2670,
        prepTime: '20-30',
      },
      {
        id: 'chinese-2',
        name: '탕수육',
        nameEn: 'Sweet & Sour Pork',
        description: '바삭한 탕수육 (소)',
        descriptionEn: 'Crispy pork with sweet sauce',
        price: 18000,
        image: '🍖',
        rating: 4.7,
        reviews: 1940,
        prepTime: '25-35',
      },
      {
        id: 'chinese-3',
        name: '군만두',
        nameEn: 'Pan-fried Dumplings',
        description: '바삭한 군만두 8개',
        descriptionEn: '8 crispy pan-fried dumplings',
        price: 7000,
        image: '🥟',
        rating: 4.6,
        reviews: 1230,
        prepTime: '15-20',
      },
    ],
  },
];

// ============================================
// Spicy Level Options
// ============================================
const spicyLevels = [
  { level: 0, name: '안 맵게', nameEn: 'Not Spicy', emoji: '🌶️' },
  { level: 1, name: '조금 맵게', nameEn: 'Mild', emoji: '🌶️' },
  { level: 2, name: '보통', nameEn: 'Medium', emoji: '🌶️🌶️' },
  { level: 3, name: '매운맛', nameEn: 'Spicy', emoji: '🌶️🌶️🌶️' },
];

// ============================================
// Main Component
// ============================================
export default function KFoodPage() {
  const locale = useLocale();
  const { wallet } = useAuthStore();
  const balance = wallet?.balance || 0;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showItemModal, setShowItemModal] = useState<MenuItem | null>(null);
  const [selectedSpicy, setSelectedSpicy] = useState(2);
  const [showOrderComplete, setShowOrderComplete] = useState(false);

  const scrollRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Cart functions
  const addToCart = (item: MenuItem, spicyLevel?: number) => {
    const options = spicyLevel !== undefined ? [`매운맛: ${spicyLevels[spicyLevel].name}`] : [];

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, options }];
    });
    setShowItemModal(null);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place order
  const placeOrder = () => {
    if (balance < cartTotal) {
      toast.error('잔액이 부족합니다', {
        description: '충전 후 이용해주세요.',
        action: {
          label: '충전하기',
          onClick: () => window.location.href = `/${locale}/wallet`,
        },
      });
      return;
    }
    setShowCart(false);
    setShowOrderComplete(true);
    setCart([]);
    toast.success('주문이 완료되었습니다!', {
      description: '배달이 곧 시작됩니다.',
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">K-Food</h1>
              <p className="text-white/50 text-xs">배달 25-40분</p>
            </div>
          </div>

          {/* Cart Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCart(true)}
            className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
            <Search className="w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="음식 검색 / Search food..."
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[128px] z-30 bg-[#0A0A0F] border-b border-white/5 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                scrollRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full whitespace-nowrap transition-colors"
            >
              <span>{cat.emoji}</span>
              <span className="text-white text-sm">{cat.nameEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <main className="pb-24">
        {menuCategories.map((category) => (
          <section
            key={category.id}
            ref={(el) => { scrollRefs.current[category.id] = el; }}
            className="py-6"
          >
            <div className="px-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>{category.emoji}</span>
                  {category.nameEn}
                </h2>
                <p className="text-white/40 text-xs">{category.name}</p>
              </div>
              <button className="text-[#3B82F6] text-sm flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Scroll Menu (Netflix Style) */}
            <div className="overflow-x-auto">
              <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
                {category.items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowItemModal(item)}
                    className="w-[180px] bg-[#12121A] rounded-2xl overflow-hidden border border-white/5 text-left"
                  >
                    {/* Image */}
                    <div className="relative h-[120px] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <span className="text-6xl">{item.image}</span>
                      {item.popular && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-white font-bold text-sm truncate">{item.nameEn}</h3>
                      <p className="text-white/40 text-xs truncate">{item.name}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white/60 text-xs">{item.rating}</span>
                        </div>
                        <span className="text-white/20">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span className="text-white/40 text-xs">{item.prepTime}분</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-white font-bold">₩{item.price.toLocaleString()}</span>
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-4 right-4 z-40"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCart(true)}
            className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-2xl flex items-center justify-between px-6 shadow-lg shadow-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">{cartCount}개 담김</span>
            </div>
            <span className="text-white font-bold">₩{cartTotal.toLocaleString()}</span>
          </motion.button>
        </motion.div>
      )}

      {/* Item Detail Modal */}
      <AnimatePresence>
        {showItemModal && (
          <ItemDetailModal
            item={showItemModal}
            onClose={() => setShowItemModal(null)}
            onAddToCart={addToCart}
            selectedSpicy={selectedSpicy}
            setSelectedSpicy={setSelectedSpicy}
          />
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <CartModal
            cart={cart}
            cartTotal={cartTotal}
            balance={balance}
            onClose={() => setShowCart(false)}
            onRemove={removeFromCart}
            onAdd={(item) => addToCart(item)}
            onPlaceOrder={placeOrder}
            locale={locale}
          />
        )}
      </AnimatePresence>

      {/* Order Complete Modal */}
      <AnimatePresence>
        {showOrderComplete && (
          <OrderCompleteModal onClose={() => setShowOrderComplete(false)} locale={locale} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Item Detail Modal
// ============================================
function ItemDetailModal({
  item,
  onClose,
  onAddToCart,
  selectedSpicy,
  setSelectedSpicy,
}: {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, spicyLevel?: number) => void;
  selectedSpicy: number;
  setSelectedSpicy: (level: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full sm:max-w-md bg-[#12121A] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden"
      >
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative">
          <span className="text-8xl">{item.image}</span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-white font-bold text-xl">{item.nameEn}</h2>
              <p className="text-white/50 text-sm">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">₩{item.price.toLocaleString()}</p>
              <p className="text-white/40 text-xs">${(item.price / 1320).toFixed(2)}</p>
            </div>
          </div>

          <p className="text-white/60 text-sm mb-4">{item.descriptionEn}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white">{item.rating}</span>
              <span className="text-white/40 text-sm">({item.reviews.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-white/60 text-sm">{item.prepTime}분</span>
            </div>
          </div>

          {/* Spicy Level */}
          {item.spicyLevel !== undefined && (
            <div className="mb-6">
              <p className="text-white font-medium mb-3">매운맛 선택 / Spicy Level</p>
              <div className="grid grid-cols-4 gap-2">
                {spicyLevels.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setSelectedSpicy(level.level)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedSpicy === level.level
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <p className="text-lg mb-1">{level.emoji}</p>
                    <p className="text-white text-xs">{level.nameEn}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart(item, item.spicyLevel !== undefined ? selectedSpicy : undefined)}
            className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-bold"
          >
            장바구니에 담기
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Cart Modal
// ============================================
function CartModal({
  cart,
  cartTotal,
  balance,
  onClose,
  onRemove,
  onAdd,
  onPlaceOrder,
  locale,
}: {
  cart: CartItem[];
  cartTotal: number;
  balance: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onAdd: (item: MenuItem) => void;
  onPlaceOrder: () => void;
  locale: string;
}) {
  const deliveryFee = 3000;
  const total = cartTotal + deliveryFee;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full sm:max-w-md max-h-[90vh] bg-[#12121A] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">장바구니</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">장바구니가 비어있습니다</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                <span className="text-3xl">{item.image}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.nameEn}</p>
                  {item.options && item.options.length > 0 && (
                    <p className="text-white/40 text-xs">{item.options.join(', ')}</p>
                  )}
                  <p className="text-white/60 text-sm">₩{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">주문 금액</span>
                <span className="text-white">₩{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">배달비</span>
                <span className="text-white">₩{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-bold">총 결제금액</span>
                <span className="text-white font-bold text-lg">₩{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-white/50" />
                <span className="text-white/60 text-sm">Ghost Wallet</span>
              </div>
              <span className={`font-bold ${balance >= total ? 'text-green-400' : 'text-red-400'}`}>
                ₩{balance.toLocaleString()}
              </span>
            </div>

            {/* Order Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onPlaceOrder}
              disabled={balance < total}
              className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-bold disabled:opacity-50"
            >
              {balance < total ? '잔액 부족' : `₩${total.toLocaleString()} 결제하기`}
            </motion.button>

            {balance < total && (
              <Link href={`/${locale}/wallet`}>
                <button className="w-full py-3 bg-white/10 rounded-xl text-white font-medium">
                  충전하러 가기
                </button>
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Order Complete Modal
// ============================================
function OrderCompleteModal({ onClose, locale }: { onClose: () => void; locale: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-[#12121A] rounded-3xl border border-white/10 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>

        <h2 className="text-white font-bold text-2xl mb-2">주문 완료!</h2>
        <p className="text-white/50 mb-6">맛있는 음식이 곧 도착합니다</p>

        <div className="p-4 bg-white/5 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white/50 text-xs">예상 배달 시간</p>
              <p className="text-white font-bold">25-35분</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-bold"
          >
            확인
          </motion.button>
          <Link href={`/${locale}/dashboard`}>
            <button className="w-full py-3 bg-white/10 rounded-xl text-white font-medium">
              홈으로 돌아가기
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
