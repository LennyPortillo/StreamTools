@echo off
title StreamTools - Arranque
cd /d "%~dp0"

if not exist config.bat (
  echo.
  echo  Primera vez: copia config.ejemplo.bat a config.bat y pone tu ADMIN_SECRET
  echo  copy config.ejemplo.bat config.bat
  echo  notepad config.bat
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

if not exist "C:\cloudflared\cloudflared.exe" (
  echo.
  echo  Falta cloudflared en C:\cloudflared\cloudflared.exe
  echo  Descarga: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  echo.
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   STREAMTOOLS - Arranque automatico
echo  ========================================
echo.
echo  Se van a abrir 2 ventanas:
echo    1) Servidor (no cerrar)
echo    2) Tunel cloudflare (no cerrar)
echo.
echo  Cuando aparezca la URL https://....trycloudflare.com
echo  en la ventana del TUNEL, copiala.
echo.
echo  Despues ejecuta: paso-final.bat
echo  y pega esa URL.
echo.
pause

REM Cerrar servidor viejo si quedo colgado
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3847 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

start "StreamTools SERVIDOR" cmd /k "cd /d %~dp0 && call config.bat && set PUBLIC_URL=http://localhost:3847 && npm start"
timeout /t 3 /nobreak >nul
start "StreamTools TUNEL" cmd /k "C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3847"

echo.
echo  Listo. Mira la ventana TUNEL para la URL publica.
echo  Luego corre: paso-final.bat
echo.
pause
