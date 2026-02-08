# Field Nine 개발 환경 정리 스크립트
# 사용법: .\scripts\cleanup-dev.ps1

Write-Host "🧹 Field Nine 개발 환경 정리 중..." -ForegroundColor Cyan

# 1. 실행 중인 Node 프로세스 종료
Write-Host "`n1. 실행 중인 Node 프로세스 종료 중..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "   종료 중: PID $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Node 프로세스 종료 완료" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  실행 중인 Node 프로세스 없음" -ForegroundColor Gray
}

# 2. dev.lock 파일 삭제
Write-Host "`n2. dev.lock 파일 삭제 중..." -ForegroundColor Yellow
$lockFile = ".next\dev.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ dev.lock 파일 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  dev.lock 파일 없음" -ForegroundColor Gray
}

# 3. .next 폴더 정리 (선택사항)
Write-Host "`n3. .next 폴더 정리 중..." -ForegroundColor Yellow
$nextFolder = ".next"
if (Test-Path $nextFolder) {
    $response = Read-Host "   .next 폴더를 삭제하시겠습니까? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item $nextFolder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ .next 폴더 삭제 완료" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  .next 폴더 유지" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  .next 폴더 없음" -ForegroundColor Gray
}

# 4. node_modules 캐시 정리 (선택사항)
Write-Host "`n4. npm 캐시 정리 중..." -ForegroundColor Yellow
$response = Read-Host "   npm 캐시를 정리하시겠습니까? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    npm cache clean --force
    Write-Host "   ✅ npm 캐시 정리 완료" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  npm 캐시 유지" -ForegroundColor Gray
}

Write-Host "`n✅ 개발 환경 정리 완료!" -ForegroundColor Green
Write-Host "`n이제 'npm run dev'를 실행할 수 있습니다." -ForegroundColor Cyan
