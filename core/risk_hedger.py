"""
DeepSeek-V3 기반 리스크 헤징 시스템
실시간 의사결정 에이전트
"""
import asyncio
from typing import Dict, Optional
from datetime import datetime
import httpx
import json
import os
from core.arbitrage_engine import ArbitrageOpportunity

class RiskHedger:
    """
    DeepSeek-V3 기반 리스크 헤징 시스템
    - 실시간 가격 변동 모니터링
    - 네트워크 지연 감지
    - 자동 헤징 의사결정
    """
    
    def __init__(self, deepseek_api_key: Optional[str] = None):
        self.api_key = deepseek_api_key or os.getenv("DEEPSEEK_API_KEY", "")
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.risk_threshold = 0.7  # 리스크 점수 임계값
        self.latency_threshold_ms = 100  # 레이턴시 임계값
        self.volatility_history = []
        self.liquidity_history = []
    
    async def assess_risk(self, opportunity: ArbitrageOpportunity, 
                         current_latency: float) -> Dict:
        """
        리스크 평가 및 헤징 의사결정
        
        Args:
            opportunity: 차익거래 기회
            current_latency: 현재 네트워크 레이턴시 (ms)
        
        Returns:
            {
                'should_execute': bool,
                'risk_score': float (0-1),
                'hedging_strategy': dict,
                'confidence': float (0-1),
                'reasoning': str
            }
        """
        # 1. 현재 상황 분석
        context = {
            'opportunity': {
                'profit_usd': float(opportunity.profit_usd),
                'profit_percent': float(opportunity.profit_percent),
                'path': opportunity.path,
                'price_diff': float(opportunity.price_diff),
                'total_fees': float(opportunity.total_fees),
            },
            'market_conditions': {
                'binance_latency_ms': current_latency,
                'upbit_latency_ms': current_latency + 10,  # 예시
                'price_volatility': await self._get_volatility(),
                'orderbook_depth': await self._get_orderbook_depth(),
            },
            'risk_factors': {
                'network_congestion': current_latency > self.latency_threshold_ms,
                'price_gap_stability': await self._check_price_stability(),
                'liquidity_risk': await self._check_liquidity(),
                'current_risk_score': opportunity.risk_score,
            }
        }
        
        # 2. DeepSeek-V3에게 의사결정 요청 (API 키가 있는 경우)
        if self.api_key:
            try:
                decision = await self._query_deepseek(context)
                return decision
            except Exception as e:
                print(f"DeepSeek-V3 API 오류: {e}")
                # API 오류 시 기본 로직 사용
                return self._default_risk_assessment(context)
        else:
            # API 키가 없으면 기본 로직 사용
            return self._default_risk_assessment(context)
    
    async def _query_deepseek(self, context: Dict) -> Dict:
        """
        DeepSeek-V3 API 호출
        """
        system_prompt = """당신은 암호화폐 차익거래 리스크 관리 전문가입니다.
주어진 시장 상황과 기회를 분석하여, 실행 여부와 헤징 전략을 결정하세요.

응답 형식 (JSON):
{
    "execute": true/false,
    "risk_score": 0.0-1.0,
    "hedging_strategy": {
        "type": "partial_hedge" | "full_hedge" | "no_hedge",
        "hedge_amount": 0.0-1.0,
        "hedge_exchange": "binance" | "upbit"
    },
    "confidence": 0.0-1.0,
    "reasoning": "의사결정 근거"
}"""

        user_prompt = f"""
현재 차익거래 기회:
- 수익: ${context['opportunity']['profit_usd']:.2f} ({context['opportunity']['profit_percent']:.2f}%)
- 경로: {context['opportunity']['path']}
- 가격 차이: ${context['opportunity']['price_diff']:.2f}
- 총 수수료: ${context['opportunity']['total_fees']:.2f}

시장 상황:
- Binance 레이턴시: {context['market_conditions']['binance_latency_ms']:.2f}ms
- Upbit 레이턴시: {context['market_conditions']['upbit_latency_ms']:.2f}ms
- 가격 변동성: {context['market_conditions']['price_volatility']:.4f}
- 오더북 깊이: ${context['market_conditions']['orderbook_depth']:,.0f}

리스크 요인:
- 네트워크 혼잡: {context['risk_factors']['network_congestion']}
- 가격 차이 안정성: {context['risk_factors']['price_gap_stability']}
- 유동성 리스크: {context['risk_factors']['liquidity_risk']}
- 현재 리스크 스코어: {context['risk_factors']['current_risk_score']:.2f}

이 기회를 실행해야 할까요? 헤징 전략은 무엇이어야 할까요?
JSON 형식으로만 응답하세요.
"""
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,  # 낮은 온도로 일관된 의사결정
                    "max_tokens": 500,
                }
            )
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # JSON 파싱 (코드 블록 제거)
            content = content.strip()
            if content.startswith('```'):
                # 코드 블록 제거
                lines = content.split('\n')
                content = '\n'.join(lines[1:-1]) if len(lines) > 2 else content
            
            try:
                decision = json.loads(content)
                return decision
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 기본값
                print(f"JSON 파싱 실패: {content}")
                return self._default_risk_assessment(context)
    
    def _default_risk_assessment(self, context: Dict) -> Dict:
        """
        기본 리스크 평가 (DeepSeek-V3 없이)
        """
        opportunity = context['opportunity']
        risk_factors = context['risk_factors']
        market_conditions = context['market_conditions']
        
        # 기본 로직
        should_execute = (
            opportunity['profit_usd'] > 50 and
            opportunity['profit_percent'] > 0.5 and
            risk_factors['current_risk_score'] < 0.7 and
            not risk_factors['network_congestion'] and
            risk_factors['liquidity_risk'] is False
        )
        
        # 헤징 전략 결정
        if risk_factors['current_risk_score'] > 0.5:
            hedging_strategy = {
                'type': 'partial_hedge',
                'hedge_amount': 0.5,
                'hedge_exchange': 'binance'
            }
        else:
            hedging_strategy = {
                'type': 'no_hedge',
                'hedge_amount': 0.0,
                'hedge_exchange': None
            }
        
        return {
            'should_execute': should_execute,
            'risk_score': risk_factors['current_risk_score'],
            'hedging_strategy': hedging_strategy,
            'confidence': 0.7 if should_execute else 0.3,
            'reasoning': '기본 리스크 평가 로직 사용'
        }
    
    async def execute_hedge(self, strategy: Dict, opportunity: ArbitrageOpportunity):
        """
        헤징 전략 실행
        
        Args:
            strategy: 헤징 전략 딕셔너리
            opportunity: 차익거래 기회
        """
        if strategy['type'] == 'no_hedge':
            return
        
        # 부분 헤징 또는 전체 헤징 실행
        # TODO: 실제 헤징 로직 구현
        hedge_amount = strategy.get('hedge_amount', 0.0)
        hedge_exchange = strategy.get('hedge_exchange', 'binance')
        
        print(f"헤징 실행: {strategy['type']}, 양: {hedge_amount}, 거래소: {hedge_exchange}")
    
    async def _get_volatility(self) -> float:
        """가격 변동성 계산"""
        # TODO: 최근 가격 데이터로 변동성 계산
        # 현재는 히스토리 기반 간단한 계산
        if len(self.volatility_history) < 10:
            return 0.02  # 기본값 2%
        
        # 최근 10개 데이터의 표준편차 계산
        import statistics
        return statistics.stdev(self.volatility_history[-10:]) if len(self.volatility_history) >= 2 else 0.02
    
    async def _get_orderbook_depth(self) -> float:
        """오더북 깊이 계산 (USD)"""
        # TODO: 오더북 데이터로 깊이 계산
        return 100000.0  # 기본값 $100,000
    
    async def _check_price_stability(self) -> bool:
        """가격 차이 안정성 확인"""
        # TODO: 최근 가격 차이 추세 분석
        return True  # 기본값: 안정적
    
    async def _check_liquidity(self) -> bool:
        """유동성 확인"""
        # TODO: 오더북 유동성 분석
        return True  # 기본값: 충분한 유동성
