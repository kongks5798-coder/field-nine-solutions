# Daily CEO Briefing - Full Version with Notifications
# Field Nine OS Level 3 Agent
# Runs every morning at 8:00 AM

import os
import sys
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import requests

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


# ============================================================
# CONFIGURATION
# ============================================================
CONFIG = {
    "spreadsheet_id": "1EIhlnIvT2gutlyVMhDcARxU8DAC4M9rR5BHbphzLvB4",
    "log_dir": r"C:\Users\polor\field-nine-solutions\logs",
    "output_dir": r"C:\Users\polor\field-nine-solutions\reports",
    "kakao_enabled": False,  # KAKAO_REST_API_KEY 설정 시 True
    "email_enabled": False,  # SMTP 설정 시 True
    "slack_enabled": False,  # SLACK_WEBHOOK_URL 설정 시 True
}


def parse_amount(val):
    if not val:
        return 0
    s = str(val).replace(',', '').replace(' ', '').replace('₩', '')
    try:
        return int(float(s))
    except:
        return 0


def get_sheets_service():
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
    result = service.spreadsheets().values().get(
        spreadsheetId=CONFIG["spreadsheet_id"],
        range=f"'{sheet_name}'!{range_str}"
    ).execute()
    return result.get('values', [])


def analyze_sales(service):
    """매출 데이터 분석"""
    sales_data = read_sheet(service, "2026")
    headers = sales_data[1] if len(sales_data) > 1 else []
    data_rows = sales_data[2:] if len(sales_data) > 2 else []

    platform_cols = {}
    platforms = ['무신사', '공홈', '29CM', '무신사글로벌', '큐텐', '60%', '성수아울렛']
    for i, h in enumerate(headers):
        for p in platforms:
            if h and p.lower() in str(h).lower():
                platform_cols[p] = i
                break

    platform_totals = {p: 0 for p in platform_cols}
    today_sales = 0
    this_week_sales = 0

    today = datetime.now().strftime("%Y. %m. %d").replace(" 0", " ")

    for row in data_rows:
        date_str = row[1] if len(row) > 1 else ""
        row_total = 0

        for platform, col_idx in platform_cols.items():
            if col_idx < len(row):
                amount = parse_amount(row[col_idx])
                platform_totals[platform] += amount
                row_total += amount

        # 오늘 매출
        if today in str(date_str):
            today_sales = row_total

        # 이번 주 매출 (최근 7일)
        if "2026년 1월" in str(row[0] if row else ""):
            this_week_sales += row_total

    return {
        "total": sum(platform_totals.values()),
        "today": today_sales,
        "this_week": this_week_sales,
        "by_platform": platform_totals
    }


def analyze_targets(service):
    """목표 달성률 분석"""
    target_data = read_sheet(service, "목표설정")

    target_revenue = 0
    current_revenue = 0

    if len(target_data) > 1:
        headers = target_data[0]
        row = target_data[1]

        for i, h in enumerate(headers):
            if "매출목표" in str(h):
                target_revenue = parse_amount(row[i]) if i < len(row) else 0
            if "현재매출" in str(h):
                current_revenue = parse_amount(row[i]) if i < len(row) else 0

    return {
        "target": target_revenue,
        "current": current_revenue,
        "rate": (current_revenue / target_revenue * 100) if target_revenue > 0 else 0
    }


def analyze_orders(service):
    """주문 현황 분석"""
    orders_data = read_sheet(service, "주문현황")

    stats = {
        "결제완료": 0, "상품준비": 0, "배송중": 0,
        "배송완료": 0, "구매확정": 0, "긴급출고": 0
    }

    if len(orders_data) > 1:
        headers = orders_data[0]
        for row in orders_data[1:]:
            for i, h in enumerate(headers):
                if h in stats and i < len(row):
                    stats[h] += parse_amount(row[i])

    return stats


def analyze_claims(service):
    """클레임 분석"""
    claims_data = read_sheet(service, "클레임현황")

    total = len(claims_data) - 1 if len(claims_data) > 1 else 0
    high_priority = 0

    if len(claims_data) > 1:
        headers = claims_data[0]
        status_col = -1
        for i, h in enumerate(headers):
            if any(k in str(h) for k in ['상태', '처리', '진행']):
                status_col = i
                break

        for row in claims_data[1:]:
            if status_col >= 0 and status_col < len(row):
                status = str(row[status_col])
                if any(k in status for k in ['미처리', '대기', '긴급', '즉시']):
                    high_priority += 1

    risk = "HIGH" if high_priority > 5 else "MEDIUM" if high_priority > 0 else "LOW"

    return {"total": total, "urgent": high_priority, "risk": risk}


