import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. 환경변수 로드 (자동으로 상위 폴더의 .env.local을 찾습니다)
env_path = Path(__file__).resolve().parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# 2. Supabase 클라이언트 생성 함수
def get_db_client():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("❌ .env.local 파일에서 Supabase 키를 찾을 수 없습니다.")
        
    return create_client(url, key)

# 테스트용 코드 (이 파일만 실행했을 때 작동)
if __name__ == "__main__":
    try:
        db = get_db_client()
        print("✅ DB 연결 모듈(db.py) 정상 작동 중!")
    except Exception as e:
        print(f"Error: {e}")