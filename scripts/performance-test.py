"""
성능 벤치마크 테스트
레이턴시 및 처리량 측정
"""
import asyncio
import time
from datetime import datetime
from decimal import Decimal

async def benchmark_arbitrage_engine():
    """차익거래 엔진 성능 테스트"""
    try:
        from core.arbitrage_engine import ArbitrageEngine
        from core.orderbook_collector import OrderBookCollector
        
        collector = OrderBookCollector()
        engine = ArbitrageEngine(collector)
        
        # 성능 측정
        start_time = time.time()
        opportunities = await engine.find_arbitrage_opportunities()
        execution_time = (time.time() - start_time) * 1000  # ms
        
        print(f"✅ 차익거래 엔진 성능:")
        print(f"   실행 시간: {execution_time:.2f}ms")
        print(f"   발견된 기회: {len(opportunities)}개")
        
        return execution_time < 100  # 목표: 100ms 이하
    except Exception as e:
        print(f"⚠️ 성능 테스트 스킵: {e}")
        return False

async def benchmark_risk_hedger():
    """리스크 헤징 성능 테스트"""
    try:
        from core.risk_hedger import RiskHedger
        from core.arbitrage_engine import ArbitrageOpportunity
        
        hedger = RiskHedger()
        
        opportunity = ArbitrageOpportunity(
            path="BTC/USDT -> BTC/KRW",
            profit_usd=Decimal('100'),
            profit_percent=Decimal('0.5'),
            execution_time_ms=50.0,
            risk_score=0.3,
            fee_optimized=True,
            binance_price=Decimal('42500'),
            upbit_price_usd=Decimal('42550'),
            price_diff=Decimal('50'),
            total_fees=Decimal('10'),
            timestamp=datetime.now().timestamp()
        )
        
        # 성능 측정
        start_time = time.time()
        assessment = await hedger.assess_risk(opportunity, 50.0)
        execution_time = (time.time() - start_time) * 1000  # ms
        
        print(f"✅ 리스크 헤징 성능:")
        print(f"   실행 시간: {execution_time:.2f}ms")
        print(f"   의사결정: {assessment.get('should_execute', False)}")
        
        return execution_time < 500  # 목표: 500ms 이하 (DeepSeek API 호출 포함)
    except Exception as e:
        print(f"⚠️ 성능 테스트 스킵: {e}")
        return False

async def benchmark_database():
    """데이터베이스 성능 테스트"""
    try:
        from core.database import db
        
        await db.connect()
        
        # 저장 성능 측정
        start_time = time.time()
        for i in range(10):
            await db.save_opportunity(
                user_id=None,
                path=f"TEST {i}: BTC/USDT -> BTC/KRW",
                profit_usd=Decimal('100'),
                profit_percent=Decimal('0.5'),
                risk_score=0.3,
                fee_optimized=True,
                execution_time_ms=50.0,
                binance_price=Decimal('42500'),
                upbit_price_usd=Decimal('42550'),
                price_diff=Decimal('50'),
                total_fees=Decimal('10')
            )
        execution_time = (time.time() - start_time) * 1000  # ms
        
        avg_time = execution_time / 10
        
        print(f"✅ 데이터베이스 성능:")
        print(f"   10회 저장 시간: {execution_time:.2f}ms")
        print(f"   평균 저장 시간: {avg_time:.2f}ms")
        
        await db.disconnect()
        
        return avg_time < 50  # 목표: 평균 50ms 이하
    except Exception as e:
        print(f"⚠️ 데이터베이스 테스트 스킵: {e}")
        return False

async def main():
    """전체 성능 테스트"""
    print("🚀 Field Nine 차익거래 엔진 성능 벤치마크 시작...\n")
    
    results = {
        'arbitrage_engine': await benchmark_arbitrage_engine(),
        'risk_hedger': await benchmark_risk_hedger(),
        'database': await benchmark_database(),
    }
    
    print("\n📊 성능 테스트 결과:")
    for test_name, passed in results.items():
        status = "✅ 통과" if passed else "⚠️ 개선 필요"
        print(f"   {test_name}: {status}")
    
    all_passed = all(results.values())
    print(f"\n{'✅ 모든 성능 테스트 통과!' if all_passed else '⚠️ 일부 성능 개선 필요'}")

if __name__ == "__main__":
    asyncio.run(main())