def generate_text_report(data):
    """텍스트 브리핑 리포트 생성"""
    sales = data["sales"]
    targets = data["targets"]
    orders = data["orders"]
    claims = data["claims"]

    sorted_platforms = sorted(sales["by_platform"].items(), key=lambda x: x[1], reverse=True)

    report = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FIELD NINE - Daily CEO Briefing
  {datetime.now().strftime('%Y년 %m월 %d일 %H:%M')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 매출 현황
  • 오늘 매출: ₩{sales['today']:,}
  • 이번 주: ₩{sales['this_week']:,}
  • 누적 (YTD): ₩{sales['total']:,}

🎯 목표 달성률: {targets['rate']:.1f}%
  • 목표: ₩{targets['target']:,}
  • 현재: ₩{targets['current']:,}

🏆 플랫폼 TOP 3
"""
    for i, (p, v) in enumerate(sorted_platforms[:3]):
        pct = (v / sales['total'] * 100) if sales['total'] > 0 else 0
        report += f"  {i+1}. {p}: ₩{v:,} ({pct:.1f}%)\n"

    report += f"""
📦 주문 현황
  • 결제완료: {orders['결제완료']} | 상품준비: {orders['상품준비']} | 배송중: {orders['배송중']}
  • 배송완료: {orders['배송완료']} | 구매확정: {orders['구매확정']} | 긴급: {orders['긴급출고']}

⚠️ 리스크 알림: {claims['risk']}
  • 총 클레임: {claims['total']}건
  • 긴급 처리 필요: {claims['urgent']}건

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Generated by Field Nine OS Level 3 Agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    return report


def send_kakao_notification(message):
    """카카오톡 알림 전송"""
    kakao_key = os.environ.get("KAKAO_REST_API_KEY")
    if not kakao_key:
        return False

    # 카카오 나에게 보내기 API
    url = "https://kapi.kakao.com/v2/api/talk/memo/default/send"
    headers = {"Authorization": f"Bearer {kakao_key}"}

    template = {
        "object_type": "text",
        "text": message[:2000],  # 최대 2000자
        "link": {
            "web_url": "https://field-nine-dashboard.vercel.app/panopticon",
            "mobile_web_url": "https://field-nine-dashboard.vercel.app/panopticon"
        }
    }

    try:
        response = requests.post(url, headers=headers, data={"template_object": json.dumps(template)})
        return response.status_code == 200
    except Exception as e:
        print(f"[KAKAO ERROR] {e}")
        return False


def send_slack_notification(message):
    """Slack 알림 전송"""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    if not webhook_url:
        return False

    try:
        response = requests.post(webhook_url, json={"text": message})
        return response.status_code == 200
    except Exception as e:
        print(f"[SLACK ERROR] {e}")
        return False


def save_report(data, text_report):
    """리포트 저장"""
    # 디렉토리 생성
    os.makedirs(CONFIG["log_dir"], exist_ok=True)
    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    date_str = datetime.now().strftime("%Y-%m-%d")

    # JSON 저장
    json_path = os.path.join(CONFIG["output_dir"], f"briefing_{timestamp}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "data": data
        }, f, ensure_ascii=False, indent=2)

    # 텍스트 리포트 저장
    txt_path = os.path.join(CONFIG["output_dir"], f"briefing_{timestamp}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text_report)

    # 로그 기록
    log_path = os.path.join(CONFIG["log_dir"], "daily_briefing.log")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().isoformat()}] Briefing generated: {json_path}\n")

    return json_path, txt_path


def main():
    print("=" * 60)
    print("  FIELD NINE OS - Daily CEO Briefing")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    try:
        service = get_sheets_service()
        print("[OK] Google Sheets 연결")

        # 데이터 수집
        print("\n[ANALYZE] 데이터 분석 중...")
        data = {
            "sales": analyze_sales(service),
            "targets": analyze_targets(service),
            "orders": analyze_orders(service),
            "claims": analyze_claims(service)
        }

        print(f"  → 총 매출: ₩{data['sales']['total']:,}")
        print(f"  → 달성률: {data['targets']['rate']:.1f}%")
        print(f"  → 리스크: {data['claims']['risk']}")

        # 리포트 생성
        print("\n[REPORT] 리포트 생성 중...")
        text_report = generate_text_report(data)
        json_path, txt_path = save_report(data, text_report)
        print(f"  → 저장: {txt_path}")

        # 알림 전송
        print("\n[NOTIFY] 알림 전송...")

        if CONFIG["kakao_enabled"] and os.environ.get("KAKAO_REST_API_KEY"):
            if send_kakao_notification(text_report):
                print("  → 카카오톡: ✓")
            else:
                print("  → 카카오톡: ✗ (전송 실패)")
        else:
            print("  → 카카오톡: - (미설정)")

        if CONFIG["slack_enabled"] and os.environ.get("SLACK_WEBHOOK_URL"):
            if send_slack_notification(text_report):
                print("  → Slack: ✓")
            else:
                print("  → Slack: ✗ (전송 실패)")
        else:
            print("  → Slack: - (미설정)")

        # 콘솔 출력
        print("\n" + text_report)

        print("\n[DONE] Daily Briefing 완료")
        return True

    except Exception as e:
        print(f"\n[ERROR] {e}")

        # 에러 로그
        os.makedirs(CONFIG["log_dir"], exist_ok=True)
        log_path = os.path.join(CONFIG["log_dir"], "daily_briefing.log")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat()}] ERROR: {e}\n")

        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
