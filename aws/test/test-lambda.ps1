# Lambda 함수 테스트 스크립트 (PowerShell)
# 사용법: .\test-lambda.ps1 [recommend|schedule|predict]

param(
    [Parameter(Position=0)]
    [ValidateSet("recommend", "schedule", "predict", "all")]
    [string]$Function = "all"
)

$API_BASE_URL = if ($env:API_GATEWAY_URL) { $env:API_GATEWAY_URL } else { "https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod" }

function Test-Recommend {
    Write-Host "🧪 Testing recommendShopping Lambda..." -ForegroundColor Cyan
    $body = @{
        query = "오늘 저녁 뭐 입을까? 예산 5만원"
        userId = "test-user-123"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/recommend" -Method Post -Body $body -ContentType "application/json"
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

function Test-Schedule {
    Write-Host "🧪 Testing dailySchedule Lambda..." -ForegroundColor Cyan
    $body = @{
        userId = "test-user-123"
        action = "get"
        date = Get-Date -Format "yyyy-MM-dd"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/schedule" -Method Post -Body $body -ContentType "application/json"
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

function Test-Predict {
    Write-Host "🧪 Testing predictSavings Lambda..." -ForegroundColor Cyan
    $body = @{
        userId = "test-user-123"
        days = 7
        model = "xgboost"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/predict-savings" -Method Post -Body $body -ContentType "application/json"
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

switch ($Function) {
    "recommend" {
        Test-Recommend
    }
    "schedule" {
        Test-Schedule
    }
    "predict" {
        Test-Predict
    }
    "all" {
        Write-Host "🧪 Testing all Lambda functions..." -ForegroundColor Green
        Write-Host ""
        Write-Host "1. recommendShopping:" -ForegroundColor Yellow
        Test-Recommend
        Write-Host ""
        Write-Host "2. dailySchedule:" -ForegroundColor Yellow
        Test-Schedule
        Write-Host ""
        Write-Host "3. predictSavings:" -ForegroundColor Yellow
        Test-Predict
    }
}
