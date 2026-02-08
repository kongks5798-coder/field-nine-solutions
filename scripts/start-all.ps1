# Field Nine 차익거래 엔진 전체 시작 스크립트

Write-Host "🚀 Field Nine 차익거래 엔진 전체 시작..." -ForegroundColor Green

# 1. 기존 프로세스 종료
Write-Host "🛑 기존 프로세스 종료 중..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*next*" -or $_.ProcessName -like "*python*" -and $_.MainWindowTitle -like "*uvicorn*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. .next 폴더 삭제
Write-Host "🧹 빌드 캐시 정리 중..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 3. API 서버 시작 (백그라운드)
Write-Host "📡 API 서버 시작 중..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd api
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
        python run.py
    } else {
        Write-Host "⚠️ venv가 없습니다. 먼저 설정하세요."
    }
}

# 4. 프론트엔드 시작
Write-Host "🌐 프론트엔드 시작 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 3  # API 서버 시작 대기

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "✅ 시작 완료!" -ForegroundColor Green
Write-Host "   API 서버: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   프론트엔드: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   차익거래 페이지: http://localhost:3000/arbitrage" -ForegroundColor Cyan
