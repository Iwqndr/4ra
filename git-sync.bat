@echo off
setlocal enabledelayedexpansion
title 4Aura Git Sync

:: Set colors (Green for success, Red for error, Yellow for info)
SET "ESC= "
SET "GREEN=%ESC%[92m"
SET "RED=%ESC%[91m"
SET "YELLOW=%ESC%[93m"
SET "RESET=%ESC%[0m"

echo %YELLOW%[4Aura]%RESET% Checking for changes...

:: Check if there are actually changes to stage
git status --porcelain | findstr /R "^" >nul
if %errorlevel% neq 0 (
    echo %GREEN%[4Aura]%RESET% No changes detected. Everything is up to date.
    goto :end
)

:: Stage all changes
git add .

:: Prompt for message with a better default handling
set "msg="
set /p msg="%YELLOW%[4Aura]%RESET% Enter commit message (Default: Update): "
if "!msg!"=="" set "msg=Update"

:: Commit changes
echo %YELLOW%[4Aura]%RESET% Committing: "!msg!"...
git commit -m "!msg!"
if %errorlevel% neq 0 (
    echo %RED%[Error]%RESET% Commit failed.
    goto :error
)

:: Push to remote
echo %YELLOW%[4Aura]%RESET% Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo %RED%[Error]%RESET% Push failed. Check your connection or remote permissions.
    goto :error
)

echo %GREEN%[4Aura] Project updated successfully!%RESET%
goto :end

:error
echo %RED%[4Aura] Sync failed. Please check the errors above.%RESET%
pause
exit /b 1

:end
pause