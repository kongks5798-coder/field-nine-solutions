"""
FastAPI 서버 실행 스크립트
"""
import sys
import os
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    import uvicorn
    from dotenv import load_dotenv
    
    # 환경변수 로드
    load_dotenv()
    
    if __name__ == "__main__":
        port = int(os.getenv("PORT", 8000))
        host = os.getenv("HOST", "0.0.0.0")
        
        print(f"🚀 Field Nine Arbitrage Engine API 시작 중...")
        print(f"   Host: {host}")
        print(f"   Port: {port}")
        print(f"   URL: http://{host}:{port}")
        
        # 포트가 사용 중이면 다른 포트 사용
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"⚠️ 포트 {port}가 사용 중입니다. 다른 포트를 사용합니다.")
            port = 8001
        
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=False,  # 프로덕션 모드
            log_level="info"
        )
except ImportError as e:
    print(f"❌ 필수 패키지가 설치되지 않았습니다: {e}")
    print("다음 명령어로 설치하세요:")
    print("  cd api")
    print("  python -m venv venv")
    print("  .\\venv\\Scripts\\Activate.ps1")
    print("  pip install -r requirements.txt")
    sys.exit(1)
