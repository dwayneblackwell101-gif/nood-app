@echo off
title NOOD - Build & Push
echo ============================================
echo   NOOD Build Helper
echo ============================================
echo.
echo Choose what to do:
echo   1) Push code to GitHub (deploys backend too)
echo   2) Build dev APK (for testing)
echo   3) Build production APK (for launch)
echo   4) Push code AND build dev APK
echo   5) OTA update (instant app update, no rebuild)
echo   6) Start local dev server (Expo + backend)
echo.
set /p choice=Enter number (1-6):

cd /d "%~dp0"

if "%choice%"=="1" goto push
if "%choice%"=="2" goto devbuild
if "%choice%"=="3" goto prodbuild
if "%choice%"=="4" goto pushbuild
if "%choice%"=="5" goto ota
if "%choice%"=="6" goto devserver
echo Invalid choice.
pause
exit /b

:push
echo.
echo === Pushing app to GitHub ===
git add .
git commit -m "Update: %date% %time%"
git push origin main --force
echo.
echo === Pushing backend to GitHub ===
cd /d "%~dp0..\nood-backend"
git add .
git commit -m "Update: %date% %time%"
git push origin main --force
echo.
echo ✅ Done! Backend auto-deploys on Render.
pause
exit /b

:devbuild
echo.
echo === Building DEV APK (for testing) ===
cd /d "%~dp0"
npx eas build --profile development --platform android
echo.
echo ✅ When finished, install the APK from the link.
pause
exit /b

:prodbuild
echo.
echo === Building PRODUCTION APK ===
cd /d "%~dp0"
npx eas build --profile production --platform android
echo.
pause
exit /b

:pushbuild
echo.
echo === Step 1: Pushing code ===
git add .
git commit -m "Update: %date% %time%"
git push origin main --force
echo.
echo === Step 2: Building dev APK ===
npx eas build --profile development --platform android
pause
exit /b

:ota
echo.
echo === Pushing OTA update (instant, no rebuild) ===
cd /d "%~dp0"
npx eas update --channel production
echo.
echo ✅ Users' apps will update automatically.
pause
exit /b

:devserver
echo.
echo === Starting backend ===
start "NOOD Backend" cmd /k "cd /d %~dp0..\nood-backend && node server.js"
echo.
echo === Starting Expo ===
cd /d "%~dp0"
npx expo start --dev-client
exit /b
