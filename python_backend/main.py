"""
TrendStream Python Backend - FastAPI 서버
로컬 GPU (5090)에서 실행되는 AI 분석 엔진

비즈니스 목적:
- 인스타그램/틱톡 이미지 크롤링 및 비전 분석
- 트렌드 예측 알고리즘 실행
- 분석 결과를 프론트엔드에 제공
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from routers import analyze
from services.crawler import SocialMediaCrawler
from services.vision_ai import VisionAnalyzer

app = FastAPI(
    title="TrendStream API",
    description="패션 트렌드 분석 AI 엔진",
    version="1.0.0"
)

# CORS 설정 - Next.js 프론트엔드와 통신
# Docker 환경에서는 Cloudflare Tunnel을 통해 접속하므로 localhost 사용 금지
import os
allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://fieldnine.io").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # 환경 변수에서 가져오기
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analyze.router, prefix="/api", tags=["analysis"])

@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {
        "status": "ok",
        "service": "TrendStream AI Engine",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "gpu_available": True,  # 실제로는 GPU 체크 로직
        "services": {
            "crawler": "ready",
            "vision_ai": "ready"
        }
    }

if __name__ == "__main__":
    # 로컬 개발: 포트 8000에서 실행
    # 프로덕션: Docker 또는 systemd로 실행
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # 개발 모드
    )
