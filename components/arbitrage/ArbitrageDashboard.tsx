'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, AlertCircle, Zap, Activity, Wifi, WifiOff, DollarSign, Clock, Shield, ArrowUpRight, RefreshCw } from 'lucide-react';
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
  binance_price?: number;
  upbit_price_usd?: number;
  price_diff?: number;
  total_fees?: number;
  timestamp?: string;
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
  const [stats, setStats] = useState({ totalOpportunities: 0, totalProfit: 0, successRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // 프로덕션 환경에서는 현재 도메인 사용, 개발 환경에서는 localhost
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000';
      }
      return `${window.location.protocol}//${window.location.host}`;
    }
    return process.env.NEXT_PUBLIC_ARBITRAGE_API_URL || 'http://localhost:8000';
  };
  
  const apiUrl = getApiUrl();
  const wsOpportunitiesRef = useRef<WebSocket | null>(null);
  const wsOrderbookRef = useRef<WebSocket | null>(null);

  // 차익거래 기회 WebSocket
  useEffect(() => {
    if (!apiUrl) {
      setError('API URL이 설정되지 않았습니다.');
      setIsLoading(false);
      return;
    }
    
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/opportunities';
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsOpportunitiesRef.current = ws;
        setConnectionStatus('connecting');
        
        ws.onopen = () => {
          console.log('✅ 차익거래 기회 WebSocket 연결됨');
          setConnectionStatus('connected');
          setError(null);
          setIsLoading(false);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.opportunities) {
              setOpportunities(data.opportunities);
              setStats(prev => ({
                totalOpportunities: data.opportunities.length,
                totalProfit: data.opportunities.reduce((sum: number, opp: Opportunity) => sum + opp.profit_usd, 0),
                successRate: prev.successRate
              }));
            }
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
          setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        setConnectionStatus('disconnected');
        setError('WebSocket 연결 실패');
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
          console.log('✅ 오더북 WebSocket 연결됨');
          setOrderbookStatus('connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setOrderbook(data);
            
            // 레이턴시 계산
            if (data.binance?.timestamp && data.upbit?.timestamp) {
              const now = Date.now();
              setLatency({
                binance: now - data.binance.timestamp,
                upbit: now - data.upbit.timestamp
              });
            }
          } catch (error) {
            console.error('오더북 메시지 파싱 오류:', error);
          }
        };
        
        ws.onerror = () => {
          setOrderbookStatus('disconnected');
        };
        
        ws.onclose = () => {
          setOrderbookStatus('disconnected');
          setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('오더북 WebSocket 연결 실패:', error);
        setOrderbookStatus('disconnected');
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

  // REST API로 기회 조회 (폴백)
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/opportunities`);
        if (response.ok) {
          const data = await response.json();
          if (data.opportunities) {
            setOpportunities(data.opportunities);
          }
        }
      } catch (error) {
        console.error('기회 조회 실패:', error);
      }
    };

    // WebSocket 연결 실패 시 REST API 사용
    if (connectionStatus === 'disconnected') {
      fetchOpportunities();
      const interval = setInterval(fetchOpportunities, 5000);
      return () => clearInterval(interval);
    }
  }, [apiUrl, connectionStatus]);

  const handleExecute = async (opportunityId: string) => {
    setIsExecuting(opportunityId);
    try {
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ 차익거래 실행 완료!\n수익: $${data.profit_usd?.toFixed(2) || '0.00'}`);
      } else {
        alert('❌ 차익거래 실행 실패');
      }
    } catch (error) {
      console.error('차익거래 실행 오류:', error);
      alert('❌ 차익거래 실행 중 오류 발생');
    } finally {
      setIsExecuting(null);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 0.3) return 'text-green-600 bg-green-50';
    if (riskScore < 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore < 0.3) return '낮음';
    if (riskScore < 0.7) return '보통';
    return '높음';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-6">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Field Nine 차익거래 엔진</h1>
            <p className="text-gray-600">실시간 암호화폐 차익거래 기회 탐지 및 실행</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className="flex items-center gap-2"
            >
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connectionStatus === 'connected' ? '연결됨' : '연결 끊김'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">발견된 기회</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">실시간 탐지</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 예상 수익</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">USD</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Binance 레이턴시</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latency.binance}ms</div>
              <p className="text-xs text-muted-foreground">실시간 측정</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upbit 레이턴시</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latency.upbit}ms</div>
              <p className="text-xs text-muted-foreground">실시간 측정</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="max-w-7xl mx-auto mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <p>차익거래 엔진 연결 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차익거래 기회 목록 */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">차익거래 기회</h2>
        
        {opportunities.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>현재 차익거래 기회가 없습니다.</p>
                <p className="text-sm mt-2">실시간으로 모니터링 중입니다...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opp.path}</CardTitle>
                    {opp.fee_optimized && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Zap className="w-3 h-3 mr-1" />
                        최적화됨
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">예상 수익</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${opp.profit_usd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">수익률</span>
                      <span className="text-lg font-semibold text-green-600">
                        {opp.profit_percent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">리스크</span>
                      <Badge className={getRiskColor(opp.risk_score)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRiskLabel(opp.risk_score)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">실행 시간</span>
                      <span className="text-sm font-medium">{opp.execution_time_ms.toFixed(0)}ms</span>
                    </div>
                    {opp.binance_price && opp.upbit_price_usd && (
                      <div className="pt-2 border-t space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Binance:</span>
                          <span className="font-mono">${opp.binance_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Upbit:</span>
                          <span className="font-mono">${opp.upbit_price_usd.toFixed(2)}</span>
                        </div>
                        {opp.price_diff && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">차이:</span>
                            <span className="font-mono text-green-600">${opp.price_diff.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      className="w-full mt-4 bg-[#000000] hover:bg-[#333333] text-white"
                      onClick={() => handleExecute(opp.id)}
                      disabled={isExecuting === opp.id}
                    >
                      {isExecuting === opp.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          실행 중...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          차익거래 실행
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 오더북 정보 */}
      {orderbook && (
        <div className="max-w-7xl mx-auto mt-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">실시간 오더북</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Binance BTC/USDT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-green-600 mb-2">매수 호가</div>
                  {orderbook.binance.bids.slice(0, 5).map((bid, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-mono">${bid[0].toFixed(2)}</span>
                      <span className="text-gray-600">{bid[1].toFixed(4)} BTC</span>
                    </div>
                  ))}
                  <div className="text-sm font-semibold text-red-600 mb-2 mt-4">매도 호가</div>
                  {orderbook.binance.asks.slice(0, 5).map((ask, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-mono">${ask[0].toFixed(2)}</span>
                      <span className="text-gray-600">{ask[1].toFixed(4)} BTC</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Upbit BTC/KRW
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-green-600 mb-2">매수 호가</div>
                  {orderbook.upbit.bids.slice(0, 5).map((bid, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-mono">₩{bid[0].toLocaleString()}</span>
                      <span className="text-gray-600">{bid[1].toFixed(4)} BTC</span>
                    </div>
                  ))}
                  <div className="text-sm font-semibold text-red-600 mb-2 mt-4">매도 호가</div>
                  {orderbook.upbit.asks.slice(0, 5).map((ask, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-mono">₩{ask[0].toLocaleString()}</span>
                      <span className="text-gray-600">{ask[1].toFixed(4)} BTC</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
