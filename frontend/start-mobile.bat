@echo off
REM Verifier si ADB est disponible
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB n'est pas installe ou pas dans le PATH
    echo Installez Android Platform Tools avec: winget install Google.PlatformTools
    echo Puis REDEMARREZ votre terminal
    pause
    exit /b 1
)

echo Configuration de la connexion USB (ADB Reverse)...
echo Redirection du port 8080 (Expo)...
adb reverse tcp:8080 tcp:8080
echo Redirection du port 5000 (Backend)...
adb reverse tcp:5000 tcp:5000
echo.

echo Demarrage d'Expo (Mode Localhost)...
npx expo start --localhost --port 8080

pause
