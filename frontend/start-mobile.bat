@echo off
taskkill /f /im node.exe >nul 2>nul

adb reverse tcp:8080 tcp:8080
adb reverse tcp:5000 tcp:5000

echo [INFO] Demarrage Expo en mode USB/Localhost...

npx expo start --localhost --port 8080

pause
