'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, AlertCircle, Zap, Activity, Wifi, WifiOff } from 'lucide-react';
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [orderbookStatus, setOrderbookStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_ARBITRAGE_API_URL || 'http://localhost:8000';
  const wsOpportunitiesRef = useRef<WebSocket | null>(null);
  const wsOrderbookRef = useRef<WebSocket | null>(null);

  // 차익거래 기회 WebSocket
  useEffect(() => {
    if (!apiUrl) {
      setError('API URL이 설정되지 않았습니다.');
      return;
    }
    
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/opportunities';
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsOpportunitiesRef.current = ws;
        setConnectionStatus('connecting');
        
        ws.onopen = () => {
          console.log('차익거래 기회 WebSocket 연결됨');
          setConnectionStatus('connected');
          setError(null);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setOpportunities(data.opportunities || []);
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };
        
        ws.onerror = (e) => {
          console.error('WebSocket 오류:', e);
          setConnectionStatus('disconnected');
          setError('WebSocket 연결 오류');
        };
        
        ws.onclose = () => {
          console.log('WebSocket 연결 종료');
          setConnectionStatus('disconnected');
          // 5초 후 재연결
          setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        setConnectionStatus('disconnected');
        setError('WebSocket 연결 실패');
        // 5초 후 재연결 시도
        setTimeout(connect, 5000);
      }
    };
    
    connect();
    
    return () => {
      if (wsOpportunitiesRef.current) {
        wsOpportunitiesRef.current.close();
      }
    };
  }, [apiUrl]);

  // 오더북 WebSocket
  useEffect(() => {
    if (!apiUrl) return;
    
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/orderbook';
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsOrderbookRef.current = ws;
        setOrderbookStatus('connecting');
        
        ws.onopen = () => {
          console.log('오더북 WebSocket 연결됨');
          setOrderbookStatus('connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setOrderbook(data);
            
            // 레이턴시 계산
            if (data.binance?.timestamp && data.upbit?.timestamp) {
              const now = Date.now() / 1000;
              setLatency({
                binance: Math.max(0, Math.round((now - data.binance.timestamp) * 1000)),
                upbit: Math.max(0, Math.round((now - data.upbit.timestamp) * 1000)),
              });
            }
          } catch (error) {
            console.error('오더북 WebSocket 메시지 파싱 오류:', error);
          }
        };
        
        ws.onerror = (e) => {
          console.error('오더북 WebSocket 오류:', e);
          setOrderbookStatus('disconnected');
        };
        
        ws.onclose = () => {
          console.log('오더북 WebSocket 연결 종료');
          setOrderbookStatus('disconnected');
          // 5초 후 재연결
          setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('오더북 WebSocket 연결 실패:', error);
        setOrderbookStatus('disconnected');
        // 5초 후 재연결 시도
        setTimeout(connect, 5000);
      }
    };
    
    connect();
    
    return () => {
      if (wsOrderbookRef.current) {
        wsOrderbookRef.current.close();
      }
    };
  }, [apiUrl]);

  // REST API로 기회 조회 (WebSocket 실패 시 폴백)
  useEffect(() => {
    if (connectionStatus === 'disconnected' && apiUrl) {
      const fetchOpportunities = async () => {
        try {
          const response = await fetch(`${apiUrl}/api/opportunities`);
          if (response.ok) {
            const data = await response.json();
            setOpportunities(data.opportunities || []);
          }
        } catch (error) {
          console.error('REST API 오류:', error);
        }
      };
      
      fetchOpportunities();
      const interval = setInterval(fetchOpportunities, 5000); // 5초마다 폴링
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus, apiUrl]);

  const handleExecute = async (opportunity: Opportunity) => {
    if (isExecuting) return;
    
    setIsExecuting(opportunity.id);
    setError(null);
    
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '알 수 없는 오류' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ 차익거래 실행 성공!\n실제 수익: $${result.actual_profit?.toFixed(2) || '0.00'}\n실행 시간: ${result.execution_time_ms?.toFixed(2) || '0'}ms`);
      } else {
        alert(`❌ 실행 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      alert(`❌ 오류: ${errorMessage}`);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-tesla-black mb-2">
              차익거래 엔진
            </h1>
            <p className="text-gray-600">실시간 김치 프리미엄 & 삼각 차익거래</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'connected' ? '연결됨' : 
                 connectionStatus === 'connecting' ? '연결 중...' : '연결 끊김'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

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
                {connectionStatus === 'connected' 
                  ? '실시간으로 모니터링 중입니다...'
                  : 'API 서버에 연결 중입니다...'}
              </p>
              {connectionStatus === 'disconnected' && (
                <p className="text-xs text-red-500 mt-2">
                  API 서버가 실행 중인지 확인하세요: {apiUrl}
                </p>
              )}
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
                  disabled={isExecuting === opp.id || connectionStatus !== 'connected'}
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
