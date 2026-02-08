'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: LIVE ENERGY MIX WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * 플랫폼 에너지 거래 비중 시각화 + 원산지 증명서
 * Warm Ivory 배경 + Deep Black 라인 애니메이션
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEnergyMix, EnergyMix, OriginCertificate, ENERGY_SOURCES } from '@/lib/energy/sources';

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE ENERGY MIX VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════

export function LiveEnergyMixWidget() {
  const [mix, setMix] = useState<EnergyMix[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const updateMix = () => {
      const newMix = calculateEnergyMix();
      setMix(newMix);
      setTotalVolume(newMix.reduce((sum, m) => sum + m.totalKWh, 0));
    };

    updateMix();
    const interval = setInterval(updateMix, 5000);

    // Animation loop for flowing lines
    const animInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(animInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F9F9F7] rounded-2xl p-6 border border-[#171717]/10 relative overflow-hidden"
    >
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-[#171717]/10 to-transparent"
            style={{
              top: `${10 + i * 10}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scaleX: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#171717]">Live Energy Mix</h3>
          <p className="text-xs text-[#171717]/50">실시간 에너지 거래 비중</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
          <span className="text-xs font-bold text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* Energy Mix Bar */}
      <div className="relative h-12 bg-[#171717]/5 rounded-xl overflow-hidden mb-4">
        <div className="absolute inset-0 flex">
          {mix.map((item, i) => (
            <motion.div
              key={item.type}
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="h-full relative group"
              style={{ backgroundColor: item.color }}
            >
              {/* Flowing animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />

              {/* Percentage label */}
              {item.percentage >= 10 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm drop-shadow-lg">
                    {item.icon} {item.percentage}%
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="relative grid grid-cols-3 gap-3">
        {mix.map(item => (
          <motion.div
            key={item.type}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#171717]/5"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-bold text-[#171717] truncate">
                  {item.type}
                </span>
              </div>
              <div className="text-[10px] text-[#171717]/50">
                {(item.totalKWh / 1000).toFixed(0)}K kWh
              </div>
            </div>
            <div className="text-sm font-bold text-[#171717]">
              {item.percentage}%
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total Volume */}
      <div className="relative mt-4 pt-4 border-t border-[#171717]/10 flex items-center justify-between">
        <div className="text-sm text-[#171717]/60">Total Trading Volume</div>
        <div className="text-lg font-black text-[#171717]">
          {(totalVolume / 1000000).toFixed(2)}M kWh
        </div>
      </div>

      {/* Decorative flowing lines */}
      <svg className="absolute bottom-0 left-0 right-0 h-1 overflow-visible pointer-events-none">
        <motion.line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          stroke="#171717"
          strokeWidth="2"
          strokeDasharray="10 5"
          animate={{
            strokeDashoffset: [0, -30],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY ENERGY CERTIFICATES (Profile Tab)
// ═══════════════════════════════════════════════════════════════════════════════

interface MyEnergyCertificatesProps {
  certificates?: OriginCertificate[];
}

export function MyEnergyCertificates({ certificates = [] }: MyEnergyCertificatesProps) {
  // Demo certificates if none provided
  const demoCertificates: OriginCertificate[] = certificates.length > 0 ? certificates : [
    {
      id: 'F9-CERT-2026012501-ABC123',
      sourceId: 'F9-SOLAR-001',
      sourceName: 'Yeongdong Solar Farm',
      sourceType: 'SOLAR',
      purchaseAmount: 5000,
      purchasePrice: 5400,
      carbonOffset: 2500,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      qrCode: 'https://m.fieldnine.io/verify/F9-CERT-2026012501-ABC123',
      re100Eligible: true,
    },
    {
      id: 'F9-CERT-2026012402-DEF456',
      sourceId: 'F9-WIND-001',
      sourceName: 'Jeju Offshore Wind',
      sourceType: 'WIND',
      purchaseAmount: 10000,
      purchasePrice: 8750,
      carbonOffset: 5000,
      issuedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 364 * 24 * 60 * 60 * 1000).toISOString(),
      qrCode: 'https://m.fieldnine.io/verify/F9-CERT-2026012402-DEF456',
      re100Eligible: true,
    },
  ];

  const [selectedCert, setSelectedCert] = useState<OriginCertificate | null>(null);

  const getSourceMeta = (sourceId: string) => {
    const source = ENERGY_SOURCES[sourceId];
    return source?.metadata || { icon: '⚡', color: '#171717' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#171717]">My Energy Certificates</h3>
          <p className="text-xs text-[#171717]/50">디지털 원산지 증명서</p>
        </div>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
          {demoCertificates.length} Certificates
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoCertificates.map(cert => {
          const meta = getSourceMeta(cert.sourceId);
          return (
            <motion.div
              key={cert.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedCert(cert)}
              className="bg-white rounded-2xl p-5 border border-[#171717]/10 cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <span className="text-xl">{meta.icon}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#171717]">{cert.sourceType}</div>
                    <div className="text-xs text-[#171717]/50">{cert.sourceName}</div>
                  </div>
                </div>
                {cert.re100Eligible && (
                  <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                    RE100
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#171717]/50">Energy Purchased</span>
                  <span className="font-bold">{cert.purchaseAmount.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#171717]/50">Carbon Offset</span>
                  <span className="font-bold text-emerald-600">{cert.carbonOffset.toLocaleString()} kg CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#171717]/50">Price Paid</span>
                  <span className="font-bold text-amber-600">{cert.purchasePrice.toLocaleString()} KAUS</span>
                </div>
              </div>

              {/* Certificate ID */}
              <div className="mt-4 pt-3 border-t border-[#171717]/10">
                <div className="text-[10px] text-[#171717]/40 font-mono truncate">
                  {cert.id}
                </div>
                <div className="text-[10px] text-[#171717]/30 mt-1">
                  Valid until {new Date(cert.validUntil).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              {/* Certificate Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📜</span>
                </div>
                <h2 className="text-xl font-black text-[#171717]">Origin Certificate</h2>
                <p className="text-sm text-[#171717]/50">Sovereign Proof of Origin</p>
              </div>

              {/* Certificate Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-[#171717]/5 rounded-xl">
                  <span className="text-[#171717]/60">Certificate ID</span>
                  <span className="font-mono text-xs">{selectedCert.id}</span>
                </div>
                <div className="flex justify-between p-3 bg-[#171717]/5 rounded-xl">
                  <span className="text-[#171717]/60">Energy Source</span>
                  <span className="font-bold">{selectedCert.sourceName}</span>
                </div>
                <div className="flex justify-between p-3 bg-[#171717]/5 rounded-xl">
                  <span className="text-[#171717]/60">Amount</span>
                  <span className="font-bold">{selectedCert.purchaseAmount.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-700">Carbon Offset</span>
                  <span className="font-bold text-emerald-700">{selectedCert.carbonOffset.toLocaleString()} kg CO₂</span>
                </div>
                <div className="flex justify-between p-3 bg-[#171717]/5 rounded-xl">
                  <span className="text-[#171717]/60">Issue Date</span>
                  <span className="font-bold">{new Date(selectedCert.issuedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-[#171717]/5 rounded-xl">
                  <span className="text-[#171717]/60">Valid Until</span>
                  <span className="font-bold">{new Date(selectedCert.validUntil).toLocaleDateString()}</span>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto bg-[#171717]/5 rounded-xl flex items-center justify-center">
                  <div className="text-4xl">🔗</div>
                </div>
                <p className="text-xs text-[#171717]/40 mt-2">Scan to verify</p>
              </div>

              {/* RE100 Badge */}
              {selectedCert.re100Eligible && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-bold text-emerald-700">RE100 Eligible</div>
                      <div className="text-xs text-emerald-600">100% Renewable Energy Certificate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCert(null)}
                className="w-full py-3 bg-[#171717] text-white font-bold rounded-xl"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY STATS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

export function EnergyStatsSummary() {
  const stats = {
    totalPurchased: 15000,
    totalCarbonOffset: 7500,
    totalSpent: 14150,
    certificatesCount: 2,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-4 border border-[#171717]/10 text-center">
        <div className="text-2xl font-black text-[#171717]">
          {(stats.totalPurchased / 1000).toFixed(0)}K
        </div>
        <div className="text-xs text-[#171717]/50">kWh Purchased</div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-[#171717]/10 text-center">
        <div className="text-2xl font-black text-emerald-600">
          {(stats.totalCarbonOffset / 1000).toFixed(1)}t
        </div>
        <div className="text-xs text-[#171717]/50">CO₂ Offset</div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-[#171717]/10 text-center">
        <div className="text-2xl font-black text-amber-600">
          {(stats.totalSpent / 1000).toFixed(1)}K
        </div>
        <div className="text-xs text-[#171717]/50">KAUS Spent</div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-[#171717]/10 text-center">
        <div className="text-2xl font-black text-[#171717]">
          {stats.certificatesCount}
        </div>
        <div className="text-xs text-[#171717]/50">Certificates</div>
      </div>
    </div>
  );
}
