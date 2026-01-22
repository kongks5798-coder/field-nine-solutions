# ═══════════════════════════════════════════════════════════════════════════════
# CLOUDFLARE DNS AUTO-INJECTION SCRIPT (PowerShell)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Field Nine Solutions - Phase 27: Autonomous Ascension
#
# Usage:
#   1. Set your Cloudflare credentials:
#      $env:CF_API_TOKEN = "your_api_token"
#      $env:CF_ZONE_ID = "your_zone_id"
#
#   2. Run this script:
#      .\scripts\dns-cloudflare-inject.ps1
#
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FIELD NINE - CLOUDFLARE DNS INJECTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check for required environment variables
if (-not $env:CF_API_TOKEN) {
    Write-Host "ERROR: CF_API_TOKEN not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your API Token:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    Write-Host "2. Create Token > Edit zone DNS template"
    Write-Host "3. Select 'fieldnine.io' zone"
    Write-Host '4. Set: $env:CF_API_TOKEN = "your_token"'
    exit 1
}

if (-not $env:CF_ZONE_ID) {
    Write-Host "ERROR: CF_ZONE_ID not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your Zone ID:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dash.cloudflare.com"
    Write-Host "2. Select fieldnine.io domain"
    Write-Host "3. Scroll down, Zone ID is on the right sidebar"
    Write-Host '4. Set: $env:CF_ZONE_ID = "your_zone_id"'
    exit 1
}

$CF_API = "https://api.cloudflare.com/client/v4"
$headers = @{
    "Authorization" = "Bearer $env:CF_API_TOKEN"
    "Content-Type" = "application/json"
}

# DNS Records to create
$dnsRecords = @(
    @{ Name = "m"; Content = "cname.vercel-dns.com" }
    @{ Name = "nexus"; Content = "cname.vercel-dns.com" }
)

Write-Host "Creating DNS records for Vercel..." -ForegroundColor Cyan
Write-Host ""

foreach ($record in $dnsRecords) {
    Write-Host "Creating CNAME: $($record.Name).fieldnine.io -> $($record.Content)" -ForegroundColor Yellow

    $body = @{
        type = "CNAME"
        name = $record.Name
        content = $record.Content
        ttl = 1
        proxied = $true
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$CF_API/zones/$env:CF_ZONE_ID/dns_records" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop

        if ($response.success) {
            Write-Host "  SUCCESS: $($record.Name).fieldnine.io created" -ForegroundColor Green
        }
    }
    catch {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue

        if ($errorResponse.errors[0].message -like "*already exists*") {
            Write-Host "  SKIPPED: $($record.Name).fieldnine.io already exists" -ForegroundColor Yellow
        }
        else {
            Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DNS injection complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Records should propagate within 1-5 minutes."
Write-Host "Verify with: nslookup m.fieldnine.io 1.1.1.1"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
