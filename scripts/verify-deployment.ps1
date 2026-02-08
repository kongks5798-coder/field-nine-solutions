# K-Universal Deployment Verification Script
# Verify all systems are operational

Write-Host "🔍 K-Universal Deployment Verification" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Test 1: Local Health Check
Write-Host "Test 1: Local Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Local health endpoint responsive" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Cannot reach local endpoint" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Landing Page
Write-Host ""
Write-Host "Test 2: Landing Page Load" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Landing page loads successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Landing page returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Landing page not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Dashboard
Write-Host ""
Write-Host "Test 3: Dashboard Load" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Dashboard loads successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Dashboard returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Dashboard not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Demo Page
Write-Host ""
Write-Host "Test 4: Demo Page Load" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/demo" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Demo page loads successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Demo page returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Demo page not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 5: Wallet Page
Write-Host ""
Write-Host "Test 5: Wallet Page Load" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/wallet" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Wallet page loads successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Wallet page returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Wallet page not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 6: KYC Page
Write-Host ""
Write-Host "Test 6: KYC Page Load" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/kyc/upload" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - KYC page loads successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - KYC page returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - KYC page not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 7: Sitemap
Write-Host ""
Write-Host "Test 7: Sitemap Availability" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/sitemap.xml" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Sitemap is accessible" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Sitemap returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Sitemap not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 8: Robots.txt
Write-Host ""
Write-Host "Test 8: Robots.txt Availability" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/robots.txt" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Robots.txt is accessible" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Robots.txt returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Robots.txt not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 9: Manifest
Write-Host ""
Write-Host "Test 9: Manifest Availability" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/manifest.json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASSED - Manifest is accessible" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Manifest returned: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ FAILED - Manifest not accessible" -ForegroundColor Red
    $allPassed = $false
}

# Test 10: Docker Containers
Write-Host ""
Write-Host "Test 10: Docker Container Status" -ForegroundColor Yellow
$containers = docker ps --format "table {{.Names}}\t{{.Status}}" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ PASSED - Docker containers are running" -ForegroundColor Green
    Write-Host $containers -ForegroundColor Gray
} else {
    Write-Host "  ❌ FAILED - Docker is not running" -ForegroundColor Red
    $allPassed = $false
}

# Summary
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "🎉 All tests PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your deployment is ready for production!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\scripts\deploy-cloudflare.ps1" -ForegroundColor Cyan
    Write-Host "  2. Access: https://fieldnine.io" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ Some tests FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors above and fix them." -ForegroundColor Yellow
    exit 1
}
