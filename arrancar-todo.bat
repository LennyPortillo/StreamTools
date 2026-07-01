@echo off
title StreamTools - Arranque
cd /d "%~dp0"

if not exist config.bat (
  echo.
  echo  Primera vez: copy config.ejemplo.bat config.bat
  echo  notepad config.bat
  echo.
  pause
  exit /b 1
)

call config.bat

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

REM Buscar cloudflared
set "CF="
if exist "C:\cloudflared\cloudflared.exe" set "CF=C:\cloudflared\cloudflared.exe"
if not defined CF if defined CLOUDFLARED if exist "%CLOUDFLARED%" set "CF=%CLOUDFLARED%"

echo.
echo  ========================================
echo   STREAMTOOLS - Arranque
echo  ========================================
echo.

if not defined CF (
  echo  AVISO: no encontre cloudflared.exe
  echo  Proba en CMD: C:\cloudflared\cloudflared.exe --version
  echo  Si funciona, agrega en config.bat:
  echo    set CLOUDFLARED=C:\cloudflared\cloudflared.exe
  echo.
  echo  Descarga: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  echo  Copia el exe a C:\cloudflared\cloudflared.exe
  echo.
  pause
  exit /b 1
)

echo  Cloudflared: %CF%
echo.
echo  Se abren 2 ventanas. NO las cierres.
echo  Copia la URL https://....trycloudflare.com del TUNEL.
echo  Luego: paso-final.bat
echo.
pause

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3847 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

start "StreamTools SERVIDOR" cmd /k "cd /d %~dp0 && call config.bat && set PUBLIC_URL=http://localhost:3847 && npm start"
timeout /t 3 /nobreak >nul
start "StreamTools TUNEL" cmd /k ""%CF%" tunnel --url http://localhost:3847"

echo.
echo  Listo. Ventana TUNEL = URL publica. Despues: paso-final.bat
echo.
pause
