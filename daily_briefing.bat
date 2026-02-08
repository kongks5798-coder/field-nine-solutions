@echo off
chcp 65001 > nul
title Field Nine OS - Daily CEO Briefing

echo ╔══════════════════════════════════════════════════════════════╗
echo ║         FIELD NINE OS - Daily CEO Briefing                  ║
echo ║         Scheduled Task Execution                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d C:\Users\polor\field-nine-solutions

:: Python 실행
python ceo_briefing_v2.py

:: 결과를 로그 파일에 저장
echo. >> logs\daily_briefing.log
echo [%date% %time%] Briefing executed >> logs\daily_briefing.log

:: 완료 메시지
echo.
echo [DONE] Daily Briefing Complete
pause
