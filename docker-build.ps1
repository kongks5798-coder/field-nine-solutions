# docker-build.ps1 (Global Standard Version)
$ErrorActionPreference = "Stop"

Write-Host ">>> [1/3] Checking Docker Engine..." -ForegroundColor Cyan
try {
    docker ps > $null 2>&1
    Write-Host ">>> [2/3] Cleaning old containers..." -ForegroundColor Cyan
    docker-compose down
    
    Write-Host ">>> [3/3] Building Field Nine AI System..." -ForegroundColor Green
    docker-compose up --build -d
    
    Write-Host "------------------------------------------"
    Write-Host "DONE! BOSS, SYSTEM IS ONLINE." -ForegroundColor Green
    Write-Host "------------------------------------------"
} catch {
    Write-Host "!!! ERROR: Docker is NOT running." -ForegroundColor Red
    Write-Host "Please START 'Docker Desktop' and wait for the green light." -ForegroundColor Yellow
}