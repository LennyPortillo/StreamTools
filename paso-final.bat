@echo off
title StreamTools - Paso final
cd /d "%~dp0"

if not exist config.bat (
  echo Falta config.bat
  pause
  exit /b 1
)

echo.
echo  Pega la URL del tunel (https://....trycloudflare.com)
echo  La ves en la ventana "StreamTools TUNEL"
echo.
set /p PUBLIC_URL="URL: "

if "%PUBLIC_URL%"=="" (
  echo Cancelado.
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3847 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

start "StreamTools SERVIDOR PUBLICO" cmd /k "cd /d %~dp0 && call config.bat && set PUBLIC_URL=%PUBLIC_URL% && npm start"

echo %PUBLIC_URL%> public-url.local

echo.
echo  ========================================
echo   LISTO PARA USAR
echo  ========================================
echo.
echo  Admin (vos):     http://localhost:3847/admin.html
echo  OBS overlay:     http://localhost:3847/overlay.html
echo  Links viewers:   %PUBLIC_URL%/editor.html?token=...
echo.
echo  1. Abri admin, entra con tu clave, Generar link
echo  2. Manda el link que empieza con trycloudflare.com
echo  3. NO mandes links con localhost
echo.
echo  NO cierres las ventanas SERVIDOR y TUNEL.
echo.
pause
