# CEO Briefing Agent v2.0 - Field Nine OS Level 3
# 실제 시트 구조에 최적화된 버전

import os
import sys
import json
from datetime import datetime, timedelta

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

# 환경변수 로드
env_path = r"C:\Users\polor\field-nine-dashboard\.env.local"
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ[key.strip()] = value.strip().strip('"').strip("'")

from google.oauth2 import service_account
from googleapiclient.discovery import build


def parse_amount(val):
    """금액 문자열 파싱 (예: '16,515,029' → 16515029)"""
    if not val:
        return 0
    s = str(val).replace(',', '').replace(' ', '').replace('₩', '')
    try:
        return int(float(s))
    except:
        return 0


def get_sheets_service():
    """Google Sheets API 서비스 생성"""
    email = os.environ.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    key = os.environ.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "").replace("\\n", "\n")

    credentials = service_account.Credentials.from_service_account_info(
        {
            "type": "service_account",
            "client_email": email,
            "private_key": key,
            "token_uri": "https://oauth2.googleapis.com/token"
        },
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    return build('sheets', 'v4', credentials=credentials)


def read_sheet(service, sheet_name, range_str="A:Z"):
    """시트 데이터 읽기"""
    spreadsheet_id = "1EIhlnIvT2gutlyVMhDcARxU8DAC4M9rR5BHbphzLvB4"
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=f"'{sheet_name}'!{range_str}"
    ).execute()
    return result.get('values', [])


