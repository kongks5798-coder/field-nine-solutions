/**
 * K-UNIVERSAL Main Dashboard
 * Integrated with Google Maps and K-Lifestyle services
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { searchRestaurantsGPS, type RestaurantSpot } from '@/lib/lifestyle/restaurant-gps';
import { requestTaxi } from '@/lib/lifestyle/ut-taxi';
import { searchRestaurants, type Restaurant } from '@/lib/lifestyle/delivery';

/// <reference types="@googlemaps/js-api-loader" />

export default function DashboardPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbySpots, setNearbySpots] = useState<RestaurantSpot[]>([]);
  const [activeService, setActiveService] = useState<'taxi' | 'delivery' | 'restaurants' | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });

      const { Map } = await loader.importLibrary('maps');
      const { Marker } = await loader.importLibrary('marker');

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
            const mapInstance = new Map(mapRef.current!, {
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
            new Marker({
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
              new Marker({
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
            const mapInstance = new Map(mapRef.current!, {
              center: defaultLocation,
              zoom: 13,
            });
            setMap(mapInstance);
          }
        );
      }
    };

    initMap();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            K-UNIVERSAL
          </Link>
          <nav className="flex gap-6">
            <Link href="/demo" className="text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <Link href="/wallet" className="text-gray-600 hover:text-gray-900">
              Wallet
            </Link>
            <Link href="/kyc/upload" className="text-gray-600 hover:text-gray-900">
              KYC
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - K-Lifestyle Services */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">K-Lifestyle</h2>

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
                <h3 className="text-lg font-bold text-gray-900 mb-2">UT Taxi</h3>
                <p className="text-sm text-gray-600">
                  Book rides without Korean phone number
                </p>
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">Food Delivery</h3>
                <p className="text-sm text-gray-600">
                  Order from any restaurant in English
                </p>
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">Restaurant GPS</h3>
                <p className="text-sm text-gray-600">
                  Discover hidden gems near you
                </p>
              </motion.button>
            </div>

            {/* Nearby Spots */}
            {activeService === 'restaurants' && nearbySpots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Spots</h3>
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
                          Foreigner Friendly
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
              <div className="text-3xl font-bold text-[#0066FF]">
                {nearbySpots.length}
              </div>
              <div className="text-sm text-gray-600">Nearby Spots</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="text-3xl font-bold text-[#00C853]">99%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">AI Support</div>
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
                {activeService === 'taxi' && '🚕 UT Taxi Ready'}
                {activeService === 'delivery' && '🍔 Delivery Available'}
                {activeService === 'restaurants' && '🍜 Explore Restaurants'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeService === 'taxi' &&
                  'Tap anywhere on the map to set your destination.'}
                {activeService === 'delivery' &&
                  `${nearbySpots.length} restaurants ready to deliver to your location.`}
                {activeService === 'restaurants' &&
                  'Check out the best spots in your area. All verified for foreigners!'}
              </p>
              <button className="w-full py-3 bg-[#0066FF] text-white font-semibold rounded-xl hover:bg-[#0052CC] transition-colors">
                {activeService === 'taxi' && 'Book Ride'}
                {activeService === 'delivery' && 'Browse Menu'}
                {activeService === 'restaurants' && 'Make Reservation'}
              </button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
