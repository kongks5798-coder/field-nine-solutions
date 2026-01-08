import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# -----------------------------------------------------
# 1. 환경변수 로드 (.env.local 파일 찾기)
# -----------------------------------------------------
# 현재 이 파일(test_connect.py)의 위치를 기준으로 
# 두 단계 위(parent.parent)로 올라가서 .env.local을 찾습니다.
env_path = Path(__file__).resolve().parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# -----------------------------------------------------
# 2. 열쇠 가져오기
# -----------------------------------------------------
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# -----------------------------------------------------
# 3. 연결 시도
# -----------------------------------------------------
if not url or not key:
    print(f"❌ 실패: .env.local 파일을 찾았지만, 안에 키가 없거나 파일 경로가 잘못되었습니다!")
    print(f"참고: 현재 탐색한 경로 -> {env_path}")
else:
    try:
        supabase: Client = create_client(url, key)
        # 테이블 아무거나 찔러보기 (response 확인)
        # 'profiles' 테이블이 없다면 에러가 날 수 있으니 일단 연결 자체만 확인합니다.
        print(f"✅ Supabase 연결 성공! URL: {url[:10]}...") 
        print("🎉 축하합니다 Boss! 롤필 데이터베이스 문이 열렸습니다.")
        
    except Exception as e:
        print(f"❌ 연결 에러 발생: {e}")