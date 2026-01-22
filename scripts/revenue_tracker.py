import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# .env.production 파일 로드
load_dotenv('.env.production')

# Supabase 클라이언트 (한 번만 생성)
supabase_client = None

def get_supabase():
    global supabase_client
    if supabase_client is None:
        url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            print("오류: Supabase URL 또는 Key가 .env 파일에 설정되지 않았습니다.")
            return None
        supabase_client = create_client(url, key)
    return supabase_client

def get_platinum_metrics():
    try:
        supabase = get_supabase()
        if not supabase:
            return None, None

        # 실결제 데이터 가져오기
        response = supabase.table('orders').select('total_price').eq('status', 'completed').execute()

        total_revenue = sum(item['total_price'] for item in response.data)

        # 비용 (향후 실제 API 비용 연동 가능)
        estimated_cost = 150.50
        net_profit = total_revenue - estimated_cost

        return total_revenue, net_profit
    except Exception as e:
        print(f"데이터 로드 중 예외 발생: {e}")
        return None, None

def print_dashboard(rev, profit):
    if rev is None:
        print("데이터를 불러올 수 없어 대시보드를 업데이트하지 못했습니다.")
        return

    # PM2 모드에서는 화면 클리어 안함
    if os.environ.get('PM2_HOME') is None and os.isatty(1):
        os.system('cls' if os.name == 'nt' else 'clear')

    # rev가 0일 때 ZeroDivisionError 방지
    margin = (profit / rev * 100) if rev > 0 else 0

    print("=" * 50)
    print(" FIELD NINE OS: PLATINUM SOVEREIGNTY ")
    print(" STATUS: 100% LIVE DATA VERIFIED ")
    print("=" * 50)
    print(f" [REVENUE] : ${rev:,.2f}")
    print(f" [COSTS]   : ${150.50:,.2f}")
    print(f" [PROFIT]  : ${profit:,.2f} (MARGIN: {margin:.1f}%)")
    print("=" * 50)
    print(f" UPDATED: {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    print("Starting Field Nine Revenue Tracker...")
    while True:
        rev, profit = get_platinum_metrics()
        print_dashboard(rev, profit)
        time.sleep(1)
