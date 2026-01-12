# 차익거래 엔진 통합 테스트 스크립트 (PowerShell)

Write-Host "🧪 Field Nine 차익거래 엔진 통합 테스트 시작..." -ForegroundColor Green

# Python 가상환경 활성화
if (Test-Path "api/venv") {
    & .\api\venv\Scripts\Activate.ps1
}

# 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
pip install -q pytest pytest-asyncio

# 테스트 실행
Write-Host "📋 테스트 실행 중..." -ForegroundColor Yellow
python -m pytest tests/integration/test_arbitrage_flow.py -v

Write-Host "✅ 테스트 완료!" -ForegroundColor Green
