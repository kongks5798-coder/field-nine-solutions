#!/bin/bash

# 차익거래 엔진 통합 테스트 스크립트

echo "🧪 Field Nine 차익거래 엔진 통합 테스트 시작..."

# Python 가상환경 활성화
if [ -d "api/venv" ]; then
    source api/venv/bin/activate
fi

# 의존성 설치
pip install -q pytest pytest-asyncio

# 테스트 실행
echo "📋 테스트 실행 중..."
python -m pytest tests/integration/test_arbitrage_flow.py -v

echo "✅ 테스트 완료!"
