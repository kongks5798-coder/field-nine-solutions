"""
데이터베이스 연결 및 유틸리티
PostgreSQL (Supabase) + Redis 캐싱
"""
import os
import json
from typing import Optional, Dict, List
from decimal import Decimal
from datetime import datetime
import asyncpg
import redis.asyncio as redis
from dataclasses import dataclass

@dataclass
class ArbitrageOpportunityDB:
    """차익거래 기회 DB 모델"""
    id: str
    user_id: Optional[str]
    path: str
    profit_usd: Decimal
    profit_percent: Decimal
    risk_score: float
    fee_optimized: bool
    execution_time_ms: float
    binance_price: Decimal
    upbit_price_usd: Decimal
    price_diff: Decimal
    total_fees: Decimal
    created_at: datetime
    execution_status: str = 'detected'

class Database:
    """
    데이터베이스 연결 관리
    - PostgreSQL (Supabase): 메인 데이터 저장
    - Redis: 캐싱 및 실시간 데이터
    """
    
    def __init__(self):
        self.pg_pool: Optional[asyncpg.Pool] = None
        self.redis_client: Optional[redis.Redis] = None
        
        # 환경변수에서 연결 정보 로드
        self.pg_url = os.getenv("DATABASE_URL", "")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    async def connect(self):
        """데이터베이스 연결"""
        # PostgreSQL 연결
        if self.pg_url:
            try:
                self.pg_pool = await asyncpg.create_pool(
                    self.pg_url,
                    min_size=2,
                    max_size=10,
                    command_timeout=5
                )
                print("✅ PostgreSQL 연결 성공")
            except Exception as e:
                print(f"⚠️ PostgreSQL 연결 실패: {e}")
        
        # Redis 연결
        try:
            self.redis_client = await redis.from_url(
                self.redis_url,
                decode_responses=True
            )
            await self.redis_client.ping()
            print("✅ Redis 연결 성공")
        except Exception as e:
            print(f"⚠️ Redis 연결 실패: {e}")
    
    async def disconnect(self):
        """데이터베이스 연결 종료"""
        if self.pg_pool:
            await self.pg_pool.close()
        if self.redis_client:
            await self.redis_client.close()
    
    # ========== 차익거래 기회 저장 ==========
    
    async def save_opportunity(
        self,
        user_id: Optional[str],
        path: str,
        profit_usd: Decimal,
        profit_percent: Decimal,
        risk_score: float,
        fee_optimized: bool,
        execution_time_ms: float,
        binance_price: Decimal,
        upbit_price_usd: Decimal,
        price_diff: Decimal,
        total_fees: Decimal
    ) -> Optional[str]:
        """차익거래 기회 저장"""
        if not self.pg_pool:
            return None
        
        try:
            opportunity_id = await self.pg_pool.fetchval(
                """
                SELECT public.save_arbitrage_opportunity(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                )
                """,
                user_id, path, float(profit_usd), float(profit_percent),
                risk_score, fee_optimized, execution_time_ms,
                float(binance_price), float(upbit_price_usd),
                float(price_diff), float(total_fees)
            )
            
            # Redis 캐시에도 저장 (최근 10개)
            if self.redis_client:
                await self._cache_recent_opportunity(opportunity_id, {
                    'path': path,
                    'profit_usd': float(profit_usd),
                    'profit_percent': float(profit_percent),
                    'risk_score': risk_score,
                    'created_at': datetime.now().isoformat()
                })
            
            return str(opportunity_id) if opportunity_id else None
        except Exception as e:
            print(f"기회 저장 오류: {e}")
            return None
    
    async def save_execution(
        self,
        opportunity_id: str,
        user_id: Optional[str],
        buy_order_id: Optional[str],
        sell_order_id: Optional[str],
        actual_profit: Decimal,
        execution_time_ms: float,
        status: str,
        error_message: Optional[str] = None
    ) -> Optional[str]:
        """차익거래 실행 기록 저장"""
        if not self.pg_pool:
            return None
        
        try:
            execution_id = await self.pg_pool.fetchval(
                """
                SELECT public.save_arbitrage_execution(
                    $1, $2, $3, $4, $5, $6, $7, $8
                )
                """,
                opportunity_id, user_id, buy_order_id, sell_order_id,
                float(actual_profit), execution_time_ms, status, error_message
            )
            
            return str(execution_id) if execution_id else None
        except Exception as e:
            print(f"실행 기록 저장 오류: {e}")
            return None
    
    # ========== Redis 캐싱 ==========
    
    async def _cache_recent_opportunity(self, opportunity_id: str, data: Dict):
        """최근 기회를 Redis에 캐시"""
        if not self.redis_client:
            return
        
        try:
            key = f"arbitrage:opportunities:recent"
            await self.redis_client.lpush(key, json.dumps({
                'id': opportunity_id,
                **data
            }))
            await self.redis_client.ltrim(key, 0, 9)  # 최근 10개만 유지
            await self.redis_client.expire(key, 3600)  # 1시간 TTL
        except Exception as e:
            print(f"Redis 캐시 저장 오류: {e}")
    
    async def get_recent_opportunities(self, limit: int = 10) -> List[Dict]:
        """최근 기회 조회 (Redis 캐시 우선)"""
        if self.redis_client:
            try:
                key = f"arbitrage:opportunities:recent"
                cached = await self.redis_client.lrange(key, 0, limit - 1)
                if cached:
                    return [json.loads(item) for item in cached]
            except Exception as e:
                print(f"Redis 캐시 조회 오류: {e}")
        
        # 캐시 미스 시 DB 조회
        if self.pg_pool:
            try:
                rows = await self.pg_pool.fetch(
                    """
                    SELECT id, path, profit_usd, profit_percent, risk_score, created_at
                    FROM public.arbitrage_opportunities
                    ORDER BY created_at DESC
                    LIMIT $1
                    """,
                    limit
                )
                return [
                    {
                        'id': str(row['id']),
                        'path': row['path'],
                        'profit_usd': float(row['profit_usd']),
                        'profit_percent': float(row['profit_percent']),
                        'risk_score': float(row['risk_score']),
                        'created_at': row['created_at'].isoformat()
                    }
                    for row in rows
                ]
            except Exception as e:
                print(f"DB 조회 오류: {e}")
        
        return []
    
    async def cache_orderbook(self, exchange: str, data: Dict):
        """오더북을 Redis에 캐시"""
        if not self.redis_client:
            return
        
        try:
            key = f"arbitrage:orderbook:{exchange}"
            await self.redis_client.setex(
                key,
                5,  # 5초 TTL
                json.dumps(data)
            )
        except Exception as e:
            print(f"오더북 캐시 저장 오류: {e}")
    
    async def get_cached_orderbook(self, exchange: str) -> Optional[Dict]:
        """캐시된 오더북 조회"""
        if not self.redis_client:
            return None
        
        try:
            key = f"arbitrage:orderbook:{exchange}"
            cached = await self.redis_client.get(key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            print(f"오더북 캐시 조회 오류: {e}")
        
        return None

# 전역 데이터베이스 인스턴스
db = Database()
