'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, TrendingDown, BarChart3, ShoppingCart, MessageSquare, TrendingUp,
  CheckCircle2, AlertCircle, Zap, ArrowRight, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AutoAction {
  action: string;
  title: string;
  description: string;
  suggestion: any;
  expectedBenefit: string;
  timestamp: string;
  dataSource: string;
}

const actionIcons = {
  inventory: Package,
  sales: TrendingDown,
  advertising: BarChart3,
  'cart-abandon': ShoppingCart,
  reviews: MessageSquare,
  trending: TrendingUp,
};

const actionLabels = {
  inventory: '재고 관리',
  sales: '매출 최적화',
  advertising: '광고 배분',
  'cart-abandon': '이탈 방지',
  reviews: '리뷰 분석',
  trending: '트렌드 알림',
};

export default function AutoActionsPanel() {
  const [actions, setActions] = useState<AutoAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        
        // 6가지 액션 모두 생성
        const actionTypes: Array<'inventory' | 'sales' | 'advertising' | 'cart-abandon' | 'reviews' | 'trending'> = [
          'inventory',
          'sales',
          'advertising',
          'cart-abandon',
          'reviews',
          'trending',
        ];

        const results = await Promise.all(
          actionTypes.map(async (type) => {
            const response = await fetch('/api/ai/auto-actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actionType: type,
                context: {}, // 실제로는 현재 상태 데이터 전달
              }),
            });
            return response.json();
          })
        );

        setActions(results.filter(r => r.success));
      } catch (error) {
        console.error('Auto actions fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
    const interval = setInterval(fetchActions, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (action: AutoAction) => {
    // 실제로는 API 호출로 적용
    setAppliedActions((prev) => new Set([...prev, action.timestamp]));
    
    // 성공 알림 (실제로는 toast 사용)
    alert(`${action.title} 액션이 적용되었습니다!\n${action.expectedBenefit}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="border-border bg-card shadow-lg rounded-xl">
        <CardContent className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">AI가 자동 액션을 분석하는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">자동 액션 제안</h2>
          <p className="text-sm text-muted-foreground">AI가 분석한 최적화 기회</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {actions.length}개 제안
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {actions.map((action, index) => {
            const Icon = actionIcons[action.action as keyof typeof actionIcons];
            const isApplied = appliedActions.has(action.timestamp);

            return (
              <motion.div
                key={action.timestamp}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-border bg-card shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all ${
                  isApplied ? 'border-green-500 bg-green-50/30' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">
                            {actionLabels[action.action as keyof typeof actionLabels]}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      {isApplied && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 제안 내용 */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      {action.action === 'inventory' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">발주 제안: {action.suggestion.orderQuantity}개</p>
                          <p className="text-xs text-muted-foreground">
                            추천 공급처: {action.suggestion.recommended.name} ({formatCurrency(action.suggestion.recommended.total)})
                          </p>
                        </div>
                      )}
                      {action.action === 'sales' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            할인율: {action.suggestion.discountRate}% ({formatCurrency(action.suggestion.newPrice)})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            쿠폰 코드: {action.suggestion.couponCode}
                          </p>
                        </div>
                      )}
                      {action.action === 'advertising' && (
                        <div className="space-y-2">
                          {action.suggestion.optimizedAllocation.map((p: any) => (
                            <div key={p.name} className="flex justify-between text-sm">
                              <span>{p.name}</span>
                              <span className="font-medium">{formatCurrency(p.suggestedBudget)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {action.action === 'cart-abandon' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{action.suggestion.message}</p>
                          <p className="text-xs text-muted-foreground">
                            할인: {action.suggestion.discount}% | 톤: {action.suggestion.tone}
                          </p>
                        </div>
                      )}
                      {action.action === 'reviews' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">감성 점수: {action.suggestion.sentimentScore}점</p>
                          <p className="text-xs text-muted-foreground">
                            개선 제안: {action.suggestion.improvements.length}개
                          </p>
                        </div>
                      )}
                      {action.action === 'trending' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{action.suggestion.message}</p>
                          <p className="text-xs text-muted-foreground">
                            예상 클릭률: {(action.suggestion.expectedClickRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 예상 이익 */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-700">예상 이익</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{action.expectedBenefit}</p>
                    </div>

                    {/* 데이터 소스 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      <span>데이터 소스: {action.dataSource}</span>
                    </div>

                    {/* 적용 버튼 */}
                    <Button
                      onClick={() => handleApply(action)}
                      disabled={isApplied}
                      className="w-full rounded-xl"
                      size="lg"
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          적용 완료
                        </>
                      ) : (
                        <>
                          적용하면 예상 이익 확인
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
