@echo off
title Umamusume Auto Translator Server
echo ===================================================
echo   Menjalankan Auto Translator Server (Port 5000)...
echo ===================================================
echo.
cd /d "%~dp0"
python auto_translator_server.py
pause
