'use client';

import { useEffect, useRef, useState } from 'react';

export default function DashboardPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Google Maps API 로드
    const loadGoogleMaps = () => {
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else if (window.google) {
        initMap();
      }
    };

    const initMap = () => {
      if (mapRef.current && window.google) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.9780 }, // Seoul
          zoom: 12,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#F9F9F7' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#C9E4FF' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#FFFFFF' }],
            },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        });

        // 샘플 마커
        new window.google.maps.Marker({
          position: { lat: 37.5665, lng: 126.9780 },
          map: map,
          title: 'Seoul HQ',
        });

        setMapLoaded(true);
      }
    };

    loadGoogleMaps();
  }, []);

  return (
    <div className="h-screen w-full bg-[#F9F9F7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">K-Universal Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            KYC 상태
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            지갑
          </button>
          <button className="px-4 py-2 bg-[#0066FF] text-white rounded-lg text-sm font-semibold hover:bg-[#0052CC] transition-colors">
            프로필
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Verified Users</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Active Wallets</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Pending KYC</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Recent Activity
            </h2>
            <div className="text-sm text-gray-600">
              No recent activity
            </div>
          </div>
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F7]">
              <div className="text-center space-y-4">
                <div className="text-4xl">🗺️</div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// TypeScript 타입 확장
declare global {
  interface Window {
    google: any;
  }
}