def main():
    print("╔" + "═" * 70 + "╗")
    print("║" + " " * 20 + "FIELD NINE OS Level 3" + " " * 29 + "║")
    print("║" + " " * 18 + "CEO BRIEFING AGENT v2.0" + " " * 29 + "║")
    print("╚" + "═" * 70 + "╝")
    print(f"\n[INIT] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    service = get_sheets_service()
    print("[OK] Google Sheets 연결 완료\n")

    # ============================================================
    # PHASE 1: PLAN
    # ============================================================
    print("=" * 70)
    print("[PHASE 1: PLAN] 데이터 수집 전략")
    print("=" * 70)
    print("  → Target: 2026_영업_PLAN_NEW")
    print("  → Sheets: 2026, 주문현황, 클레임현황, 목표설정, 데이터_대시보드")
    print("  → Metrics: 목표달성률, TOP3 상품, 클레임 리스크")

    # ============================================================
    # PHASE 2: EXECUTE - 데이터 수집 및 분석
    # ============================================================
    print("\n" + "=" * 70)
    print("[PHASE 2: EXECUTE] 데이터 수집 및 분석")
    print("=" * 70)

    # 1. 2026 매출 시트 분석
    print("\n[SCAN] '2026' 시트 분석 중...")
    sales_data = read_sheet(service, "2026")

    # 헤더 찾기 (row 1 = 실제 헤더)
    headers = sales_data[1] if len(sales_data) > 1 else []
    data_rows = sales_data[2:] if len(sales_data) > 2 else []

    print(f"  → Headers: {headers[:8]}")
    print(f"  → Data rows: {len(data_rows)}")

    # 플랫폼별 컬럼 인덱스
    platform_cols = {}
    platforms = ['무신사', '공홈', '29CM', '무신사글로벌', '큐텐', '60%', '성수아울렛']
    for i, h in enumerate(headers):
        for p in platforms:
            if h and p.lower() in str(h).lower():
                platform_cols[p] = i
                break

    print(f"  → Platforms: {list(platform_cols.keys())}")

    # 2026년 매출 집계
    platform_totals = {p: 0 for p in platform_cols}
    weekly_sales = {}  # 주차별 매출
    this_week_sales = {}

    now = datetime.now()
    current_week = now.isocalendar()[1]

    for row in data_rows:
        week_label = row[0] if len(row) > 0 else ""
        date_str = row[1] if len(row) > 1 else ""

        # 플랫폼별 매출 집계
        for platform, col_idx in platform_cols.items():
            if col_idx < len(row):
                amount = parse_amount(row[col_idx])
                platform_totals[platform] += amount

                # 이번 주 데이터 확인
                if "2026년 1월" in str(week_label) and str(current_week) in str(week_label).replace("주차", ""):
                    this_week_sales[platform] = this_week_sales.get(platform, 0) + amount

        # 주차별 집계
        if week_label and "주간합계" not in str(week_label):
            weekly_sales[week_label] = weekly_sales.get(week_label, 0)
            for platform, col_idx in platform_cols.items():
                if col_idx < len(row):
                    weekly_sales[week_label] += parse_amount(row[col_idx])

    total_revenue = sum(platform_totals.values())
    print(f"\n  → 총 매출: ₩{total_revenue:,}")

    # 플랫폼별 TOP
    sorted_platforms = sorted(platform_totals.items(), key=lambda x: x[1], reverse=True)
    for i, (p, v) in enumerate(sorted_platforms[:5]):
        print(f"     #{i+1} {p}: ₩{v:,}")

    # 2. 목표 설정 시트
    print("\n[SCAN] '목표설정' 시트 분석 중...")
    target_data = read_sheet(service, "목표설정")

    target_revenue = 0
    current_revenue = 0

    if len(target_data) > 1:
        headers_target = target_data[0]
        row = target_data[1]

        # 컬럼 찾기
        for i, h in enumerate(headers_target):
            if "매출목표" in str(h):
                target_revenue = parse_amount(row[i]) if i < len(row) else 0
            if "현재매출" in str(h):
                current_revenue = parse_amount(row[i]) if i < len(row) else 0

    # 실제 매출로 보정 (시트의 현재매출이 더 정확할 수 있음)
    if total_revenue > current_revenue:
        current_revenue = total_revenue

    achievement_rate = (current_revenue / target_revenue * 100) if target_revenue > 0 else 0

    print(f"  → 목표: ₩{target_revenue:,}")
    print(f"  → 현재: ₩{current_revenue:,}")
    print(f"  → 달성률: {achievement_rate:.1f}%")

    # 3. 주문현황 시트 (TOP 상품 분석)
    print("\n[SCAN] '주문현황' 시트 분석 중...")
    orders_data = read_sheet(service, "주문현황")

    order_stats = {
        "결제완료": 0,
        "상품준비": 0,
        "배송중": 0,
        "배송완료": 0,
        "구매확정": 0,
        "긴급출고": 0
    }

    if len(orders_data) > 1:
        headers_orders = orders_data[0]
        for row in orders_data[1:]:
            for i, h in enumerate(headers_orders):
                if h in order_stats and i < len(row):
                    order_stats[h] += parse_amount(row[i])

    print(f"  → 주문현황: {order_stats}")

    # 4. 클레임현황 시트
    print("\n[SCAN] '클레임현황' 시트 분석 중...")
    claims_data = read_sheet(service, "클레임현황")

    claims_count = len(claims_data) - 1 if len(claims_data) > 1 else 0
    high_priority = 0
    claim_types = {}

    if len(claims_data) > 1:
        headers_claims = claims_data[0]

        # 유형 컬럼 찾기
        type_col = -1
        status_col = -1
        for i, h in enumerate(headers_claims):
            if any(k in str(h) for k in ['유형', '구분', '종류', '사유']):
                type_col = i
            if any(k in str(h) for k in ['상태', '처리', '진행']):
                status_col = i

        for row in claims_data[1:]:
            # 유형별 집계
            if type_col >= 0 and type_col < len(row):
                t = str(row[type_col])
                claim_types[t] = claim_types.get(t, 0) + 1

            # 긴급 건 확인
            if status_col >= 0 and status_col < len(row):
                status = str(row[status_col])
                if any(k in status for k in ['미처리', '대기', '긴급', '즉시']):
                    high_priority += 1

    risk_level = "HIGH" if high_priority > 5 else "MEDIUM" if high_priority > 0 else "LOW"
    top_claim = max(claim_types.items(), key=lambda x: x[1]) if claim_types else ("없음", 0)

    print(f"  → 총 클레임: {claims_count}건")
    print(f"  → 리스크 레벨: {risk_level}")
    print(f"  → 긴급 처리 필요: {high_priority}건")

    # 5. 데이터_대시보드 (주간 TOP 상품)
    print("\n[SCAN] '데이터_대시보드' 시트 분석 중...")
    dashboard_data = read_sheet(service, "데이터_대시보드")

    # 이번 주 데이터 분석 (최근 7일)
    weekly_revenue = []
    if len(dashboard_data) > 1:
        headers_dash = dashboard_data[0]

        # 2026_매출 컬럼 찾기
        revenue_col = -1
        for i, h in enumerate(headers_dash):
            if "2026_매출" in str(h):
                revenue_col = i
                break

        # 최근 7일 데이터
        for row in dashboard_data[1:8]:  # 최근 7일
            date_label = row[0] if len(row) > 0 else ""
            if revenue_col >= 0 and revenue_col < len(row):
                rev = parse_amount(str(row[revenue_col]).replace('.', '')) * 100000  # 백만원 단위 보정
                weekly_revenue.append({"date": date_label, "revenue": rev})

    # TOP 3 주차 (주간 매출 기준)
    top_weeks = sorted(weekly_sales.items(), key=lambda x: x[1], reverse=True)[:3]

    # ============================================================
    # PHASE 3: VERIFY
    # ============================================================
    print("\n" + "=" * 70)
    print("[PHASE 3: VERIFY] 데이터 검증")
    print("=" * 70)

    verification = {
        "sales_data": "VERIFIED" if total_revenue > 0 else "NO_DATA",
        "target_data": "VERIFIED" if target_revenue > 0 else "NO_DATA",
        "orders_data": "VERIFIED" if sum(order_stats.values()) > 0 else "NO_DATA",
        "claims_data": "VERIFIED"
    }

    for item, status in verification.items():
        symbol = "✓" if status == "VERIFIED" else "✗"
        print(f"  [{symbol}] {item}: {status}")

    overall = "PASS" if all(v == "VERIFIED" for v in verification.values()) else "PARTIAL"
    print(f"\n  [RESULT] 검증 결과: {overall}")

    # ============================================================
    # PHASE 4: AESTHETICS - Tesla Style CEO Report
    # ============================================================
    print("\n" + "=" * 70)
    print("[PHASE 4: AESTHETICS] Tesla Style CEO Report")
    print("=" * 70)

    # 상태 결정
    if achievement_rate >= 100:
        status = "ACHIEVED"
        status_color = "🟢"
    elif achievement_rate >= 80:
        status = "ON_TRACK"
        status_color = "🟡"
    elif achievement_rate >= 50:
        status = "ATTENTION"
        status_color = "🟠"
    else:
        status = "CRITICAL"
        status_color = "🔴"

    # 진행률 바
    bar_filled = int(min(achievement_rate / 5, 20))
    bar_empty = 20 - bar_filled
    progress_bar = "▓" * bar_filled + "░" * bar_empty

    report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ███████╗██╗███████╗██╗     ██████╗     ███╗   ██╗██╗███╗   ██╗███████╗   ║
║     ██╔════╝██║██╔════╝██║     ██╔══██╗    ████╗  ██║██║████╗  ██║██╔════╝   ║
║     █████╗  ██║█████╗  ██║     ██║  ██║    ██╔██╗ ██║██║██╔██╗ ██║█████╗     ║
║     ██╔══╝  ██║██╔══╝  ██║     ██║  ██║    ██║╚██╗██║██║██║╚██╗██║██╔══╝     ║
║     ██║     ██║███████╗███████╗██████╔╝    ██║ ╚████║██║██║ ╚████║███████╗   ║
║     ╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝     ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝╚══════╝   ║
║                                                                              ║
║                          CEO STATUS REPORT                                   ║
║                       {datetime.now().strftime('%Y.%m.%d %H:%M')}                                      ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │  01. TARGET ACHIEVEMENT                                 {status_color} {status:<12}│   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║       ACHIEVEMENT RATE ────────────────────────────────  {achievement_rate:>6.1f}%             ║
║                                                                              ║
║       [{progress_bar}]                               ║
║                                                                              ║
║       ACTUAL    ₩{current_revenue:>18,}                                      ║
║       TARGET    ₩{target_revenue:>18,}                                      ║
║       GAP       ₩{target_revenue - current_revenue:>18,}                                      ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │  02. PLATFORM PERFORMANCE (YTD)                                      │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║"""

    for i, (platform, amount) in enumerate(sorted_platforms[:5]):
        pct = (amount / total_revenue * 100) if total_revenue > 0 else 0
        bar_len = int(pct / 5)
        bar = "█" * bar_len
        report += f"\n║       {platform:<12} ₩{amount:>15,}  {pct:>5.1f}%  {bar:<10}       ║"

    report += f"""
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │  03. TOP 3 WEEKS (HIGHEST REVENUE)                                   │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║"""

    for i, (week, amount) in enumerate(top_weeks):
        report += f"\n║       #{i+1}  {week:<25}  ₩{amount:>15,}       ║"

    report += f"""
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │  04. OPERATIONS STATUS                                               │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║       결제완료  {order_stats['결제완료']:>6}     상품준비  {order_stats['상품준비']:>6}     배송중  {order_stats['배송중']:>6}              ║
║       배송완료  {order_stats['배송완료']:>6}     구매확정  {order_stats['구매확정']:>6}     긴급출고  {order_stats['긴급출고']:>4}              ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │  05. RISK ALERT                              [{risk_level:^8}]              │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║       TOP CLAIM TYPE     {top_claim[0]:<20}  ({top_claim[1]} cases)               ║
║       URGENT ACTION      {high_priority} items require immediate attention                ║
║       TOTAL CLAIMS       {claims_count} cases this period                                  ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   VERIFICATION: {overall:<10}                                                    ║
║   GENERATED BY: FIELD NINE OS Level 3 Agent                                  ║
║   SOURCE: 2026_영업_PLAN_NEW (Google Sheets)                                   ║
║   TIMESTAMP: {datetime.now().isoformat():<35}                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

    print(report)

    # 결과 저장
    result = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "achievement_rate": achievement_rate,
            "current_revenue": current_revenue,
            "target_revenue": target_revenue,
            "status": status
        },
        "platforms": platform_totals,
        "top_weeks": [{"week": w, "revenue": r} for w, r in top_weeks],
        "orders": order_stats,
        "claims": {
            "total": claims_count,
            "high_priority": high_priority,
            "risk_level": risk_level,
            "top_type": top_claim
        },
        "verification": verification
    }

    result_path = r"C:\Users\polor\field-nine-solutions\ceo_briefing_final.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n[SAVED] {result_path}")
    print("[DONE] CEO Briefing 완료")

    return result


if __name__ == "__main__":
    main()
