# ═══════════════════════════════════════════════════════════════════════════════
# 👑 PLATINUM SOVEREIGNTY KEY INJECTION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
#
# Phase 31: Final Ascension - 100% Real-World Sovereignty
#
# This script injects The Big 3 API keys into Vercel production environment
#
# Usage:
#   1. Fill in your API keys below (lines 25-33)
#   2. Save this file
#   3. Run: .\scripts\inject-platinum-keys.ps1
#   4. Redeploy: vercel --prod
#
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  👑 PLATINUM SOVEREIGNTY KEY INJECTION" -ForegroundColor Cyan
Write-Host "  Phase 31: Final Ascension - 100% Real-World Sovereignty" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# THE BIG 3 API KEYS - 여기에 발급받은 키를 입력하세요
# ═══════════════════════════════════════════════════════════════════════════════

# 1. KEPCO/KPX API Key (한국전력거래소)
# 발급: https://www.data.go.kr/data/15001105/openapi.do
$KPX_API_KEY = ""

# 2. Tesla Fleet API Access Token
# 발급: https://developer.tesla.com/docs/fleet-api
$TESLA_ACCESS_TOKEN = ""

# 3. Alchemy API Key (On-chain TVL)
# 발급: https://dashboard.alchemy.com/
$ALCHEMY_API_KEY = ""

# ═══════════════════════════════════════════════════════════════════════════════
# OPTIONAL: Smart Contract Addresses (TVL 계산용)
# ═══════════════════════════════════════════════════════════════════════════════

$VAULT_CONTRACT_ADDRESS = ""
$STAKING_CONTRACT_ADDRESS = ""
$LIQUIDITY_CONTRACT_ADDRESS = ""

# ═══════════════════════════════════════════════════════════════════════════════
# INJECTION LOGIC - DO NOT MODIFY BELOW
# ═══════════════════════════════════════════════════════════════════════════════

$keysToInject = @()
$configuredCount = 0

# Check and add keys
if ($KPX_API_KEY -and $KPX_API_KEY.Length -gt 5) {
    $keysToInject += @{ Name = "KPX_API_KEY"; Value = $KPX_API_KEY; Display = "KEPCO/KPX" }
    $configuredCount++
} else {
    Write-Host "  ⚠️  KPX_API_KEY 미설정" -ForegroundColor Yellow
}

if ($TESLA_ACCESS_TOKEN -and $TESLA_ACCESS_TOKEN.Length -gt 5) {
    $keysToInject += @{ Name = "TESLA_ACCESS_TOKEN"; Value = $TESLA_ACCESS_TOKEN; Display = "Tesla Fleet" }
    $configuredCount++
} else {
    Write-Host "  ⚠️  TESLA_ACCESS_TOKEN 미설정" -ForegroundColor Yellow
}

if ($ALCHEMY_API_KEY -and $ALCHEMY_API_KEY.Length -gt 5) {
    $keysToInject += @{ Name = "ALCHEMY_API_KEY"; Value = $ALCHEMY_API_KEY; Display = "Alchemy TVL" }
    $configuredCount++
} else {
    Write-Host "  ⚠️  ALCHEMY_API_KEY 미설정" -ForegroundColor Yellow
}

# Optional contract addresses
if ($VAULT_CONTRACT_ADDRESS -and $VAULT_CONTRACT_ADDRESS.StartsWith("0x")) {
    $keysToInject += @{ Name = "VAULT_CONTRACT_ADDRESS"; Value = $VAULT_CONTRACT_ADDRESS; Display = "Vault Contract" }
}
if ($STAKING_CONTRACT_ADDRESS -and $STAKING_CONTRACT_ADDRESS.StartsWith("0x")) {
    $keysToInject += @{ Name = "STAKING_CONTRACT_ADDRESS"; Value = $STAKING_CONTRACT_ADDRESS; Display = "Staking Contract" }
}
if ($LIQUIDITY_CONTRACT_ADDRESS -and $LIQUIDITY_CONTRACT_ADDRESS.StartsWith("0x")) {
    $keysToInject += @{ Name = "LIQUIDITY_CONTRACT_ADDRESS"; Value = $LIQUIDITY_CONTRACT_ADDRESS; Display = "Liquidity Contract" }
}

Write-Host ""

# Validation
if ($configuredCount -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ❌ API 키가 설정되지 않았습니다!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "  이 스크립트 파일을 열고 아래 키들을 입력하세요:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1. KPX_API_KEY         - https://www.data.go.kr" -ForegroundColor Gray
    Write-Host "  2. TESLA_ACCESS_TOKEN  - https://developer.tesla.com" -ForegroundColor Gray
    Write-Host "  3. ALCHEMY_API_KEY     - https://dashboard.alchemy.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  스크립트 경로:" -ForegroundColor White
    Write-Host "  notepad $PSCommandPath" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ $configuredCount/3 API 키 감지됨" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Always enable Platinum Mode
$keysToInject += @{ Name = "PLATINUM_MODE"; Value = "true"; Display = "Platinum Mode" }

Write-Host "Vercel Production 환경에 $($keysToInject.Count)개 변수 주입 중..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($key in $keysToInject) {
    Write-Host "  📦 $($key.Display) 주입 중..." -ForegroundColor Gray -NoNewline

    # Remove existing key first (silent)
    vercel env rm $key.Name production --yes 2>$null | Out-Null

    # Add new key
    $result = $key.Value | vercel env add $key.Name production --yes 2>&1

    if ($LASTEXITCODE -eq 0 -or $result -match "Success") {
        Write-Host " ✅" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " ❌" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  주입 완료: $successCount 성공 / $failCount 실패" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "  📋 다음 단계:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1. Vercel 재배포:" -ForegroundColor Gray
    Write-Host "     vercel --prod" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Platinum 상태 확인:" -ForegroundColor Gray
    Write-Host "     curl https://www.fieldnine.io/api/platinum-check" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  3. Sovereignty Certificate 확인:" -ForegroundColor Gray
    Write-Host "     curl https://www.fieldnine.io/api/platinum-certificate" -ForegroundColor Cyan
    Write-Host ""

    # Ask if user wants to redeploy now
    $redeploy = Read-Host "지금 바로 재배포하시겠습니까? (Y/N)"
    if ($redeploy -eq "Y" -or $redeploy -eq "y") {
        Write-Host ""
        Write-Host "  🚀 Vercel Production 배포 시작..." -ForegroundColor Cyan
        Write-Host ""
        vercel --prod
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  👑 FIELD NINE EMPIRE - PLATINUM SOVEREIGNTY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
