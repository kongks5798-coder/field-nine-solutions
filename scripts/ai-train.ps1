# RTX 5090 AI 학습 자동화 스크립트 (PowerShell)
# 사용법: .\scripts\ai-train.ps1

Write-Host "🚀 RTX 5090 AI 학습 시작..." -ForegroundColor Green

# 1. 학습 데이터 Export
Write-Host "📊 학습 데이터 Export 중..." -ForegroundColor Yellow
npm run ai:export

# 2. 최신 Export 파일 찾기
$exportFiles = Get-ChildItem -Path "ai-training-data" -Filter "export-*.json" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending

if ($exportFiles.Count -eq 0) {
    Write-Host "❌ Export 파일을 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

$latestExport = $exportFiles[0].FullName
Write-Host "✅ 사용할 데이터: $latestExport" -ForegroundColor Green

# 3. Python 학습 스크립트 실행
Write-Host "🤖 AI 모델 학습 중..." -ForegroundColor Yellow
python scripts/ai-forecast.py `
    --product-id "demo-product" `
    --timeframe weekly `
    --data-file $latestExport

Write-Host "✅ 학습 완료!" -ForegroundColor Green
Write-Host "💡 결과 파일: ai-training-data/forecast-*.json" -ForegroundColor Cyan
