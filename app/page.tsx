'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, TrendingUp, Cpu, ArrowRight, CheckCircle2, Clock, DollarSign, 
  Zap, Target, Search, Filter, X, Bell, Settings, BarChart3, History,
  AlertCircle, Info, MapPin, User, Package, Sparkles, Heart
} from 'lucide-react';
import DealApprovalModal from '@/components/nexus/DealApprovalModal';
import NotificationCenter from '@/components/nexus/NotificationCenter';
import StatsChart from '@/components/nexus/StatsChart';
import ForecastDashboard from '@/components/nexus/ForecastDashboard';
import AutoActionsPanel from '@/components/nexus/AutoActionsPanel';
import HumanTouchPanel from '@/components/nexus/HumanTouchPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Tesla Style Color Palette - 한국 고급스러운 톤
const colors = {
  bg: 'bg-[#F2F0EB]',
  card: 'bg-white',
  text: 'text-[#1A1A1A]',
  subText: 'text-gray-500',
  accent: 'text-[#B8860B]',
  border: 'border-gray-100',
  primary: 'bg-[#1A1A1A]',
};

interface SourcingMission {
  id: number;
  target: string;
  brand: string;
  status: '사냥중' | '협상중' | '완료';
  progress: number;
  foundPrice: number;
  marketPrice: number;
  margin: number;
  location?: string;
  timeRemaining?: string;
  createdAt: Date;
}

interface MarketOpportunity {
  id: number;
  item: string;
  brand: string;
  sourcingPrice: number;
  resalePrice: number;
  margin: number;
  urgency: 'high' | 'medium' | 'low';
}

