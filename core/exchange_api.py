"""
실제 거래소 API 통합
Binance & Upbit 실제 주문 실행
"""
import asyncio
import os
from typing import Dict, Optional
from decimal import Decimal
from datetime import datetime
import ccxt.async_support as ccxt
import hmac
import hashlib
import base64
import time

class ExchangeAPI:
    """
    거래소 API 통합 클래스
    - Binance: 글로벌 거래소
    - Upbit: 국내 거래소
    """
    
    def __init__(self):
        # API 키 로드
        self.binance_api_key = os.getenv("BINANCE_API_KEY", "")
        self.binance_api_secret = os.getenv("BINANCE_API_SECRET", "")
        self.upbit_access_key = os.getenv("UPBIT_ACCESS_KEY", "")
        self.upbit_secret_key = os.getenv("UPBIT_SECRET_KEY", "")
        
        # CCXT 인스턴스
        self.binance = None
        self.upbit = None
        
        # 연결 상태
        self.binance_connected = False
        self.upbit_connected = False
    
    async def connect(self):
        """거래소 연결"""
        # Binance 연결
        if self.binance_api_key and self.binance_api_secret:
            try:
                self.binance = ccxt.binance({
                    'apiKey': self.binance_api_key,
                    'secret': self.binance_api_secret,
                    'enableRateLimit': True,
                    'options': {
                        'defaultType': 'spot',
                        'adjustForTimeDifference': True,
                    }
                })
                await self.binance.load_markets()
                self.binance_connected = True
                print("✅ Binance 연결 성공")
            except Exception as e:
                print(f"⚠️ Binance 연결 실패: {e}")
        
        # Upbit 연결
        if self.upbit_access_key and self.upbit_secret_key:
            try:
                self.upbit = ccxt.upbit({
                    'apiKey': self.upbit_access_key,
                    'secret': self.upbit_secret_key,
                    'enableRateLimit': True,
                })
                await self.upbit.load_markets()
                self.upbit_connected = True
                print("✅ Upbit 연결 성공")
            except Exception as e:
                print(f"⚠️ Upbit 연결 실패: {e}")
    
    async def disconnect(self):
        """거래소 연결 종료"""
        if self.binance:
            await self.binance.close()
        if self.upbit:
            await self.upbit.close()
    
    # ========== Binance API ==========
    
    async def binance_create_order(
        self,
        symbol: str,
        side: str,  # 'buy' or 'sell'
        amount: Decimal,
        order_type: str = 'market'  # 'market' or 'limit'
    ) -> Dict:
        """
        Binance 주문 생성
        
        Returns:
            {
                'order_id': str,
                'status': str,
                'filled': Decimal,
                'price': Decimal,
                'timestamp': float
            }
        """
        if not self.binance_connected:
            raise Exception("Binance not connected")
        
        try:
            # CCXT 주문 생성
            order = await self.binance.create_order(
                symbol=symbol,
                type=order_type,
                side=side,
                amount=float(amount)
            )
            
            return {
                'order_id': order.get('id'),
                'status': order.get('status', 'unknown'),
                'filled': Decimal(str(order.get('filled', 0))),
                'price': Decimal(str(order.get('price', 0))),
                'timestamp': order.get('timestamp', time.time() * 1000) / 1000,
                'raw': order
            }
        except Exception as e:
            print(f"Binance 주문 생성 오류: {e}")
            raise
    
    async def binance_get_order_status(self, symbol: str, order_id: str) -> Dict:
        """Binance 주문 상태 조회"""
        if not self.binance_connected:
            raise Exception("Binance not connected")
        
        try:
            order = await self.binance.fetch_order(order_id, symbol)
            return {
                'order_id': order.get('id'),
                'status': order.get('status'),
                'filled': Decimal(str(order.get('filled', 0))),
                'remaining': Decimal(str(order.get('remaining', 0))),
                'price': Decimal(str(order.get('price', 0))),
            }
        except Exception as e:
            print(f"Binance 주문 상태 조회 오류: {e}")
            raise
    
    async def binance_cancel_order(self, symbol: str, order_id: str) -> bool:
        """Binance 주문 취소"""
        if not self.binance_connected:
            raise Exception("Binance not connected")
        
        try:
            await self.binance.cancel_order(order_id, symbol)
            return True
        except Exception as e:
            print(f"Binance 주문 취소 오류: {e}")
            return False
    
    # ========== Upbit API ==========
    
    async def upbit_create_order(
        self,
        market: str,  # 예: 'KRW-BTC'
        side: str,  # 'buy' or 'sell'
        volume: Optional[Decimal] = None,
        price: Optional[Decimal] = None,
        ord_type: str = 'market'  # 'market' or 'limit'
    ) -> Dict:
        """
        Upbit 주문 생성
        
        Returns:
            {
                'order_id': str (uuid),
                'status': str,
                'executed_volume': Decimal,
                'price': Decimal,
                'timestamp': float
            }
        """
        if not self.upbit_connected:
            raise Exception("Upbit not connected")
        
        try:
            params = {
                'market': market,
                'side': side,
                'ord_type': ord_type,
            }
            
            if ord_type == 'market':
                if side == 'buy':
                    # 시장가 매수: price 필요
                    if price:
                        params['price'] = float(price)
                else:
                    # 시장가 매도: volume 필요
                    if volume:
                        params['volume'] = float(volume)
            else:
                # 지정가: price와 volume 모두 필요
                if price:
                    params['price'] = float(price)
                if volume:
                    params['volume'] = float(volume)
            
            order = await self.upbit.create_order(**params)
            
            return {
                'order_id': order.get('uuid'),
                'status': order.get('state', 'unknown'),
                'executed_volume': Decimal(str(order.get('executed_volume', 0))),
                'price': Decimal(str(order.get('price', 0))),
                'timestamp': time.time(),
                'raw': order
            }
        except Exception as e:
            print(f"Upbit 주문 생성 오류: {e}")
            raise
    
    async def upbit_get_order_status(self, uuid: str) -> Dict:
        """Upbit 주문 상태 조회"""
        if not self.upbit_connected:
            raise Exception("Upbit not connected")
        
        try:
            order = await self.upbit.fetch_order(uuid)
            return {
                'order_id': order.get('id') or order.get('uuid'),
                'status': order.get('status') or order.get('state'),
                'filled': Decimal(str(order.get('filled', 0))),
                'remaining': Decimal(str(order.get('remaining', 0))),
                'price': Decimal(str(order.get('price', 0))),
            }
        except Exception as e:
            print(f"Upbit 주문 상태 조회 오류: {e}")
            raise
    
    async def upbit_cancel_order(self, uuid: str) -> bool:
        """Upbit 주문 취소"""
        if not self.upbit_connected:
            raise Exception("Upbit not connected")
        
        try:
            await self.upbit.cancel_order(uuid)
            return True
        except Exception as e:
            print(f"Upbit 주문 취소 오류: {e}")
            return False
    
    # ========== 유틸리티 ==========
    
    async def get_balance(self, exchange: str, currency: str = 'USDT') -> Decimal:
        """잔고 조회"""
        try:
            if exchange == 'binance' and self.binance_connected:
                balance = await self.binance.fetch_balance()
                return Decimal(str(balance.get(currency, {}).get('free', 0)))
            elif exchange == 'upbit' and self.upbit_connected:
                balance = await self.upbit.fetch_balance()
                return Decimal(str(balance.get(currency, {}).get('free', 0)))
        except Exception as e:
            print(f"잔고 조회 오류: {e}")
        
        return Decimal('0')
    
    async def get_ticker(self, exchange: str, symbol: str) -> Dict:
        """시세 조회"""
        try:
            if exchange == 'binance' and self.binance_connected:
                ticker = await self.binance.fetch_ticker(symbol)
                return {
                    'last': Decimal(str(ticker.get('last', 0))),
                    'bid': Decimal(str(ticker.get('bid', 0))),
                    'ask': Decimal(str(ticker.get('ask', 0))),
                }
            elif exchange == 'upbit' and self.upbit_connected:
                ticker = await self.upbit.fetch_ticker(symbol)
                return {
                    'last': Decimal(str(ticker.get('last', 0))),
                    'bid': Decimal(str(ticker.get('bid', 0))),
                    'ask': Decimal(str(ticker.get('ask', 0))),
                }
        except Exception as e:
            print(f"시세 조회 오류: {e}")
        
        return {}

# 전역 인스턴스
exchange_api = ExchangeAPI()
