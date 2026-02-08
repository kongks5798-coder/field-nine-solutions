# Field Nine OS - Daily Briefing Scheduler Setup
# Run this script as Administrator

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FIELD NINE OS - Daily Briefing Scheduler Setup          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$TaskName = "FieldNine_DailyBriefing"
$TaskDescription = "Field Nine OS - Daily CEO Briefing at 8:00 AM"
$ScriptPath = "C:\Users\polor\field-nine-solutions\daily_briefing_full.py"
$PythonPath = (Get-Command python).Source
$WorkDir = "C:\Users\polor\field-nine-solutions"
$LogDir = "$WorkDir\logs"
$ReportDir = "$WorkDir\reports"

# Create directories
Write-Host "[1/4] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
Write-Host "      → $LogDir" -ForegroundColor Green
Write-Host "      → $ReportDir" -ForegroundColor Green

# Check if task exists
Write-Host ""
Write-Host "[2/4] Checking existing task..." -ForegroundColor Yellow
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "      → Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create scheduled task
Write-Host ""
Write-Host "[3/4] Creating scheduled task..." -ForegroundColor Yellow

# Action: Run Python script
$Action = New-ScheduledTaskAction `
    -Execute $PythonPath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $WorkDir

# Trigger: Daily at 8:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"

# Settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -WakeToRun

# Principal (current user)
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

# Register task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $TaskDescription `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal

Write-Host "      → Task '$TaskName' created" -ForegroundColor Green
Write-Host "      → Schedule: Daily at 08:00 AM" -ForegroundColor Green

# Test run
Write-Host ""
Write-Host "[4/4] Running test..." -ForegroundColor Yellow
Write-Host ""

try {
    & $PythonPath $ScriptPath
    Write-Host ""
    Write-Host "[SUCCESS] Daily Briefing Scheduler Setup Complete!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Test run failed: $_" -ForegroundColor Yellow
    Write-Host "         Task is still scheduled. Check logs for errors." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Task Name:    $TaskName"
Write-Host "  Schedule:     Daily at 08:00 AM"
Write-Host "  Script:       $ScriptPath"
Write-Host "  Logs:         $LogDir"
Write-Host "  Reports:      $ReportDir"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  View task:    Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Run now:      Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Disable:      Disable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Delete:       Unregister-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
