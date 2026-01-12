'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Zap, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Opportunity {
  id: string;
  path: string;
  profit_usd: number;
  profit_percent: number;
  risk_score: number;
  fee_optimized: boolean;
  execution_time_ms: number;
}

interface OrderBook {
  binance: {
    bids: [number, number][];
    asks: [number, number][];
    timestamp?: number;
  };
  upbit: {
    bids: [number, number][];
    asks: [number, number][];
    timestamp?: number;
  };
  timestamp: string;
}

export default function ArbitrageDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orderbook, setOrderbook] = useState<OrderBook | null>(null);
  const [latency, setLatency] = useState({ binance: 0, upbit: 0 });
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [apiUrl] = useState(
    process.env.NEXT_PUBLIC_ARBITRAGE_API_URL || 'http://localhost:8000'
  );

  // 차익거래 기회 WebSocket
  useEffect(() => {
    const wsUrl = apiUrl.replace('http', 'ws') + '/ws/opportunities';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('차익거래 기회 WebSocket 연결됨');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setOpportunities(data.opportunities || []);
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
    };

    return () => {
      ws.close();
    };
  }, [apiUrl]);

  // 오더북 WebSocket
  useEffect(() => {
    const wsUrl = apiUrl.replace('http', 'ws') + '/ws/orderbook';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('오더북 WebSocket 연결됨');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setOrderbook(data);
        
        // 레이턴시 계산 (간단한 시뮬레이션)
        if (data.binance?.timestamp && data.upbit?.timestamp) {
          const now = Date.now() / 1000;
          setLatency({
            binance: Math.round((now - data.binance.timestamp) * 1000),
            upbit: Math.round((now - data.upbit.timestamp) * 1000),
          });
        }
      } catch (error) {
        console.error('오더북 WebSocket 메시지 파싱 오류:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('오더북 WebSocket 오류:', error);
    };
    
    ws.onclose = () => {
      console.log('오더북 WebSocket 연결 종료');
    };

    return () => {
      ws.close();
    };
  }, [apiUrl]);

  const handleExecute = async (opportunity: Opportunity) => {
    if (isExecuting) return;
    
    setIsExecuting(opportunity.id);
    
    try {
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: opportunity.path,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ 차익거래 실행 성공!\n실제 수익: $${result.actual_profit.toFixed(2)}\n실행 시간: ${result.execution_time_ms.toFixed(2)}ms`);
      } else {
        alert(`❌ 실행 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      alert(`❌ 오류: ${error.message}`);
    } finally {
      setIsExecuting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-ivory-bg p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-tesla-black mb-2">
          차익거래 엔진
        </h1>
        <p className="text-gray-600">실시간 김치 프리미엄 & 삼각 차익거래</p>
      </div>

      {/* 레이턴시 모니터 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Binance 레이턴시</p>
                <p className={`text-2xl font-bold ${
                  latency.binance > 100 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {latency.binance}ms
                </p>
              </div>
              <Activity className={`w-8 h-8 ${
                latency.binance > 100 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upbit 레이턴시</p>
                <p className={`text-2xl font-bold ${
                  latency.upbit > 100 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {latency.upbit}ms
                </p>
              </div>
              <Activity className={`w-8 h-8 ${
                latency.upbit > 100 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차익거래 기회 리스트 */}
      <div className="space-y-4">
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">현재 차익거래 기회가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">
                실시간으로 모니터링 중입니다...
              </p>
            </CardContent>
          </Card>
        ) : (
          opportunities.map((opp) => (
            <Card
              key={opp.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-tesla-black mb-1">
                      {opp.path}
                    </h3>
                    <div className="flex items-center gap-2">
                      {opp.fee_optimized && (
                        <Badge className="bg-green-500 text-white">
                          Fee-Optimized
                        </Badge>
                      )}
                      <span className="text-sm text-gray-600">
                        실행 시간: {opp.execution_time_ms.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      +{formatCurrency(opp.profit_usd)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {opp.profit_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* 리스크 스코어 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">리스크 스코어</span>
                    <span className={`text-sm font-bold ${
                      opp.risk_score < 0.3 ? 'text-green-600' :
                      opp.risk_score < 0.7 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(opp.risk_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        opp.risk_score < 0.3 ? 'bg-green-600' :
                        opp.risk_score < 0.7 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${opp.risk_score * 100}%` }}
                    />
                  </div>
                </div>

                {/* 실행 버튼 */}
                <Button
                  onClick={() => handleExecute(opp)}
                  disabled={isExecuting === opp.id}
                  className="w-full bg-tesla-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExecuting === opp.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>실행 중...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>실행하기</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
