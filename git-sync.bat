@echo off
setlocal enabledelayedexpansion

:: Force Windows to support ANSI colors
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

:: Get the ESC character for colors
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set ESC=%%b

:: Define Color Variables
set "G=%ESC%[92m"
set "R=%ESC%[91m"
set "Y=%ESC%[93m"
set "B=%ESC%[94m"
set "RESET=%ESC%[0m"

title 4Aura Git Sync
cls

echo %B%[4Aura]%RESET% Starting Sync...

:: 1. Pull latest changes
echo %Y%[4Aura]%RESET% Fetching latest updates from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo %R%[Error]%RESET% Pull failed. You might have conflicts to fix manually.
    goto :error
)

:: 2. Check for local changes
echo %Y%[4Aura]%RESET% Checking for local changes...
git status --porcelain | findstr /R "^" >nul
if %errorlevel% neq 0 (
    echo %G%[4Aura]%RESET% No changes detected. Local is already synced with GitHub.
    goto :end
)

:: 3. Stage and Commit
git add .
set "msg="
set /p msg="%B%[4Aura]%RESET% Enter commit message (Default: Update): "
if "!msg!"=="" set "msg=Update"

echo %Y%[4Aura]%RESET% Committing: "!msg!"...
git commit -m "!msg!"

:: 4. Push to GitHub
echo %Y%[4Aura]%RESET% Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo %R%[Error]%RESET% Push failed. Check your internet or GitHub permissions.
    goto :error
)

echo.
echo %G%========================================%RESET%
echo %G%   [4Aura] Sync Complete! (Updated)   %RESET%
echo %G%========================================%RESET%
goto :end

:error
echo.
echo %R%!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!%RESET%
echo %R%   [4Aura] Sync FAILED. Check errors. %RESET%
echo %R%!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!%RESET%
pause
exit /b 1

:end
echo.
pause