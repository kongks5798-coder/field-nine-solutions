'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ForecastData {
  date: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
}

interface ForecastDashboardProps {
  type: 'sales' | 'inventory' | 'churn';
}

export default function ForecastDashboard({ type }: ForecastDashboardProps) {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [accuracy, setAccuracy] = useState(0);
  const [expectedRevenue, setExpectedRevenue] = useState<number | null>(null);

  // Mock historical data (실제로는 API에서 가져옴)
  const generateHistoricalData = () => {
    const data = [];
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000000) + 500000,
      });
    }
    return data;
  };

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const historicalData = generateHistoricalData();
        
        const response = await fetch('/api/ai/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            period,
            historicalData,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setForecast(data.forecast);
          setAccuracy(data.accuracy);
          setExpectedRevenue(data.expectedAdditionalRevenue);
        }
      } catch (error) {
        console.error('Forecast fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [type, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'sales':
        return '매출';
      case 'inventory':
        return '재고';
      case 'churn':
        return '이탈';
      default:
        return '';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'sales':
        return <DollarSign className="w-5 h-5" />;
      case 'inventory':
        return <Package className="w-5 h-5" />;
      case 'churn':
        return <Users className="w-5 h-5" />;
    }
  };

  const avgValue = forecast.length > 0
    ? forecast.reduce((acc, f) => acc + f.value, 0) / forecast.length
    : 0;

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <CardTitle className="text-xl font-bold text-foreground">
              {getTypeLabel()} 예측 ({period}일)
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(7)}
              className="rounded-lg"
            >
              7일
            </Button>
            <Button
              variant={period === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(30)}
              className="rounded-lg"
            >
              30일
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">AI가 예측을 생성하는 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 예상 추가 수익 카드 */}
            {type === 'sales' && expectedRevenue !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl ${
                  expectedRevenue > 0
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-amber-50 border-2 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">예상 추가 수익</p>
                    <p className={`text-3xl font-bold ${
                      expectedRevenue > 0 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {expectedRevenue > 0 ? '+' : ''}
                      {formatCurrency(expectedRevenue)}
                    </p>
                  </div>
                  {expectedRevenue > 0 ? (
                    <TrendingUp className="w-12 h-12 text-green-600" />
                  ) : (
                    <TrendingDown className="w-12 h-12 text-amber-600" />
                  )}
                </div>
              </motion.div>
            )}

            {/* 정확도 표시 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">예측 정확도</span>
              </div>
              <Badge
                variant={accuracy >= 80 ? 'default' : accuracy >= 60 ? 'secondary' : 'destructive'}
                className="font-bold"
              >
                {accuracy}%
              </Badge>
            </div>

            {/* 예측 차트 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">일별 예측</h4>
              <div className="space-y-2">
                {forecast.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-sm font-medium text-foreground min-w-[100px]">
                        {new Date(item.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / Math.max(...forecast.map(f => f.value))) * 100}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`h-full ${
                              item.confidence === 'high'
                                ? 'bg-green-500'
                                : item.confidence === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="font-bold text-foreground">
                        {type === 'sales' ? formatCurrency(item.value) : item.value.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          item.confidence === 'high'
                            ? 'default'
                            : item.confidence === 'medium'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs mt-1"
                      >
                        {item.confidence === 'high' ? '높음' : item.confidence === 'medium' ? '보통' : '낮음'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 평균값 요약 */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">평균 예측값</span>
                <span className="text-xl font-bold text-foreground">
                  {type === 'sales' ? formatCurrency(avgValue) : Math.round(avgValue).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
