/**
 * K-Taxi - Map-based Taxi Booking
 * Google Maps integration with Ghost Wallet payment
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Car,
  Clock,
  Wallet,
  Star,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================
interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface VehicleType {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  basePrice: number;
  pricePerKm: number;
  eta: number;
  capacity: string;
}

// ============================================
// Vehicle Types Data
// ============================================
const vehicleTypes: VehicleType[] = [
  {
    id: 'standard',
    name: 'Standard',
    nameKo: '일반',
    icon: '🚕',
    basePrice: 4800,
    pricePerKm: 1000,
    eta: 3,
    capacity: '1-4',
  },
  {
    id: 'premium',
    name: 'Premium',
    nameKo: '프리미엄',
    icon: '🚗',
    basePrice: 8000,
    pricePerKm: 1500,
    eta: 5,
    capacity: '1-4',
  },
  {
    id: 'van',
    name: 'Van',
    nameKo: '대형',
    icon: '🚐',
    basePrice: 12000,
    pricePerKm: 2000,
    eta: 7,
    capacity: '1-8',
  },
];

// ============================================
// Popular Destinations
// ============================================
const popularDestinations = [
  { name: '인천공항 T1', nameEn: 'Incheon Airport T1', lat: 37.4602, lng: 126.4407 },
  { name: '명동', nameEn: 'Myeongdong', lat: 37.5636, lng: 126.9869 },
  { name: '홍대입구', nameEn: 'Hongdae', lat: 37.5563, lng: 126.9237 },
  { name: '강남역', nameEn: 'Gangnam Station', lat: 37.4979, lng: 127.0276 },
  { name: '이태원', nameEn: 'Itaewon', lat: 37.5344, lng: 126.9947 },
];

// ============================================
// Main Component
// ============================================
export default function KTaxiPage() {
  const locale = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);

  // Booking state
  const [step, setStep] = useState<'pickup' | 'dropoff' | 'vehicle' | 'confirm' | 'searching' | 'matched'>('pickup');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(vehicleTypes[0]);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);

  // Wallet
  const { wallet } = useAuthStore();
  const balance = wallet?.balance || 0;

  // Map markers
  const markersRef = useRef<google.maps.Marker[]>([]);
  const taxiMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !window.google || !mapRef.current) return;

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation({ ...location, address: 'Current Location' });
          setPickupLocation({ ...location, address: '현재 위치 / Current Location' });

          const mapInstance = new google.maps.Map(mapRef.current!, {
            center: location,
            zoom: 16,
            disableDefaultUI: true,
            styles: darkMapStyle,
          });

          setMap(mapInstance);

          // Add current location marker
          const marker = new google.maps.Marker({
            position: location,
            map: mapInstance,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
          });
          markersRef.current.push(marker);
        },
        () => {
          // Default to Seoul
          const defaultLocation = { lat: 37.5665, lng: 126.978 };
          const mapInstance = new google.maps.Map(mapRef.current!, {
            center: defaultLocation,
            zoom: 14,
            disableDefaultUI: true,
            styles: darkMapStyle,
          });
          setMap(mapInstance);
          setCurrentLocation({ ...defaultLocation, address: 'Seoul, Korea' });
          setPickupLocation({ ...defaultLocation, address: '서울 / Seoul' });
        }
      );
    }
  }, [isMapLoaded]);

  // Calculate price when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      );
      setEstimatedDistance(distance);
      const price = selectedVehicle.basePrice + Math.ceil(distance * selectedVehicle.pricePerKm);
      setEstimatedPrice(price);
    }
  }, [pickupLocation, dropoffLocation, selectedVehicle]);

  // Select destination
  const selectDestination = useCallback((dest: typeof popularDestinations[0]) => {
    const location = {
      lat: dest.lat,
      lng: dest.lng,
      address: `${dest.nameEn} / ${dest.name}`,
    };
    setDropoffLocation(location);
    setStep('vehicle');

    if (map) {
      // Add dropoff marker
      const marker = new google.maps.Marker({
        position: { lat: dest.lat, lng: dest.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      markersRef.current.push(marker);

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      if (pickupLocation) {
        bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      }
      bounds.extend({ lat: dest.lat, lng: dest.lng });
      map.fitBounds(bounds, { top: 100, bottom: 100, left: 100, right: 100 });
    }
  }, [map, pickupLocation]);

  // Request taxi
  const requestTaxi = async () => {
    if (balance < estimatedPrice) {
      toast.error('잔액이 부족합니다', {
        description: '충전 후 이용해주세요.',
        action: {
          label: '충전하기',
          onClick: () => window.location.href = `/${locale}/wallet`,
        },
      });
      return;
    }

    setStep('searching');

    // Simulate taxi search
    setTimeout(() => {
      setStep('matched');

      // Animate taxi on map
      if (map && pickupLocation) {
        const taxiIcon = {
          path: 'M -8,-4 L 8,-4 L 8,4 L -8,4 Z',
          fillColor: '#FBBF24',
          fillOpacity: 1,
          strokeColor: '#000',
          strokeWeight: 1,
          scale: 1.5,
          rotation: 0,
        };

        taxiMarkerRef.current = new google.maps.Marker({
          position: {
            lat: pickupLocation.lat + 0.003,
            lng: pickupLocation.lng + 0.003,
          },
          map,
          icon: taxiIcon,
        });

        // Animate taxi moving
        let progress = 0;
        const animate = () => {
          progress += 0.02;
          if (progress >= 1 || !taxiMarkerRef.current) return;

          const newLat = (pickupLocation.lat + 0.003) + (pickupLocation.lat - (pickupLocation.lat + 0.003)) * progress;
          const newLng = (pickupLocation.lng + 0.003) + (pickupLocation.lng - (pickupLocation.lng + 0.003)) * progress;

          taxiMarkerRef.current.setPosition({ lat: newLat, lng: newLng });
          requestAnimationFrame(animate);
        };
        animate();
      }
    }, 3000);
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
        onLoad={() => setIsMapLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="h-screen bg-[#0A0A0F] flex flex-col relative">
        {/* Map Container */}
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Header */}
        <header className="relative z-10 bg-gradient-to-b from-[#0A0A0F] to-transparent p-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">K-Taxi</h1>
              <p className="text-white/50 text-xs">목적지만 말하세요</p>
            </div>
          </div>
        </header>

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="relative z-10 mt-auto bg-[#12121A] rounded-t-3xl border-t border-white/10"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3" />

          <AnimatePresence mode="wait">
            {/* Step 1: Pickup Location */}
            {step === 'pickup' && (
              <motion.div
                key="pickup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5"
              >
                <h2 className="text-white font-bold text-lg mb-4">어디로 갈까요?</h2>

                {/* Current Location */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-xs">출발지</p>
                    <p className="text-white text-sm font-medium">{pickupLocation?.address || 'Loading...'}</p>
                  </div>
                </div>

                {/* Popular Destinations */}
                <p className="text-white/50 text-sm mb-3">인기 목적지</p>
                <div className="space-y-2">
                  {popularDestinations.map((dest, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectDestination(dest)}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <MapPin className="w-5 h-5 text-red-400" />
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">{dest.nameEn}</p>
                        <p className="text-white/40 text-xs">{dest.name}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Vehicle Selection */}
            {step === 'vehicle' && (
              <motion.div
                key="vehicle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5"
              >
                <h2 className="text-white font-bold text-lg mb-4">차량을 선택하세요</h2>

                {/* Route Summary */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div className="w-0.5 h-8 bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm truncate">{pickupLocation?.address}</p>
                    <div className="h-4" />
                    <p className="text-white text-sm truncate">{dropoffLocation?.address}</p>
                  </div>
                </div>

                {/* Vehicle Options */}
                <div className="space-y-3 mb-4">
                  {vehicleTypes.map((vehicle) => (
                    <motion.button
                      key={vehicle.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedVehicle.id === vehicle.id
                          ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <span className="text-4xl">{vehicle.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold">{vehicle.name}</p>
                        <p className="text-white/50 text-xs">{vehicle.nameKo} • {vehicle.capacity}명</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          ₩{(vehicle.basePrice + Math.ceil(estimatedDistance * vehicle.pricePerKm)).toLocaleString()}
                        </p>
                        <p className="text-white/50 text-xs">~{vehicle.eta}분</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="p-4 bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-xl border border-[#3B82F6]/20 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60 text-sm">예상 요금</span>
                    <span className="text-white font-bold text-lg">₩{estimatedPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">USD</span>
                    <span className="text-white/60 text-sm">${(estimatedPrice / 1320).toFixed(2)}</span>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-white/50" />
                    <span className="text-white/60 text-sm">Ghost Wallet</span>
                  </div>
                  <span className={`font-bold ${balance >= estimatedPrice ? 'text-green-400' : 'text-red-400'}`}>
                    ₩{balance.toLocaleString()}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('pickup')}
                    className="px-6 py-4 bg-white/10 rounded-xl text-white font-medium"
                  >
                    뒤로
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={requestTaxi}
                    disabled={balance < estimatedPrice}
                    className="flex-1 py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl text-white font-bold disabled:opacity-50"
                  >
                    {balance < estimatedPrice ? '잔액 부족' : '택시 호출하기'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Searching */}
            {step === 'searching' && (
              <motion.div
                key="searching"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5 text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <Car className="w-16 h-16 text-yellow-400" />
                </motion.div>
                <h2 className="text-white font-bold text-xl mb-2">택시를 찾고 있습니다...</h2>
                <p className="text-white/50">잠시만 기다려주세요</p>
                <div className="mt-6 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-[#3B82F6] rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Matched */}
            {step === 'matched' && (
              <motion.div
                key="matched"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h2 className="text-white font-bold text-lg">택시가 배차되었습니다!</h2>
                </div>

                {/* Driver Info */}
                <div className="p-4 bg-white/5 rounded-xl mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                      🚕
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">김기사님</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white/60 text-sm">4.9 (2,340)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">32가 1234</p>
                      <p className="text-white/40 text-xs">소나타 (흰색)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">약 3분 후 도착 예정</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-400" />
                      <span className="text-white">결제 예정</span>
                    </div>
                    <span className="text-green-400 font-bold text-lg">₩{estimatedPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">Ghost Wallet에서 자동 결제됩니다</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 py-4 bg-white/10 rounded-xl text-white font-medium">
                    기사님께 연락
                  </button>
                  <button className="flex-1 py-4 bg-red-500/20 rounded-xl text-red-400 font-medium">
                    취소하기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}

// ============================================
// Helper Functions
// ============================================
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// Dark Map Style
// ============================================
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];
