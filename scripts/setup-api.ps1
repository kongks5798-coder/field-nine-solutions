# API 서버 설정 스크립트

Write-Host "🔧 API 서버 설정 중..." -ForegroundColor Green

cd api

# venv 생성
if (-not (Test-Path "venv")) {
    Write-Host "📦 Python 가상환경 생성 중..." -ForegroundColor Yellow
    python -m venv venv
}

# 가상환경 활성화
& .\venv\Scripts\Activate.ps1

# 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "✅ 설정 완료!" -ForegroundColor Green
Write-Host "   다음 명령어로 서버를 시작하세요:" -ForegroundColor Cyan
Write-Host "   python run.py" -ForegroundColor Cyan
