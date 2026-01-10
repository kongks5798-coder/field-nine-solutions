# Field Nine - Vercel Environment Variables 자동 추가 스크립트
# 
# 사용법: PowerShell에서 실행
# .\scripts\add-vercel-env.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables 자동 추가" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# .env.local 파일 경로
$envFile = ".env.local"

# 파일 존재 확인
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다!" -ForegroundColor Red
    Write-Host "   프로젝트 루트에 .env.local 파일이 있는지 확인하세요.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env.local 파일을 찾았습니다.`n" -ForegroundColor Green

# 환경 변수 목록 (추가할 변수들)
$envVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ENCRYPTION_KEY",
    "NEXT_PUBLIC_PYTHON_SERVER_URL"
)

# .env.local 파일 읽기
$envContent = Get-Content $envFile

# 각 환경 변수 처리
$addedCount = 0
$skippedCount = 0

foreach ($varName in $envVars) {
    # .env.local에서 해당 변수 찾기
    $line = $envContent | Where-Object { $_ -match "^$varName\s*=" }
    
    if ($line) {
        # 값 추출 (주석 제거)
        $value = ($line -split '=', 2)[1].Trim()
        $value = $value -replace '^["'']|["'']$', ''  # 따옴표 제거
        
        if ($value -and $value -ne '') {
            Write-Host "📝 $varName 추가 중..." -ForegroundColor Yellow
            
            # vercel env add 명령어 실행
            # Production, Preview, Development 모두에 추가
            $command = "vercel env add $varName production preview development"
            
            # 값 입력을 위해 echo 사용
            $process = Start-Process -FilePath "powershell" -ArgumentList "-Command", "echo '$value' | $command" -NoNewWindow -Wait -PassThru
            
            # 대화형 입력을 위해 다른 방법 사용
            Write-Host "   ⚠️  수동으로 값을 입력해야 할 수 있습니다." -ForegroundColor Yellow
            Write-Host "   값: $value`n" -ForegroundColor Gray
            
            # 직접 vercel env add 실행 (대화형)
            Write-Host "   명령어 실행: vercel env add $varName production preview development" -ForegroundColor Cyan
            Write-Host "   값 입력 시 위의 값을 복사하여 붙여넣으세요.`n" -ForegroundColor Cyan
            
            $addedCount++
        } else {
            Write-Host "⏭️  $varName 스킵 (값이 비어있음)" -ForegroundColor Gray
            $skippedCount++
        }
    } else {
        Write-Host "⏭️  $varName 스킵 (.env.local에 없음)" -ForegroundColor Gray
        $skippedCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "완료 요약" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 추가할 변수: $addedCount 개" -ForegroundColor Green
Write-Host "⏭️  스킵된 변수: $skippedCount 개`n" -ForegroundColor Gray

Write-Host "⚠️  중요: Vercel CLI는 대화형 입력을 요구할 수 있습니다." -ForegroundColor Yellow
Write-Host "   각 변수마다 위에 표시된 값을 복사하여 붙여넣으세요.`n" -ForegroundColor Yellow
