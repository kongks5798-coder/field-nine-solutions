# K-Universal Cloudflare Tunnel Deployment Script
# PowerShell automation for production deployment

Write-Host "🚀 K-Universal Cloudflare Tunnel Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if cloudflared is installed
Write-Host "📋 Step 1: Checking cloudflared installation..." -ForegroundColor Yellow
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflaredPath) {
    Write-Host "❌ cloudflared not found! Installing..." -ForegroundColor Red
    Write-Host "Please run: winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ cloudflared is installed" -ForegroundColor Green
}

# Step 2: Check if tunnel exists
Write-Host ""
Write-Host "📋 Step 2: Checking for existing tunnel..." -ForegroundColor Yellow
$tunnelName = "k-universal"
$tunnelList = cloudflared tunnel list 2>&1 | Out-String

if ($tunnelList -match $tunnelName) {
    Write-Host "✅ Tunnel '$tunnelName' already exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tunnel not found. Creating..." -ForegroundColor Yellow
    cloudflared tunnel create $tunnelName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create tunnel. Please login first:" -ForegroundColor Red
        Write-Host "   cloudflared tunnel login" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Tunnel '$tunnelName' created successfully" -ForegroundColor Green
}

# Step 3: Get Tunnel ID
Write-Host ""
Write-Host "📋 Step 3: Getting Tunnel ID..." -ForegroundColor Yellow
$tunnelInfo = cloudflared tunnel list --name $tunnelName --output json 2>&1 | ConvertFrom-Json
$tunnelId = $tunnelInfo[0].id

if (-not $tunnelId) {
    Write-Host "❌ Could not retrieve Tunnel ID" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tunnel ID: $tunnelId" -ForegroundColor Green

# Step 4: Create config.yml if not exists
Write-Host ""
Write-Host "📋 Step 4: Creating tunnel configuration..." -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
$credentialsPath = "$env:USERPROFILE\.cloudflared\$tunnelId.json"

if (-not (Test-Path $configPath)) {
    $configContent = @"
tunnel: $tunnelName
credentials-file: $credentialsPath

ingress:
  - hostname: fieldnine.io
    service: http://localhost:3000
  - hostname: www.fieldnine.io
    service: http://localhost:3000
  - hostname: api.fieldnine.io
    service: http://localhost:3000
  - service: http_status:404
"@
    
    New-Item -Path $configPath -ItemType File -Value $configContent -Force | Out-Null
    Write-Host "✅ Configuration created at: $configPath" -ForegroundColor Green
} else {
    Write-Host "✅ Configuration already exists" -ForegroundColor Green
}

# Step 5: Setup DNS routes
Write-Host ""
Write-Host "📋 Step 5: Setting up DNS routes..." -ForegroundColor Yellow

$domains = @("fieldnine.io", "www.fieldnine.io", "api.fieldnine.io")
foreach ($domain in $domains) {
    Write-Host "  Setting up $domain..." -ForegroundColor Cyan
    cloudflared tunnel route dns $tunnelName $domain 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $domain configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $domain might already be configured or needs manual setup" -ForegroundColor Yellow
    }
}

# Step 6: Check if Docker is running
Write-Host ""
Write-Host "📋 Step 6: Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Docker is running" -ForegroundColor Green
}

# Step 7: Build production Docker image
Write-Host ""
Write-Host "📋 Step 7: Building production Docker image..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Step 8: Start Docker containers
Write-Host ""
Write-Host "📋 Step 8: Starting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Containers started successfully" -ForegroundColor Green

# Step 9: Wait for app to be ready
Write-Host ""
Write-Host "📋 Step 9: Waiting for app to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction SilentlyContinue

if ($healthCheck.StatusCode -eq 200) {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Health check failed, but continuing..." -ForegroundColor Yellow
}

# Step 10: Start Cloudflare Tunnel
Write-Host ""
Write-Host "📋 Step 10: Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "⚠️  The tunnel will run in the foreground." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌍 Your app will be available at:" -ForegroundColor Cyan
Write-Host "   https://fieldnine.io" -ForegroundColor Green
Write-Host "   https://www.fieldnine.io" -ForegroundColor Green
Write-Host "   https://api.fieldnine.io" -ForegroundColor Green
Write-Host ""
Write-Host "Starting tunnel in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

cloudflared tunnel run $tunnelName
