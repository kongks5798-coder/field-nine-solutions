'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardHeader from '@/components/nexus/DashboardHeader';
import ActiveMissionsCard from '@/components/nexus/ActiveMissionsCard';
import RealTimeFeed from '@/components/nexus/RealTimeFeed';
import NegotiationStatus from '@/components/nexus/NegotiationStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/components/providers/SessionProvider';
import { useRouter } from 'next/navigation';

/**
 * Nexus Agent Dashboard
 * 2026 Agentic Workflow: Main dashboard where users see AI Agent in action
 * 
 * This dashboard displays:
 * - Active missions (what AI is hunting)
 * - Real-time feed of found items with profit margins
 * - Negotiation status with progress bars
 * - Approve Deal floating button
 */

interface Mission {
  id: string;
  item: string;
  quantity: number;
  status: 'hunting' | 'found' | 'negotiating';
  progress?: number;
}

interface FoundItem {
  id: string;
  item: string;
  brand: string;
  foundPrice: number;
  targetPrice: number;
  profitMargin: number;
  status: 'found' | 'negotiating' | 'approved';
  timestamp: Date;
}

interface Negotiation {
  id: string;
  item: string;
  currentDiscount: number;
  targetDiscount: number;
  status: 'in-progress' | 'completed' | 'failed';
  messages: number;
}

export default function DashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);

  // 세션 확인 및 리다이렉트
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard');
    }
  }, [user, sessionLoading, router]);

  // 데이터 로드
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // 실제 API 호출 (현재는 Mock 데이터)
        // TODO: 실제 API 엔드포인트로 교체
        const [missionsRes, itemsRes, negotiationsRes] = await Promise.all([
          fetch('/api/dashboard/missions').catch(() => null),
          fetch('/api/dashboard/items').catch(() => null),
          fetch('/api/dashboard/negotiations').catch(() => null),
        ]);

        // Mock 데이터 (실제 API가 없을 경우)
        setMissions([
          { id: '1', item: '롤렉스 서브마리너', quantity: 5, status: 'hunting', progress: 45 },
          { id: '2', item: '샤넬 클래식 플랩', quantity: 3, status: 'negotiating', progress: 75 },
        ]);

        setFoundItems([
          {
            id: '1',
            item: '에르메스 미니 켈리',
            brand: 'Hermès',
            foundPrice: 28500000,
            targetPrice: 34000000,
            profitMargin: 19.2,
            status: 'found',
            timestamp: new Date(),
          },
        ]);

        setNegotiations([
          {
            id: '1',
            item: '롤렉스 GMT-마스터',
            currentDiscount: 5,
            targetDiscount: 15,
            status: 'in-progress',
            messages: 12,
          },
        ]);

        setPendingApprovals(2);
      } catch (error) {
        console.error('[Dashboard] 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-[#F2F0EB] p-6 lg:p-8">
      <DashboardHeader user={user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <ActiveMissionsCard missions={missions} />
          <RealTimeFeed items={foundItems} />
        </div>
        
        <div className="space-y-6">
          <NegotiationStatus negotiations={negotiations} />
        </div>
      </div>

      {pendingApprovals > 0 && (
        <motion.button
          className="fixed bottom-8 right-8 bg-[#1A1A1A] text-white p-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CheckCircle2 size={24} />
          <span className="font-semibold">거래 승인 ({pendingApprovals})</span>
        </motion.button>
      )}
    </div>
  );
}