interface Deal {
  id: string;
  item: string;
  brand: string;
  foundPrice: number;
  marketPrice: number;
  margin: number;
  location: string;
  seller: string;
  condition: string;
  estimatedDelivery: string;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function NexusDashboard() {
  // State Management
  const [missions, setMissions] = useState<SourcingMission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_missions');
      if (saved) return JSON.parse(saved).map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) }));
    }
    return [
      { 
        id: 1, 
        target: '롤렉스 서브마리너 데이트', 
        brand: 'Rolex',
        status: '협상중' as const, 
        progress: 75, 
        foundPrice: 13500000, 
        marketPrice: 16000000, 
        margin: 18.5,
        location: '홍콩',
        timeRemaining: '2시간 15분',
        createdAt: new Date(),
      },
      { 
        id: 2, 
        target: '샤넬 클래식 플랩 백 (블랙)', 
        brand: 'Chanel',
        status: '사냥중' as const, 
        progress: 30, 
        foundPrice: 0, 
        marketPrice: 10200000, 
        margin: 0,
        location: '파리',
        timeRemaining: '4시간 30분',
        createdAt: new Date(),
      },
      {
        id: 3,
        target: '에르메스 미니 켈리 II',
        brand: 'Hermès',
        status: '사냥중' as const,
        progress: 45,
        foundPrice: 0,
        marketPrice: 38000000,
        margin: 0,
        location: '도쿄',
        timeRemaining: '1시간 45분',
        createdAt: new Date(),
      },
    ];
  });

  const [opportunities] = useState<MarketOpportunity[]>([
    {
      id: 1,
      item: '에르메스 미니 켈리 II',
      brand: 'Hermès',
      sourcingPrice: 28500000,
      resalePrice: 34000000,
      margin: 19.2,
      urgency: 'high',
    },
    {
      id: 2,
      item: '롤렉스 GMT-마스터 II',
      brand: 'Rolex',
      sourcingPrice: 18500000,
      resalePrice: 22000000,
      margin: 18.9,
      urgency: 'medium',
    },
    {
      id: 3,
      item: '샤넬 보이 백',
      brand: 'Chanel',
      sourcingPrice: 8500000,
      resalePrice: 10200000,
      margin: 20.0,
      urgency: 'high',
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingDeal, setPendingDeal] = useState<Deal | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '사냥중' | '협상중' | '완료'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'missions' | 'forecast' | 'actions' | 'human'>('missions');

  // Statistics
  const [totalProfit, setTotalProfit] = useState(0);
  const [activeMissions, setActiveMissions] = useState(3);
  const [completedToday, setCompletedToday] = useState(12);
  const [chartData, setChartData] = useState([
    { date: '월', profit: 2500000, missions: 3 },
    { date: '화', profit: 3200000, missions: 4 },
    { date: '수', profit: 2800000, missions: 3 },
    { date: '목', profit: 4100000, missions: 5 },
    { date: '금', profit: 3800000, missions: 4 },
    { date: '토', profit: 2900000, missions: 3 },
    { date: '일', profit: 0, missions: 0 },
  ]);

  // Local Storage Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_missions', JSON.stringify(missions));
    }
  }, [missions]);

  // Real-time AI Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMissions((prev) => {
        const updated = prev.map((m) => {
          if (m.status === '협상중' && m.progress < 95) {
            const newProgress = Math.min(m.progress + Math.random() * 3, 95);
            const newMargin = m.status === '협상중' ? Math.min(m.margin + 0.1, 25) : m.margin;
            
            if (newProgress >= 95 && m.progress < 95) {
              addNotification({
                type: 'success',
                title: '협상 완료',
                message: `${m.target} 협상이 완료되었습니다. 거래 승인을 기다립니다.`,
              });
              
              setTimeout(() => {
                const deal: Deal = {
                  id: `deal-${m.id}`,
                  item: m.target,
                  brand: m.brand,
                  foundPrice: m.foundPrice,
                  marketPrice: m.marketPrice,
                  margin: newMargin,
                  location: m.location || '글로벌',
                  seller: 'Verified Seller',
                  condition: '새제품',
                  estimatedDelivery: '3-5일',
                };
                setPendingDeal(deal);
                setIsDealModalOpen(true);
              }, 1000);
            }
            
            return { 
              ...m, 
              progress: newProgress,
              margin: newMargin,
            };
          } else if (m.status === '사냥중' && m.progress < 90) {
            const newProgress = Math.min(m.progress + Math.random() * 2, 90);
            
            if (newProgress >= 50 && m.progress < 50 && m.foundPrice === 0) {
              addNotification({
                type: 'info',
                title: '상품 발견',
                message: `${m.target} 후보 상품을 발견했습니다.`,
              });
            }
            
            return { 
              ...m, 
              progress: newProgress,
            };
          }
          return m;
        });
        return updated;
      });

      const profit = missions
        .filter(m => m.status === '협상중' && m.foundPrice > 0)
        .reduce((acc, m) => acc + (m.marketPrice - m.foundPrice), 0);
      setTotalProfit(profit);
      setActiveMissions(missions.filter(m => m.status !== '완료').length);
    }, 2000);
    return () => clearInterval(interval);
  }, [missions]);

  // Notification Management
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Deal Management
  const handleApproveDeal = useCallback((dealId: string) => {
    const mission = missions.find(m => `deal-${m.id}` === dealId);
    if (mission) {
      setMissions((prev) => prev.map(m => 
        m.id === mission.id ? { ...m, status: '완료' as const, progress: 100 } : m
      ));
      setCompletedToday((prev) => prev + 1);
      addNotification({
        type: 'success',
        title: '거래 승인 완료',
        message: `${mission.target} 거래가 승인되었습니다.`,
      });
    }
    setIsDealModalOpen(false);
    setPendingDeal(null);
  }, [missions, addNotification]);

  const handleRejectDeal = useCallback((dealId: string) => {
    setIsDealModalOpen(false);
    setPendingDeal(null);
    addNotification({
      type: 'warning',
      title: '거래 거절',
      message: '거래가 거절되었습니다.',
    });
  }, [addNotification]);

  // Mission Management
  const handleStartHunt = useCallback((opportunity: MarketOpportunity) => {
    const newMission: SourcingMission = {
      id: Date.now(),
      target: opportunity.item,
      brand: opportunity.brand,
      status: '사냥중',
      progress: 0,
      foundPrice: 0,
      marketPrice: opportunity.resalePrice,
      margin: 0,
      location: '글로벌',
      timeRemaining: '5시간',
      createdAt: new Date(),
    };
    setMissions((prev) => [newMission, ...prev]);
    setActiveMissions((prev) => prev + 1);
    addNotification({
      type: 'info',
      title: '새 미션 시작',
      message: `${opportunity.item} 소싱을 시작했습니다.`,
    });
  }, [addNotification]);

  // Filtering
  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const completedMissions = missions.filter(m => m.status === '완료');

  return (
    <div className={`min-h-screen ${colors.bg} p-6 lg:p-8 font-sans`}>
      {/* 헤더 */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 lg:mb-12 gap-4"
      >
        <div>
          <h1 className={`text-3xl lg:text-4xl font-bold ${colors.text} tracking-tight mb-1`}>
            넥서스 에이전트
          </h1>
          <p className={`${colors.subText} text-sm`}>
            AI 자동 소싱 운영 센터 • 서울
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            시스템 정상 운영
          </div>
          <div className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm border border-gray-100">
            <span className="text-gray-500">활성 미션: </span>
            <span className="font-bold text-[#1A1A1A]">{activeMissions}개</span>
          </div>
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearAllNotifications}
          />
          <Button variant="ghost" size="icon" className="rounded-xl" title="설정">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">예상 총 수익</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">활성 미션</p>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{activeMissions}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">오늘 완료</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{completedToday}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">평균 수익률</p>
              <TrendingUp className="w-5 h-5 text-[#B8860B]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">
              {missions.filter(m => m.margin > 0).length > 0
                ? `${(missions.reduce((acc, m) => acc + m.margin, 0) / missions.filter(m => m.margin > 0).length).toFixed(1)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 탭 네비게이션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 mb-6 overflow-x-auto"
      >
        {[
          { id: 'missions', label: '활성 미션', icon: Target },
          { id: 'forecast', label: 'AI 예측', icon: BarChart3 },
          { id: 'actions', label: '자동 액션', icon: Zap },
          { id: 'human', label: '감성 분석', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className="rounded-xl flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </motion.div>

      {/* 차트 섹션 */}
      {activeTab === 'missions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <StatsChart data={chartData} />
        </motion.div>
      )}

      {/* 필터 및 검색 (미션 탭에서만) */}
      {activeTab === 'missions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="미션 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                title="검색어 지우기"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', '사냥중', '협상중', '완료'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className="rounded-xl"
              >
                {status === 'all' ? '전체' : status}
              </Button>
            ))}
            <Button
              variant={showHistory ? 'default' : 'outline'}
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-xl"
            >
              <History className="w-4 h-4 mr-2" />
              히스토리
            </Button>
          </div>
        </motion.div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* 왼쪽: 메인 컨텐츠 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'missions' && (
              <motion.div
                key="missions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl lg:text-2xl font-bold ${colors.text}`}>
                    {showHistory ? '완료된 미션' : '활성 미션'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {showHistory ? `${completedMissions.length}개` : '실시간 업데이트'}
                  </span>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {(showHistory ? completedMissions : filteredMissions).map((mission, index) => (
                    <motion.div
                      key={mission.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${colors.card} p-6 rounded-2xl shadow-sm border ${colors.border} relative overflow-hidden group hover:shadow-lg transition-all`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            mission.status === '사냥중' 
                              ? 'bg-blue-50 text-blue-600' 
                              : mission.status === '협상중'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {mission.status === '사냥중' ? (
                              <Cpu size={24} />
                            ) : mission.status === '협상중' ? (
                              <ShieldCheck size={24} />
                            ) : (
                              <CheckCircle2 size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-[#1A1A1A]">{mission.target}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {mission.brand}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium uppercase tracking-wider">{mission.status}</span>
                              {mission.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {mission.location}
                                  </span>
                                </>
                              )}
                              {mission.timeRemaining && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {mission.timeRemaining}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {mission.status === '협상중' && mission.margin > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">목표 수익률</p>
                            <p className="text-2xl font-bold text-green-600">{mission.margin.toFixed(1)}%</p>
                            {mission.foundPrice > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatCurrency(mission.foundPrice)}
                              </p>
                            )}
                          </div>
                        )}
                        {mission.status === '완료' && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">완료 수익률</p>
                            <p className="text-2xl font-bold text-green-600">{mission.margin.toFixed(1)}%</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatCurrency(mission.marketPrice - mission.foundPrice)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          className={`h-full ${
                            mission.status === '사냥중' 
                              ? 'bg-blue-500' 
                              : mission.status === '협상중'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${mission.progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-sm">
                        <p className="text-gray-500 flex items-center gap-2">
                          <Zap size={14} className="text-amber-500" />
                          {mission.status === '사냥중' && 'AI가 전 세계 42개 부티크를 분석 중...'}
                          {mission.status === '협상중' && 'AI가 가격 협상을 진행 중...'}
                          {mission.status === '완료' && '거래가 완료되었습니다.'}
                        </p>
                        <button className="flex items-center gap-2 font-medium text-[#1A1A1A] hover:text-[#B8860B] transition-colors">
                          상세 보기
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredMissions.length === 0 && (
                  <Card className="border-border bg-card rounded-2xl p-12 text-center">
                    <p className="text-gray-500">검색 결과가 없습니다.</p>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'forecast' && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <ForecastDashboard type="sales" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ForecastDashboard type="inventory" />
                  <ForecastDashboard type="churn" />
                </div>
              </motion.div>
            )}

            {activeTab === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AutoActionsPanel />
              </motion.div>
            )}

            {activeTab === 'human' && (
              <motion.div
                key="human"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <HumanTouchPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 오른쪽: 시장 기회 */}
        {activeTab === 'missions' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`${colors.card} p-6 lg:p-8 rounded-2xl shadow-sm border ${colors.border} h-fit`}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className={`w-6 h-6 ${colors.accent}`} />
              <h2 className="text-xl lg:text-2xl font-bold text-[#1A1A1A]">시장 기회</h2>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {opportunities.map((opp, index) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-[#F9F9F9] rounded-xl border border-gray-100 hover:border-[#B8860B]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">추천 상품</p>
                        <h4 className="font-bold text-base mb-1 text-[#1A1A1A]">{opp.item}</h4>
                        <p className="text-xs text-gray-500">{opp.brand}</p>
                      </div>
                      {opp.urgency === 'high' && (
                        <Badge className="bg-red-50 text-red-600 border-red-200">
                          긴급
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">소싱 가격</span>
                        <span className="font-bold text-[#1A1A1A]">{formatCurrency(opp.sourcingPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">예상 재판매가</span>
                        <span className="font-bold text-[#1A1A1A]">{formatCurrency(opp.resalePrice)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <Badge className="bg-green-50 text-green-600 border-green-200 font-bold">
                        +{opp.margin}% 수익률
                      </Badge>
                      <Button 
                        onClick={() => handleStartHunt(opp)}
                        className="bg-[#1A1A1A] text-white rounded-xl hover:bg-black flex items-center gap-2"
                      >
                        <Target size={14} />
                        사냥 시작
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                넥서스 에이전트 엔진 v2.4로 구동
              </p>
              <p className="text-xs text-gray-400 mt-1">
                실시간 AI 분석 • 글로벌 시장 모니터링
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Deal Approval Modal */}
      <DealApprovalModal
        deal={pendingDeal}
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onApprove={handleApproveDeal}
        onReject={handleRejectDeal}
      />
    </div>
  );
}
