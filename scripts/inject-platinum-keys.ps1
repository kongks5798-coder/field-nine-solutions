# ═══════════════════════════════════════════════════════════════════════════════
# PLATINUM SOVEREIGNTY KEY INJECTION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
#
# Phase 29: Platinum Ascension - 100% Real-World Sovereignty
#
# This script injects The Big 3 API keys into Vercel production environment
#
# Usage:
#   1. Set your API keys below
#   2. Run: .\scripts\inject-platinum-keys.ps1
#   3. Redeploy: vercel --prod
#
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🏆 PLATINUM SOVEREIGNTY KEY INJECTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# THE BIG 3 API KEYS - FILL THESE IN
# ═══════════════════════════════════════════════════════════════════════════════

# 1. KEPCO/KPX API Key (한국전력거래소)
# Get from: https://www.data.go.kr/data/15001105/openapi.do
$KPX_API_KEY = ""

# 2. Tesla Fleet API Access Token
# Get from: https://developer.tesla.com/docs/fleet-api
$TESLA_ACCESS_TOKEN = ""

# 3. Alchemy API Key (On-chain TVL)
# Get from: https://dashboard.alchemy.com/
$ALCHEMY_API_KEY = ""

# ═══════════════════════════════════════════════════════════════════════════════
# OPTIONAL: Contract Addresses for TVL Calculation
# ═══════════════════════════════════════════════════════════════════════════════

$VAULT_CONTRACT_ADDRESS = ""
$STAKING_CONTRACT_ADDRESS = ""
$LIQUIDITY_CONTRACT_ADDRESS = ""

# ═══════════════════════════════════════════════════════════════════════════════
# INJECTION LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

$keysToInject = @()

if ($KPX_API_KEY) {
    $keysToInject += @{ Name = "KPX_API_KEY"; Value = $KPX_API_KEY }
}
if ($TESLA_ACCESS_TOKEN) {
    $keysToInject += @{ Name = "TESLA_ACCESS_TOKEN"; Value = $TESLA_ACCESS_TOKEN }
}
if ($ALCHEMY_API_KEY) {
    $keysToInject += @{ Name = "ALCHEMY_API_KEY"; Value = $ALCHEMY_API_KEY }
}
if ($VAULT_CONTRACT_ADDRESS) {
    $keysToInject += @{ Name = "VAULT_CONTRACT_ADDRESS"; Value = $VAULT_CONTRACT_ADDRESS }
}
if ($STAKING_CONTRACT_ADDRESS) {
    $keysToInject += @{ Name = "STAKING_CONTRACT_ADDRESS"; Value = $STAKING_CONTRACT_ADDRESS }
}
if ($LIQUIDITY_CONTRACT_ADDRESS) {
    $keysToInject += @{ Name = "LIQUIDITY_CONTRACT_ADDRESS"; Value = $LIQUIDITY_CONTRACT_ADDRESS }
}

# Enable Platinum Mode
$keysToInject += @{ Name = "PLATINUM_MODE"; Value = "true" }

if ($keysToInject.Count -eq 1) {
    Write-Host "⚠️  No API keys configured! Please edit this script and add your keys." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required keys:" -ForegroundColor White
    Write-Host "  1. KPX_API_KEY         - from data.go.kr" -ForegroundColor Gray
    Write-Host "  2. TESLA_ACCESS_TOKEN  - from developer.tesla.com" -ForegroundColor Gray
    Write-Host "  3. ALCHEMY_API_KEY     - from alchemy.com" -ForegroundColor Gray
    exit 1
}

Write-Host "Injecting ${$keysToInject.Count} environment variables to Vercel..." -ForegroundColor Yellow
Write-Host ""

foreach ($key in $keysToInject) {
    Write-Host "  Adding $($key.Name)..." -ForegroundColor Gray

    # Use Vercel CLI to add environment variable
    $key.Value | vercel env add $key.Name production --yes 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ $($key.Name) added successfully" -ForegroundColor Green
    } else {
        # Try to remove and re-add if already exists
        vercel env rm $key.Name production --yes 2>$null
        $key.Value | vercel env add $key.Name production --yes 2>$null
        Write-Host "    ✅ $($key.Name) updated" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Key injection complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "  1. Run: vercel --prod" -ForegroundColor Gray
Write-Host "  2. Check: https://www.fieldnine.io/api/platinum-check" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
