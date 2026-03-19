@echo off
echo [4Aura Git Sync] Detected changes...
git add .
set /p msg="Enter commit message (default: Update): "
if "%msg%"=="" set msg="Updated"
git commit -m "%msg%"
echo [4Aura Git Sync] Pushing to GitHub...
git push
echo [4Aura Git Sync] Project updated successfully!
pause
