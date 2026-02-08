#!/bin/bash

# Field Nine 차익거래 엔진 배포 스크립트

echo "🚀 Field Nine 차익거래 엔진 배포 시작..."

# 1. 프론트엔드 빌드
echo "📦 프론트엔드 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 프론트엔드 빌드 실패"
    exit 1
fi

# 2. Git 커밋 및 푸시
echo "📝 Git 커밋 및 푸시 중..."
git add .
git commit -m "deploy: 차익거래 엔진 배포" || true
git push origin main

# 3. Vercel 배포 (CLI가 있는 경우)
if command -v vercel &> /dev/null; then
    echo "🚀 Vercel 배포 중..."
    vercel --prod
else
    echo "⚠️  Vercel CLI가 없습니다. GitHub 연동으로 자동 배포됩니다."
fi

echo "✅ 배포 완료!"
