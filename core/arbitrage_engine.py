"""
차익거래 엔진 (Asyncio 기반)
Fee-Optimized Path 계산
"""
import asyncio
from typing import Optional, List
from decimal import Decimal, ROUND_DOWN
from dataclasses import dataclass
from datetime import datetime
from core.orderbook_collector import OrderBookCollector, OrderBookSnapshot

@dataclass
class ArbitrageOpportunity:
    path: str  # 예: "BTC/USDT -> BTC/KRW -> USDT/KRW"
    profit_usd: Decimal
    profit_percent: Decimal
    execution_time_ms: float
    risk_score: float  # 0-1 (낮을수록 안전)
    fee_optimized: bool
    binance_price: Decimal
    upbit_price_usd: Decimal
    price_diff: Decimal
    total_fees: Decimal
    timestamp: float

class ArbitrageEngine:
    """
    실시간 차익거래 기회 탐지 및 실행 엔진
    """
    
    # 거래소 수수료 (Maker/Taker)
    FEES = {
        'binance': {'maker': Decimal('0.001'), 'taker': Decimal('0.001')},  # 0.1%
        'upbit': {'maker': Decimal('0.0005'), 'taker': Decimal('0.0005')},  # 0.05%
    }
    
    # 환율 (USD/KRW) - 실시간 업데이트 필요
    EXCHANGE_RATE = Decimal('1400')  # 기본값, 실제로는 API에서 가져옴
    
    def __init__(self, orderbook_collector: OrderBookCollector):
        self.collector = orderbook_collector
        self.min_profit_threshold = Decimal('50')  # 최소 $50 수익
        self.min_profit_percent = Decimal('0.5')  # 최소 0.5%
        self.max_slippage = Decimal('0.002')  # 최대 0.2% 슬리피지
    
    async def find_arbitrage_opportunities(self) -> List[ArbitrageOpportunity]:
        """
        실시간 차익거래 기회 탐지
        """
        opportunities = []
        
        # 1. 김치 프리미엄 탐지 (직접 차익거래)
        kimchi_opp = await self._detect_kimchi_premium()
        if kimchi_opp:
            opportunities.append(kimchi_opp)
        
        # 2. 삼각 차익거래 탐지
        triangular_opps = await self._detect_triangular_arbitrage()
        opportunities.extend(triangular_opps)
        
        # 3. Fee-optimized Path 필터링
        filtered = [opp for opp in opportunities if opp.fee_optimized]
        
        # 4. 수익성 순으로 정렬
        return sorted(filtered, key=lambda x: x.profit_usd, reverse=True)
    
    async def _detect_kimchi_premium(self) -> Optional[ArbitrageOpportunity]:
        """
        김치 프리미엄 탐지: Binance BTC/USDT vs Upbit BTC/KRW
        
        전략:
        1. Binance에서 BTC 구매 (USDT 지불)
        2. Upbit에서 BTC 판매 (KRW 받음)
        3. KRW를 USD로 환전 (환율 고려)
        4. 수익성 계산
        """
        binance_ob = self.collector.get_latest_orderbook('binance')
        upbit_ob = self.collector.get_latest_orderbook('upbit')
        
        if not binance_ob or not upbit_ob:
            return None
        
        if not binance_ob.asks or not upbit_ob.bids:
            return None
        
        # Binance 최저 매도가 (Ask) - 여기서 BTC 구매
        binance_ask_price = Decimal(str(binance_ob.asks[0][0]))
        binance_ask_quantity = Decimal(str(binance_ob.asks[0][1]))
        
        # Upbit 최고 매수가 (Bid) - 여기서 BTC 판매
        upbit_bid_price_krw = Decimal(str(upbit_ob.bids[0][0]))
        upbit_bid_quantity = Decimal(str(upbit_ob.bids[0][1]))
        
        # USD로 변환
        upbit_bid_price_usd = upbit_bid_price_krw / self.EXCHANGE_RATE
        
        # 거래 가능 수량 확인 (양쪽 모두 충분한 유동성)
        max_tradeable_btc = min(binance_ask_quantity, upbit_bid_quantity)
        
        if max_tradeable_btc < Decimal('0.001'):  # 최소 거래량
            return None
        
        # 가격 차이 계산
        price_diff = upbit_bid_price_usd - binance_ask_price
        
        # 수수료 계산 (Taker 수수료 사용 - 즉시 체결)
        binance_fee = binance_ask_price * self.FEES['binance']['taker']
        upbit_fee = upbit_bid_price_usd * self.FEES['upbit']['taker']
        total_fees = binance_fee + upbit_fee
        
        # 슬리피지 고려 (오더북 깊이에 따른 가격 변동)
        slippage_cost = binance_ask_price * self.max_slippage
        
        # 순수익 계산
        net_profit = price_diff - total_fees - slippage_cost
        profit_percent = (net_profit / binance_ask_price) * Decimal('100')
        
        # 최소 수익 임계값 확인
        if net_profit < self.min_profit_threshold:
            return None
        
        if profit_percent < self.min_profit_percent:
            return None
        
        # 리스크 스코어 계산 (가격 차이가 클수록, 유동성이 낮을수록 리스크 높음)
        liquidity_score = min(max_tradeable_btc / Decimal('1.0'), Decimal('1.0'))  # 1 BTC 기준
        price_stability = Decimal('1.0') - (price_diff / binance_ask_price) if price_diff > 0 else Decimal('1.0')
        risk_score = float(Decimal('1.0') - (liquidity_score * Decimal('0.5') + price_stability * Decimal('0.5')))
        risk_score = max(0.0, min(1.0, risk_score))  # 0-1 범위로 제한
        
        # Fee-optimized 여부 확인 (수수료가 수익의 50% 이하)
        fee_ratio = total_fees / net_profit if net_profit > 0 else Decimal('1.0')
        fee_optimized = fee_ratio < Decimal('0.5')
        
        return ArbitrageOpportunity(
            path="BTC/USDT (Binance) -> BTC/KRW (Upbit)",
            profit_usd=net_profit.quantize(Decimal('0.01'), rounding=ROUND_DOWN),
            profit_percent=profit_percent.quantize(Decimal('0.01'), rounding=ROUND_DOWN),
            execution_time_ms=50.0,  # 예상 실행 시간
            risk_score=risk_score,
            fee_optimized=fee_optimized,
            binance_price=binance_ask_price,
            upbit_price_usd=upbit_bid_price_usd,
            price_diff=price_diff,
            total_fees=total_fees,
            timestamp=datetime.now().timestamp(),
        )
    
    async def _detect_triangular_arbitrage(self) -> List[ArbitrageOpportunity]:
        """
        삼각 차익거래 탐지
        예: USDT -> BTC -> KRW -> USDT
        
        TODO: 향후 구현
        - USDT로 BTC 구매 (Binance)
        - BTC를 KRW로 판매 (Upbit)
        - KRW를 USDT로 환전 (환율 고려)
        - 수익성 계산
        """
        opportunities = []
        
        # TODO: 삼각 차익거래 로직 구현
        # 현재는 빈 리스트 반환
        
        return opportunities
    
    async def execute_arbitrage(self, opportunity: ArbitrageOpportunity) -> dict:
        """
        차익거래 실행
        
        Returns:
            {
                'success': bool,
                'order_ids': {'binance': str, 'upbit': str},
                'actual_profit': Decimal,
                'execution_time_ms': float
            }
        """
        # TODO: 실제 주문 실행 로직
        # 1. 주문 전송 (Binance + Upbit 동시)
        # 2. 주문 상태 모니터링
        # 3. 성공/실패 처리
        
        return {
            'success': False,
            'order_ids': {},
            'actual_profit': Decimal('0'),
            'execution_time_ms': 0.0,
            'error': 'Not implemented yet',
        }
    
    def update_exchange_rate(self, rate: Decimal):
        """환율 업데이트"""
        self.EXCHANGE_RATE = rate
    
    def update_min_profit_threshold(self, threshold: Decimal):
        """최소 수익 임계값 업데이트"""
        self.min_profit_threshold = threshold
    
    def update_min_profit_percent(self, percent: Decimal):
        """최소 수익률 임계값 업데이트"""
        self.min_profit_percent = percent
