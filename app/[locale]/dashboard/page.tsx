/**
 * K-UNIVERSAL Main Dashboard (i18n)
 * Integrated with Google Maps and K-Lifestyle services
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import { useTranslations, useLocale } from 'next-intl';
import { searchRestaurantsGPS, type RestaurantSpot } from '@/lib/lifestyle/restaurant-gps';

export default function DashboardPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbySpots, setNearbySpots] = useState<RestaurantSpot[]>([]);
  const [activeService, setActiveService] = useState<'taxi' | 'delivery' | 'restaurants' | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  // Initialize Google Maps after script loads
  useEffect(() => {
    if (!isMapLoaded || !window.google) return;

    const initMap = async () => {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);

            // Create map
            const mapInstance = new google.maps.Map(mapRef.current!, {
              center: location,
              zoom: 15,
              styles: [
                {
                  featureType: 'all',
                  elementType: 'all',
                  stylers: [{ saturation: -20 }],
                },
              ],
            });

            setMap(mapInstance);

            // Add user marker
            new google.maps.Marker({
              position: location,
              map: mapInstance,
              title: 'Your Location',
            });

            // Load nearby restaurants
            const spots = await searchRestaurantsGPS({
              latitude: location.lat,
              longitude: location.lng,
              radius: 2,
              foreignerFriendly: true,
            });
            setNearbySpots(spots);

            // Add restaurant markers
            spots.forEach((spot) => {
              new google.maps.Marker({
                position: {
                  lat: spot.location.latitude,
                  lng: spot.location.longitude,
                },
                map: mapInstance,
                title: spot.nameEn,
              });
            });
          },
          () => {
            // Default to Seoul
            const defaultLocation = { lat: 37.5665, lng: 126.9780 };
            const mapInstance = new google.maps.Map(mapRef.current!, {
              center: defaultLocation,
              zoom: 13,
            });
            setMap(mapInstance);
          }
        );
      }
    };

    initMap();
  }, [isMapLoaded]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
        onLoad={() => setIsMapLoaded(true)}
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#F9F9F7]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href={`/${locale}`} className="text-2xl font-bold text-gray-900">
              {t('title')}
            </Link>
            <nav className="flex gap-6">
              <Link href={`/${locale}/demo`} className="text-gray-600 hover:text-gray-900">
                {tNav('demo')}
              </Link>
              <Link href={`/${locale}/wallet`} className="text-gray-600 hover:text-gray-900">
                {tNav('wallet')}
              </Link>
              <Link href={`/${locale}/kyc`} className="text-gray-600 hover:text-gray-900">
                {tNav('kyc')}
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Sidebar - K-Lifestyle Services */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('kLifestyle')}</h2>

              {/* Service Cards */}
              <div className="space-y-4">
                {/* UT Taxi */}
                <motion.button
                  onClick={() => setActiveService('taxi')}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                    activeService === 'taxi'
                      ? 'border-[#0066FF] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-3">🚕</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('taxi.title')}</h3>
                  <p className="text-sm text-gray-600">{t('taxi.desc')}</p>
                </motion.button>

                {/* Delivery */}
                <motion.button
                  onClick={() => setActiveService('delivery')}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                    activeService === 'delivery'
                      ? 'border-[#0066FF] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-3">🍔</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('delivery.title')}</h3>
                  <p className="text-sm text-gray-600">{t('delivery.desc')}</p>
                </motion.button>

                {/* Restaurant GPS */}
                <motion.button
                  onClick={() => setActiveService('restaurants')}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                    activeService === 'restaurants'
                      ? 'border-[#0066FF] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-3">🍜</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('restaurants.title')}</h3>
                  <p className="text-sm text-gray-600">{t('restaurants.desc')}</p>
                </motion.button>
              </div>

              {/* Nearby Spots */}
              {activeService === 'restaurants' && nearbySpots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('restaurants.nearby')}</h3>
                  <div className="space-y-3">
                    {nearbySpots.map((spot) => (
                      <div
                        key={spot.id}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{spot.nameEn}</h4>
                            <p className="text-xs text-gray-500">{spot.name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-semibold">{spot.rating}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {spot.category} • {spot.priceRange} • {spot.distance.toFixed(1)}km
                        </div>
                        {spot.foreignerFriendly && (
                          <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            {t('restaurants.foreignerFriendly')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </aside>

          {/* Main Content - Google Maps */}
          <main className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />

            {/* Floating Stats */}
            <div className="absolute top-6 right-6 space-y-3">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-3xl font-bold text-[#0066FF]">{nearbySpots.length}</div>
                <div className="text-sm text-gray-600">{t('stats.nearby')}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-3xl font-bold text-[#00C853]">99%</div>
                <div className="text-sm text-gray-600">{t('stats.accuracy')}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">{t('stats.support')}</div>
              </motion.div>
            </div>

            {/* Service Status */}
            {activeService && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-2xl p-6 max-w-md"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {activeService === 'taxi' && `🚕 ${t('taxi.ready')}`}
                  {activeService === 'delivery' && `🍔 ${t('delivery.available')}`}
                  {activeService === 'restaurants' && `🍜 ${t('restaurants.explore')}`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeService === 'taxi' && t('taxi.instruction')}
                  {activeService === 'delivery' && `${nearbySpots.length} ${t('delivery.instruction')}`}
                  {activeService === 'restaurants' && t('restaurants.instruction')}
                </p>
                <button className="w-full py-3 bg-[#0066FF] text-white font-semibold rounded-xl hover:bg-[#0052CC] transition-colors">
                  {activeService === 'taxi' && t('taxi.button')}
                  {activeService === 'delivery' && t('delivery.button')}
                  {activeService === 'restaurants' && t('restaurants.button')}
                </button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
