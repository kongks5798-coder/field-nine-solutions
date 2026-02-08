# 차익거래 엔진 통합 테스트 스크립트 (PowerShell)

Write-Host "🧪 Field Nine 차익거래 엔진 통합 테스트 시작..." -ForegroundColor Green

# 현재 디렉토리 확인
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath\..

# Python 가상환경 활성화
if (Test-Path "api\venv") {
    & .\api\venv\Scripts\Activate.ps1
} else {
    Write-Host "⚠️ venv가 없습니다. 생성 중..." -ForegroundColor Yellow
    cd api
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    pip install -q pytest pytest-asyncio
    cd ..
}

# 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
pip install -q pytest pytest-asyncio 2>&1 | Out-Null

# 테스트 실행
Write-Host "📋 테스트 실행 중..." -ForegroundColor Yellow
if (Test-Path "tests\integration\test_arbitrage_flow.py") {
    python -m pytest tests/integration/test_arbitrage_flow.py -v
} else {
    Write-Host "⚠️ 테스트 파일을 찾을 수 없습니다." -ForegroundColor Yellow
}

Write-Host "✅ 테스트 완료!" -ForegroundColor Green
