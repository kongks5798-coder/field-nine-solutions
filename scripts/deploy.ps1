# Field Nine 차익거래 엔진 배포 스크립트 (PowerShell)

Write-Host "🚀 Field Nine 차익거래 엔진 배포 시작..." -ForegroundColor Green

# 1. 프론트엔드 빌드
Write-Host "📦 프론트엔드 빌드 중..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 프론트엔드 빌드 실패" -ForegroundColor Red
    exit 1
}

# 2. Git 커밋 및 푸시
Write-Host "📝 Git 커밋 및 푸시 중..." -ForegroundColor Yellow
git add .
git commit -m "deploy: 차익거래 엔진 배포" 2>&1 | Out-Null
git push origin main

# 3. Vercel 배포 (CLI가 있는 경우)
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Write-Host "🚀 Vercel 배포 중..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "⚠️  Vercel CLI가 없습니다. GitHub 연동으로 자동 배포됩니다." -ForegroundColor Yellow
}

Write-Host "✅ 배포 완료!" -ForegroundColor Green
