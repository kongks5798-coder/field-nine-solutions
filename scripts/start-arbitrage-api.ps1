# Field Nine 차익거래 엔진 API 시작 스크립트 (PowerShell)

Write-Host "🚀 Field Nine Arbitrage Engine API 시작 중..." -ForegroundColor Green

# API 디렉토리로 이동
Set-Location api

# 가상환경 확인 및 생성
if (-not (Test-Path "venv")) {
    Write-Host "📦 Python 가상환경 생성 중..." -ForegroundColor Yellow
    python -m venv venv
}

# 가상환경 활성화
& .\venv\Scripts\Activate.ps1

# 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
pip install -r requirements.txt

# 환경변수 확인
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env 파일이 없습니다. 기본 설정을 사용합니다." -ForegroundColor Yellow
}

# 서버 시작
Write-Host "✅ 서버 시작 중..." -ForegroundColor Green
python run.py
