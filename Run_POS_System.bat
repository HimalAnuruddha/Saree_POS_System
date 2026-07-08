@echo off
title Saree POS & Booking System
cd /d "%~dp0"

echo ====================================================================
echo             👗 සාරි POS & වෙන්කිරීම් පද්ධතිය (Saree POS) 👗
echo ====================================================================
echo.
echo පද්ධතිය සක්‍රිය කරමින් පවතී... (Starting POS system...)
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Node.js ස්ථාපනය කර නොමැත. කරුණාකර https://nodejs.org/ වෙතින් බාගත කර ස්ථාපනය කරන්න.
    echo.
    pause
    exit /b
)

:: Launch browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the server directly so the user can see any messages/logs
node server.js

pause
