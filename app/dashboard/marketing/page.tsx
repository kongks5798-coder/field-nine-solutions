'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Target,
  Globe,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: 통합 마케팅 분석 대시보드
 * 
 * 모든 광고 플랫폼의 데이터를 통합하여 보여주는 엔터프라이즈급 대시보드
 */
export default function MarketingDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: 30, end: 0 }); // days ago

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = new Date(Date.now() - dateRange.start * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() - dateRange.end * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `/api/marketing/analytics?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const response = await fetch('/api/marketing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: 'all',
          platform: 'all',
          dateRange: {
            start: new Date(Date.now() - dateRange.start * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() - dateRange.end * 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('동기화 작업이 시작되었습니다.');
        setTimeout(fetchAnalytics, 5000); // 5초 후 새로고침
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">통합 마케팅 분석</h1>
            <p className="text-muted-foreground">모든 광고 플랫폼의 성과를 한눈에</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: parseInt(e.target.value) })}
              className="px-4 py-2 border border-border rounded bg-card text-sm"
            >
              <option value={7}>최근 7일</option>
              <option value={30}>최근 30일</option>
              <option value={90}>최근 90일</option>
              <option value={365}>최근 1년</option>
            </select>
            <Button
              onClick={handleSync}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              동기화
            </Button>
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest">총 노출</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light">{analytics.summary.totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest">총 클릭</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light">{analytics.summary.totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest">총 지출</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light">₩{analytics.summary.totalSpend.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest">총 매출</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light">₩{analytics.summary.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-foreground text-background border-foreground">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest text-background/60">통합 ROAS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light">{analytics.summary.overallROAS.toFixed(2)}x</div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-light">플랫폼별 성과</CardTitle>
            <CardDescription>매체별 상세 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium uppercase tracking-widest text-xs">플랫폼</th>
                    <th className="text-right py-3 px-4 font-medium uppercase tracking-widest text-xs">노출</th>
                    <th className="text-right py-3 px-4 font-medium uppercase tracking-widest text-xs">클릭</th>
                    <th className="text-right py-3 px-4 font-medium uppercase tracking-widest text-xs">지출</th>
                    <th className="text-right py-3 px-4 font-medium uppercase tracking-widest text-xs">매출</th>
                    <th className="text-right py-3 px-4 font-medium uppercase tracking-widest text-xs">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byPlatform.map((platform: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium capitalize">{platform.platform}</td>
                      <td className="py-3 px-4 text-right">{platform.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{platform.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">₩{platform.spend.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">₩{platform.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium">{platform.roas.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
