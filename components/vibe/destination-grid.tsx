/**
 * VIBE-ID Destination Grid
 * 추천 여행지를 그리드 형태로 표시
 */

'use client';

import { motion } from 'framer-motion';
import { MapPin, Heart, ArrowRight } from 'lucide-react';
import { Destination } from '@/lib/vibe/types';
import { useParams, useRouter } from 'next/navigation';

interface DestinationGridProps {
  destinations: Destination[];
  vibeType: string;
}

export function DestinationGrid({ destinations, vibeType }: DestinationGridProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'ko';

  const handleDestinationClick = (destination: Destination) => {
    // Navigate to hotels search with vibe context
    const searchParams = new URLSearchParams({
      destination: destination.city,
      vibeType: vibeType,
    });
    router.push(`/${locale}/dashboard/hotels?${searchParams.toString()}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h3 className="text-xl font-bold text-[#171717] mb-2">
          이 분위기에 어울리는 여행지
        </h3>
        <p className="text-[#171717]/50 text-sm">
          AI가 분석한 당신의 스타일에 맞는 추천 여행지
        </p>
      </motion.div>

      {/* Destination Grid */}
      <div className="grid grid-cols-2 gap-4">
        {destinations.map((destination, i) => (
          <motion.div
            key={destination.city}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleDestinationClick(destination)}
            className="group cursor-pointer"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#171717]/5 hover:shadow-md transition-all duration-300">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.cityKo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Match Score Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <span className="text-xs font-semibold text-[#171717]">
                    {destination.matchScore}%
                  </span>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* City Name */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1 text-white mb-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs opacity-80">{destination.country}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {destination.cityKo}
                  </h4>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                {/* Reason */}
                <p className="text-xs text-[#171717]/60 line-clamp-2 mb-3 min-h-[2.5rem]">
                  {destination.reason}
                </p>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#171717]">
                      {formatPrice(destination.priceFrom)}
                    </span>
                    <span className="text-xs text-[#171717]/50">~</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center group-hover:bg-[#171717]/80 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center"
      >
        <button
          onClick={() => router.push(`/${locale}/dashboard/hotels`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#171717]/5 text-[#171717] font-medium hover:bg-[#171717]/10 transition-colors"
        >
          더 많은 여행지 보기
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
