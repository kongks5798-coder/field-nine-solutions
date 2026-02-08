# Field Nine - Add all .env.local variables to Vercel

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Reading .env.local file..." -ForegroundColor Cyan
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

Write-Host "Found $($envVars.Count) environment variables" -ForegroundColor Yellow
Write-Host ""

$count = 0
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $count++
    
    Write-Host "[$count/$($envVars.Count)] Processing: $key" -ForegroundColor Cyan
    
    # Add to each environment separately
    $environments = @("production", "preview", "development")
    
    foreach ($env in $environments) {
        Write-Host "  -> Adding to $env..." -ForegroundColor Gray
        
        # Use echo to pipe value, but vercel env add requires interactive input
        # So we'll use a different approach: create a temp file and pipe it
        $tempFile = [System.IO.Path]::GetTempFileName()
        $value | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        
        try {
            Get-Content $tempFile | vercel env add $key $env 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    OK" -ForegroundColor Green
            } else {
                Write-Host "    SKIPPED (may exist)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "    ERROR" -ForegroundColor Red
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
