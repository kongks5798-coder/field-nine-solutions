# Field Nine - Vercel Environment Variables Auto Add Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Field Nine Auto Deploy Protocol - Step 2" -ForegroundColor Cyan
Write-Host "Environment Variables Auto Injection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Found .env.local file" -ForegroundColor Green
Write-Host ""

$envVars = @{}
$lines = Get-Content $envFile

foreach ($line in $lines) {
    $line = $line.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) {
        continue
    }
    
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $value = $value -replace '^["'']|["'']$', ''
        
        if ($key -and $value) {
            $envVars[$key] = $value
        }
    }
}

Write-Host "Found environment variables: $($envVars.Count)" -ForegroundColor Yellow
Write-Host ""

$addedCount = 0
$skippedCount = 0

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    Write-Host "[$($addedCount + 1)/$($envVars.Count)] Adding $key..." -ForegroundColor Yellow
    
    try {
        # Use echo to pipe value to vercel env add
        $process = Start-Process -FilePath "vercel" -ArgumentList "env", "add", $key, "production", "preview", "development" -NoNewWindow -Wait -PassThru -RedirectStandardInput "NUL"
        
        # Alternative: Use PowerShell to pipe value
        $value | & vercel env add $key production preview development
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   SUCCESS" -ForegroundColor Green
            $addedCount++
        } else {
            Write-Host "   SKIPPED (may already exist)" -ForegroundColor Yellow
            $skippedCount++
        }
    } catch {
        Write-Host "   ERROR: $_" -ForegroundColor Red
        $skippedCount++
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Added: $addedCount" -ForegroundColor Green
Write-Host "Skipped: $skippedCount" -ForegroundColor Gray
Write-Host ""
