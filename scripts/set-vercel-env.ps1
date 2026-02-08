# Vercel 환경 변수 한 번에 설정 스크립트
# 사용법: .\scripts\set-vercel-env.ps1

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host " Vercel 환경 변수 설정 " -NoNewline -ForegroundColor White -BackgroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "`n" -NoNewline

# .env.local 파일 확인
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다!" -ForegroundColor Red
    Write-Host "`n프로젝트 루트에 .env.local 파일을 생성하고 다음 변수를 추가하세요:" -ForegroundColor Yellow
    Write-Host "`nNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor White
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" -ForegroundColor White
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor White
    Write-Host "ENCRYPTION_KEY=your-32-character-encryption-key" -ForegroundColor White
    Write-Host "`n" -NoNewline
    exit 1
}

Write-Host "✅ .env.local 파일을 찾았습니다." -ForegroundColor Green
Write-Host "`n환경 변수를 Vercel에 추가합니다...`n" -ForegroundColor Yellow

# .env.local 파일 읽기
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# 필수 환경 변수 목록
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ENCRYPTION_KEY"
)

# 선택적 환경 변수
$optionalVars = @(
    "NEXT_PUBLIC_PYTHON_SERVER_URL"
)

# 필수 변수 확인
$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ 다음 필수 환경 변수가 .env.local 파일에 없습니다:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host "`n.env.local 파일을 확인하고 다시 시도하세요.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 모든 필수 환경 변수를 찾았습니다.`n" -ForegroundColor Green

# Vercel 로그인 확인
Write-Host "Vercel 로그인 상태 확인 중..." -ForegroundColor Cyan
$vercelCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel에 로그인되어 있지 않습니다." -ForegroundColor Red
    Write-Host "`n다음 명령어로 로그인하세요:" -ForegroundColor Yellow
    Write-Host "   vercel login`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Vercel에 로그인되어 있습니다.`n" -ForegroundColor Green

# 환경 변수 추가
$allVars = $requiredVars + $optionalVars
$successCount = 0
$failCount = 0

foreach ($varName in $allVars) {
    if (-not $envVars.ContainsKey($varName) -or [string]::IsNullOrWhiteSpace($envVars[$varName])) {
        if ($requiredVars -contains $varName) {
            Write-Host "⚠️  $varName (필수) - .env.local에 없음, 건너뜀" -ForegroundColor Yellow
            $failCount++
        } else {
            Write-Host "⏭️  $varName (선택) - .env.local에 없음, 건너뜀" -ForegroundColor Gray
        }
        continue
    }

    $varValue = $envVars[$varName]
    Write-Host "📝 $varName 설정 중..." -ForegroundColor Cyan

    # Vercel CLI로 환경 변수 추가
    # 참고: vercel env add는 대화형으로 값을 입력받으므로, 여기서는 안내만 제공
    Write-Host "   다음 명령어를 실행하세요:" -ForegroundColor Yellow
    Write-Host "   vercel env add $varName production preview development" -ForegroundColor White
    Write-Host "   값: $($varValue.Substring(0, [Math]::Min(20, $varValue.Length)))..." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "`n" -NoNewline

Write-Host "💡 더 빠른 방법: Vercel 대시보드 사용" -ForegroundColor Green
Write-Host "`n1. https://vercel.com/dashboard 접속" -ForegroundColor White
Write-Host "2. field-nine-solutions 프로젝트 클릭" -ForegroundColor White
Write-Host "3. Settings > Environment Variables 이동" -ForegroundColor White
Write-Host "4. 위에서 확인한 변수들을 하나씩 추가" -ForegroundColor White
Write-Host "`n자세한 가이드: VERCEL_ENV_SETUP_FINAL.md 파일 참고`n" -ForegroundColor Yellow

Write-Host "✅ 스크립트 완료!`n" -ForegroundColor Green
