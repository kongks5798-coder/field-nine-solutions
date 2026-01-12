#!/bin/bash

# Field Nine 차익거래 엔진 API 시작 스크립트

echo "🚀 Field Nine Arbitrage Engine API 시작 중..."

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# API 디렉토리로 이동
cd api

# 의존성 설치
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 환경변수 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. 기본 설정을 사용합니다."
fi

# 서버 시작
echo "✅ 서버 시작 중..."
python run.py
