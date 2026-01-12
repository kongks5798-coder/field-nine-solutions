"""
Field Nine: Crypto Arbitrage Engine v1.0
Binance와 Upbit 간 BTC/USDT 차익거래 기회 모니터링

필수 패키지:
pip install ccxt

실행:
python scripts/crypto-arbitrage-bot.py
"""

import ccxt
import time
import os
from datetime import datetime

# 환경변수에서 API 키 로드 (옵션)
BINANCE_API_KEY = os.getenv('BINANCE_API_KEY', '')
BINANCE_API_SECRET = os.getenv('BINANCE_API_SECRET', '')
UPBIT_API_KEY = os.getenv('UPBIT_API_KEY', '')
UPBIT_API_SECRET = os.getenv('UPBIT_API_SECRET', '')

# Exchange 초기화
def init_exchanges():
    """거래소 초기화"""
    binance = ccxt.binance({
        'apiKey': BINANCE_API_KEY if BINANCE_API_KEY else None,
        'secret': BINANCE_API_SECRET if BINANCE_API_SECRET else None,
        'enableRateLimit': True,
        'options': {
            'defaultType': 'spot',  # spot, future, delivery
        }
    })
    
    upbit = ccxt.upbit({
        'apiKey': UPBIT_API_KEY if UPBIT_API_KEY else None,
        'secret': UPBIT_API_SECRET if UPBIT_API_SECRET else None,
        'enableRateLimit': True,
    })
    
    return binance, upbit

def calculate_profit_opportunity(binance_price, upbit_price_krw, exchange_rate=1400):
    """
    수익 기회 계산
    
    Args:
        binance_price: Binance BTC/USDT 가격
        upbit_price_krw: Upbit BTC/KRW 가격
        exchange_rate: USD/KRW 환율 (기본값: 1400)
    
    Returns:
        profit_usd: 예상 수익 (USD)
        profit_percent: 수익률 (%)
    """
    upbit_price_usd = upbit_price_krw / exchange_rate
    price_diff = binance_price - upbit_price_usd
    
    # 수수료 고려 (Binance 0.1%, Upbit 0.05%)
    fees = (binance_price * 0.001) + (upbit_price_usd * 0.0005)
    net_profit = abs(price_diff) - fees
    
    profit_percent = (net_profit / binance_price) * 100 if binance_price > 0 else 0
    
    return net_profit, profit_percent, price_diff

def run_fieldnine_bot():
    """Field Nine 암호화폐 차익거래 봇 실행"""
    print("🦾 JARVIS: Starting Profit Engine on fieldnine.io...")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    binance, upbit = init_exchanges()
    
    symbol_binance = 'BTC/USDT'
    symbol_upbit = 'BTC/KRW'
    
    # 모니터링 설정
    min_profit_threshold = 50  # 최소 수익 임계값 (USD)
    min_profit_percent = 0.5   # 최소 수익률 (%)
    monitoring_interval = 0.1   # 모니터링 간격 (초)
    
    opportunity_count = 0
    
    try:
        while True:
            try:
                # 1. 시세 데이터 수집
                b_ticker = binance.fetch_ticker(symbol_binance)
                u_ticker = upbit.fetch_ticker(symbol_upbit)
                
                binance_price = b_ticker['last']
                upbit_price_krw = u_ticker['last']
                
                # 2. 수익 기회 계산
                net_profit, profit_percent, price_diff = calculate_profit_opportunity(
                    binance_price, upbit_price_krw
                )
                
                # 3. 수익 기회 발견 시 알림
                if net_profit > min_profit_threshold and profit_percent > min_profit_percent:
                    opportunity_count += 1
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    print(f"\n🎯 Opportunity #{opportunity_count} Found! [{timestamp}]")
                    print(f"   Binance BTC/USDT: ${binance_price:,.2f}")
                    print(f"   Upbit BTC/KRW: ₩{upbit_price_krw:,.0f} (${upbit_price_krw/1400:,.2f})")
                    print(f"   Price Difference: ${price_diff:,.2f}")
                    print(f"   Net Profit: ${net_profit:,.2f} ({profit_percent:.2f}%)")
                    print(f"   💰 Estimated Profit: +${net_profit:,.2f}")
                    print("-" * 60)
                    
                    # 여기에 복사/붙여넣기 시 즉시 작동하는 주문 함수 추가 예정
                    # execute_arbitrage_trade(binance, upbit, binance_price, upbit_price_krw)
                
                # 4. 실시간 모니터링 (선택적 출력)
                # print(f"Monitoring... Binance: ${binance_price:,.2f} | Upbit: ₩{upbit_price_krw:,.0f} | Diff: ${price_diff:,.2f}")
                
                time.sleep(monitoring_interval)
                
            except ccxt.NetworkError as e:
                print(f"⚠️ Network Error: {e}")
                print("💡 Tip: Check your internet connection.")
                time.sleep(5)  # 5초 대기 후 재시도
                
            except ccxt.ExchangeError as e:
                print(f"⚠️ Exchange Error: {e}")
                print("💡 Tip: Check API keys and exchange status.")
                time.sleep(5)
                
            except Exception as e:
                print(f"⚠️ Error detected: {e}")
                print("💡 Tip: If WSL connection lost, run 'wsl --shutdown' then restart.")
                time.sleep(5)
                
    except KeyboardInterrupt:
        print(f"\n\n🛑 Bot stopped by user.")
        print(f"📊 Total opportunities found: {opportunity_count}")
        print(f"⏰ Stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def execute_arbitrage_trade(binance, upbit, binance_price, upbit_price_krw):
    """
    차익거래 실행 (향후 구현)
    
    주의: 실제 거래를 실행하기 전에 충분한 테스트가 필요합니다.
    """
    # TODO: 실제 주문 로직 구현
    # 1. Binance에서 BTC 구매
    # 2. Upbit에서 BTC 판매
    # 3. 수익 확인
    pass

if __name__ == "__main__":
    run_fieldnine_bot()
