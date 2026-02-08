# Field Nine - Vercel Environment Variables 자동 추가 스크립트 (간단 버전)
# 
# 이 스크립트는 .env.local 파일을 읽어서 환경 변수 목록을 보여줍니다.
# 실제 추가는 수동으로 해야 합니다 (Vercel CLI의 대화형 입력 때문)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables 목록" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# .env.local 파일 경로
$envFile = ".env.local"

# 파일 존재 확인
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다!" -ForegroundColor Red
    Write-Host "   프로젝트 루트에 .env.local 파일이 있는지 확인하세요.`n" -ForegroundColor Yellow
    exit 1
}

# .env.local 파일 읽기
$envContent = Get-Content $envFile

# 환경 변수 목록
$envVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ENCRYPTION_KEY",
    "NEXT_PUBLIC_PYTHON_SERVER_URL"
)

Write-Host "📋 다음 환경 변수들을 Vercel에 추가해야 합니다:`n" -ForegroundColor Yellow

$index = 1
foreach ($varName in $envVars) {
    $line = $envContent | Where-Object { $_ -match "^$varName\s*=" }
    
    if ($line) {
        $value = ($line -split '=', 2)[1].Trim()
        $value = $value -replace '^["'']|["'']$', ''
        
        if ($value -and $value -ne '') {
            # 값의 일부만 표시 (보안)
            $displayValue = if ($value.Length -gt 50) { 
                $value.Substring(0, 20) + "..." + $value.Substring($value.Length - 10)
            } else { 
                $value 
            }
            
            Write-Host "$index. $varName" -ForegroundColor Green
            Write-Host "   값: $displayValue" -ForegroundColor Gray
            Write-Host "   명령어: vercel env add $varName production preview development" -ForegroundColor Cyan
            Write-Host ""
            $index++
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "위의 명령어들을 하나씩 실행하고, 값을 입력하세요.`n" -ForegroundColor Yellow
