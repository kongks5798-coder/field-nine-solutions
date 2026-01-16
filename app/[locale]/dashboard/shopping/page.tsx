/**
 * K-UNIVERSAL Shopping Page
 * K-Beauty, K-Fashion, Souvenirs & Duty-Free Shopping
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Heart,
  Star,
  MapPin,
  Tag,
  Percent,
  ChevronRight,
  X,
  Plus,
  Minus,
  Sparkles,
  Gift,
  Crown,
  Plane,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ============================================
// Types
// ============================================

interface Product {
  id: string;
  name: string;
  nameKo: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  tags: string[];
  taxFree: boolean;
  popular?: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

// ============================================
// Categories & Products Data
// ============================================

const categories = [
  { id: 'all', name: 'All', nameKo: '전체', icon: Sparkles },
  { id: 'beauty', name: 'K-Beauty', nameKo: 'K-뷰티', icon: Sparkles },
  { id: 'fashion', name: 'K-Fashion', nameKo: 'K-패션', icon: Crown },
  { id: 'souvenirs', name: 'Souvenirs', nameKo: '기념품', icon: Gift },
  { id: 'dutyfree', name: 'Duty-Free', nameKo: '면세점', icon: Plane },
];

const products: Product[] = [
  // K-Beauty
  {
    id: 'beauty-1',
    name: 'COSRX Snail Mucin Essence',
    nameKo: '코스알엑스 스네일 뮤신 에센스',
    brand: 'COSRX',
    price: 23000,
    originalPrice: 28000,
    image: '🧴',
    rating: 4.9,
    reviews: 12453,
    category: 'beauty',
    tags: ['Best Seller', 'K-Beauty'],
    taxFree: true,
    popular: true,
  },
  {
    id: 'beauty-2',
    name: 'Innisfree Green Tea Serum',
    nameKo: '이니스프리 그린티 세럼',
    brand: 'Innisfree',
    price: 32000,
    image: '🌿',
    rating: 4.7,
    reviews: 8921,
    category: 'beauty',
    tags: ['Natural', 'Hydrating'],
    taxFree: true,
  },
  {
    id: 'beauty-3',
    name: 'Laneige Lip Sleeping Mask',
    nameKo: '라네즈 립 슬리핑 마스크',
    brand: 'Laneige',
    price: 24000,
    originalPrice: 28000,
    image: '💋',
    rating: 4.8,
    reviews: 15632,
    category: 'beauty',
    tags: ['Must Have', 'Lip Care'],
    taxFree: true,
    popular: true,
  },
  {
    id: 'beauty-4',
    name: 'Sulwhasoo First Care Serum',
    nameKo: '설화수 퍼스트 케어 세럼',
    brand: 'Sulwhasoo',
    price: 89000,
    image: '✨',
    rating: 4.9,
    reviews: 5621,
    category: 'beauty',
    tags: ['Premium', 'Anti-Aging'],
    taxFree: true,
  },
  // K-Fashion
  {
    id: 'fashion-1',
    name: 'MLB Korea Cap',
    nameKo: 'MLB 코리아 볼캡',
    brand: 'MLB Korea',
    price: 45000,
    image: '🧢',
    rating: 4.6,
    reviews: 3421,
    category: 'fashion',
    tags: ['Trending', 'K-Fashion'],
    taxFree: true,
    popular: true,
  },
  {
    id: 'fashion-2',
    name: 'Gentle Monster Sunglasses',
    nameKo: '젠틀몬스터 선글라스',
    brand: 'Gentle Monster',
    price: 289000,
    image: '🕶️',
    rating: 4.8,
    reviews: 2156,
    category: 'fashion',
    tags: ['Luxury', 'K-Celeb'],
    taxFree: true,
  },
  {
    id: 'fashion-3',
    name: 'Ader Error Hoodie',
    nameKo: '아더에러 후디',
    brand: 'Ader Error',
    price: 178000,
    image: '👕',
    rating: 4.7,
    reviews: 1823,
    category: 'fashion',
    tags: ['Streetwear', 'Unisex'],
    taxFree: true,
  },
  // Souvenirs
  {
    id: 'souvenir-1',
    name: 'Traditional Hanbok Keyring',
    nameKo: '전통 한복 키링',
    brand: 'Korea Souvenirs',
    price: 8000,
    image: '🎎',
    rating: 4.5,
    reviews: 892,
    category: 'souvenirs',
    tags: ['Traditional', 'Gift'],
    taxFree: false,
  },
  {
    id: 'souvenir-2',
    name: 'Korean Snack Box Set',
    nameKo: '한국 과자 선물세트',
    brand: 'K-Snacks',
    price: 25000,
    image: '🍪',
    rating: 4.8,
    reviews: 2341,
    category: 'souvenirs',
    tags: ['Food', 'Popular'],
    taxFree: false,
    popular: true,
  },
  {
    id: 'souvenir-3',
    name: 'BT21 Character Plush',
    nameKo: 'BT21 캐릭터 인형',
    brand: 'LINE Friends',
    price: 35000,
    image: '🧸',
    rating: 4.9,
    reviews: 8923,
    category: 'souvenirs',
    tags: ['K-Pop', 'BTS'],
    taxFree: false,
    popular: true,
  },
  // Duty-Free
  {
    id: 'dutyfree-1',
    name: 'Korean Ginseng Extract',
    nameKo: '정관장 홍삼정',
    brand: 'CheongKwanJang',
    price: 120000,
    originalPrice: 150000,
    image: '🌱',
    rating: 4.9,
    reviews: 5621,
    category: 'dutyfree',
    tags: ['Health', 'Premium'],
    taxFree: true,
    popular: true,
  },
  {
    id: 'dutyfree-2',
    name: 'Whoo Luxury Set',
    nameKo: '후 명품 세트',
    brand: 'The History of Whoo',
    price: 450000,
    originalPrice: 520000,
    image: '👑',
    rating: 4.9,
    reviews: 3421,
    category: 'dutyfree',
    tags: ['Luxury', 'Gift Set'],
    taxFree: true,
  },
];

// ============================================
// Main Component
// ============================================

export default function ShoppingPage() {
  const locale = useLocale();
  const { wallet } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const balance = wallet?.balance || 0;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameKo.includes(searchQuery) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const taxFreeTotal = cart
    .filter((item) => item.taxFree)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const estimatedRefund = Math.floor(taxFreeTotal * 0.1); // 10% tax refund estimate

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'ko' ? '브랜드, 상품 검색' : 'Search brands, products'}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#8B5CF6] text-sm"
              />
            </div>

            {/* Cart Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B5CF6] rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        {/* Tax-Free Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 p-4 bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-2xl border border-[#8B5CF6]/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center">
              <Percent className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {locale === 'ko' ? 'Tax-Free 쇼핑' : 'Tax-Free Shopping'}
              </p>
              <p className="text-white/60 text-xs">
                {locale === 'ko'
                  ? '외국인 관광객 즉시 환급 가능'
                  : 'Instant tax refund for tourists'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {locale === 'ko' ? cat.nameKo : cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Popular Products */}
        {selectedCategory === 'all' && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">
                {locale === 'ko' ? '인기 상품' : 'Popular Items'}
              </h2>
              <span className="text-[#8B5CF6] text-sm">
                {locale === 'ko' ? '더보기' : 'See All'}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {products.filter((p) => p.popular).map((product) => (
                <motion.div
                  key={product.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProduct(product)}
                  className="flex-shrink-0 w-36 bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
                >
                  <div className="h-28 flex items-center justify-center text-5xl bg-white/5">
                    {product.image}
                  </div>
                  <div className="p-3">
                    <p className="text-white/40 text-[10px]">{product.brand}</p>
                    <p className="text-white text-xs font-medium line-clamp-2 h-8">
                      {locale === 'ko' ? product.nameKo : product.name}
                    </p>
                    <p className="text-white font-bold text-sm mt-1">
                      ₩{product.price.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Product Grid */}
        <section className="mt-6">
          <h2 className="text-white font-bold text-lg mb-4">
            {selectedCategory === 'all'
              ? (locale === 'ko' ? '전체 상품' : 'All Products')
              : categories.find((c) => c.id === selectedCategory)?.[locale === 'ko' ? 'nameKo' : 'name']}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10"
              >
                {/* Product Image */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="relative h-32 flex items-center justify-center text-5xl bg-white/5 cursor-pointer"
                >
                  {product.image}
                  {/* Wishlist Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                    />
                  </motion.button>
                  {/* Tax-Free Badge */}
                  {product.taxFree && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#8B5CF6] rounded text-white text-[10px] font-bold">
                      TAX FREE
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <p className="text-white/40 text-[10px]">{product.brand}</p>
                  <p className="text-white text-xs font-medium line-clamp-2 h-8 mt-0.5">
                    {locale === 'ko' ? product.nameKo : product.name}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white/60 text-xs">{product.rating}</span>
                    <span className="text-white/30 text-xs">({product.reviews.toLocaleString()})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-white font-bold">₩{product.price.toLocaleString()}</p>
                    {product.originalPrice && (
                      <p className="text-white/30 text-xs line-through">
                        ₩{product.originalPrice.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className="w-full mt-3 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 rounded-lg text-[#8B5CF6] text-sm font-medium transition-colors"
                  >
                    {locale === 'ko' ? '담기' : 'Add'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#12121A] rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto"
            >
              {/* Product Image */}
              <div className="h-48 flex items-center justify-center text-8xl bg-white/5">
                {selectedProduct.image}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#8B5CF6] text-sm">{selectedProduct.brand}</p>
                    <h2 className="text-white font-bold text-xl mt-1">
                      {locale === 'ko' ? selectedProduct.nameKo : selectedProduct.name}
                    </h2>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        wishlist.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-semibold">{selectedProduct.rating}</span>
                  </div>
                  <span className="text-white/40">|</span>
                  <span className="text-white/60 text-sm">
                    {selectedProduct.reviews.toLocaleString()} {locale === 'ko' ? '리뷰' : 'reviews'}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedProduct.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/5 rounded-full text-white/60 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {selectedProduct.taxFree && (
                    <span className="px-3 py-1 bg-[#8B5CF6]/20 rounded-full text-[#8B5CF6] text-xs font-medium">
                      Tax-Free
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/40 text-sm">
                        {locale === 'ko' ? '판매가' : 'Price'}
                      </p>
                      <p className="text-white font-bold text-2xl">
                        ₩{selectedProduct.price.toLocaleString()}
                      </p>
                    </div>
                    {selectedProduct.originalPrice && (
                      <div className="text-right">
                        <p className="text-white/30 line-through text-sm">
                          ₩{selectedProduct.originalPrice.toLocaleString()}
                        </p>
                        <p className="text-red-400 text-sm font-semibold">
                          {Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}% OFF
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tax Refund Info */}
                  {selectedProduct.taxFree && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">
                          {locale === 'ko' ? '예상 환급액' : 'Est. Tax Refund'}
                        </span>
                        <span className="text-[#8B5CF6] font-semibold">
                          ~₩{Math.floor(selectedProduct.price * 0.1).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl text-white font-bold text-lg"
                >
                  {locale === 'ko' ? '장바구니 담기' : 'Add to Cart'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#12121A] rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-white font-bold text-xl">
                  {locale === 'ko' ? '장바구니' : 'Shopping Cart'}
                  {cartCount > 0 && (
                    <span className="ml-2 text-[#8B5CF6]">({cartCount})</span>
                  )}
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/60">
                      {locale === 'ko' ? '장바구니가 비어있습니다' : 'Your cart is empty'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 bg-white/5 rounded-xl"
                      >
                        <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center text-3xl">
                          {item.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/40 text-xs">{item.brand}</p>
                          <p className="text-white text-sm font-medium truncate">
                            {locale === 'ko' ? item.nameKo : item.name}
                          </p>
                          <p className="text-white font-bold mt-1">
                            ₩{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-white/40 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3 text-white" />
                            </button>
                            <span className="text-white w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#12121A]">
                  {/* Tax Refund Summary */}
                  {estimatedRefund > 0 && (
                    <div className="mb-4 p-3 bg-[#8B5CF6]/10 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-[#8B5CF6]" />
                          <span className="text-white/80 text-sm">
                            {locale === 'ko' ? '예상 환급액' : 'Est. Tax Refund'}
                          </span>
                        </div>
                        <span className="text-[#8B5CF6] font-bold">
                          ~₩{estimatedRefund.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60">
                      {locale === 'ko' ? '총 결제금액' : 'Total'}
                    </span>
                    <span className="text-white font-bold text-xl">
                      ₩{cartTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Balance Check */}
                  {balance < cartTotal && (
                    <p className="text-red-400 text-sm text-center mb-3">
                      {locale === 'ko'
                        ? `잔액 부족 (현재: ₩${balance.toLocaleString()})`
                        : `Insufficient balance (Current: ₩${balance.toLocaleString()})`}
                    </p>
                  )}

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={balance < cartTotal}
                    className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl text-white font-bold text-lg disabled:opacity-50"
                  >
                    {locale === 'ko' ? '결제하기' : 'Checkout'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
