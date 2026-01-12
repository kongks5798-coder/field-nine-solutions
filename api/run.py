"""
FastAPI 서버 실행 스크립트
"""
import uvicorn
import os
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
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # 개발 모드
        log_level="info"
    )
