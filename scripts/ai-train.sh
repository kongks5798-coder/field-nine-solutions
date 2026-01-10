#!/bin/bash
# RTX 5090 AI 학습 자동화 스크립트
# 사용법: bash scripts/ai-train.sh

set -e

echo "🚀 RTX 5090 AI 학습 시작..."

# 1. 학습 데이터 Export
echo "📊 학습 데이터 Export 중..."
npm run ai:export

# 2. 최신 Export 파일 찾기
LATEST_EXPORT=$(ls -t ai-training-data/export-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_EXPORT" ]; then
    echo "❌ Export 파일을 찾을 수 없습니다."
    exit 1
fi

echo "✅ 사용할 데이터: $LATEST_EXPORT"

# 3. Python 학습 스크립트 실행
echo "🤖 AI 모델 학습 중..."
python scripts/ai-forecast.py \
    --product-id "demo-product" \
    --timeframe weekly \
    --data-file "$LATEST_EXPORT"

echo "✅ 학습 완료!"
echo "💡 결과 파일: ai-training-data/forecast-*.json"
