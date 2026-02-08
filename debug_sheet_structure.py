# Debug: 시트 구조 확인
import os
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

# 환경변수 로드
env_path = r"C:\Users\polor\field-nine-dashboard\.env.local"
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

from google.oauth2 import service_account
from googleapiclient.discovery import build

email = os.environ.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")
key = os.environ.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "").replace("\\n", "\n")
spreadsheet_id = "1EIhlnIvT2gutlyVMhDcARxU8DAC4M9rR5BHbphzLvB4"

credentials = service_account.Credentials.from_service_account_info(
    {
        "type": "service_account",
        "client_email": email,
        "private_key": key,
        "token_uri": "https://oauth2.googleapis.com/token"
    },
    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
)

service = build('sheets', 'v4', credentials=credentials)

# 여러 시트 확인
sheets_to_check = ["2026", "주문현황", "목표설정", "데이터_대시보드"]

for sheet_name in sheets_to_check:
    print(f"\n{'='*70}")
    print(f"[SHEET] {sheet_name}")
    print("="*70)

    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f"'{sheet_name}'!A1:Z10"  # 첫 10행만
        ).execute()

        values = result.get('values', [])

        for i, row in enumerate(values[:10]):
            print(f"Row {i}: {row[:15]}")  # 첫 15개 컬럼

    except Exception as e:
        print(f"[ERROR] {e}")

print("\n[DONE]")
