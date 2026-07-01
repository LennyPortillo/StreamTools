@echo off
title PENMA Overlay - Servidor con URL publica
cd /d "%~dp0"

if not exist config.bat (
  echo Copia config.ejemplo.bat a config.bat primero.
  pause
  exit /b 1
)

call config.bat

echo.
echo  Esto reinicia el servidor con la URL publica del tunel.
echo  Si ya tenes el servidor corriendo, lo vamos a cerrar primero.
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3847 ^| findstr LISTENING') do (
  echo  Cerrando proceso anterior PID %%a...
  taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

set /p PUBLIC_URL="Pega la URL del tunel (https://....trycloudflare.com): "
if "%PUBLIC_URL%"=="" (
  echo URL vacia, cancelado.
  pause
  exit /b 1
)

echo.
echo  PUBLIC_URL=%PUBLIC_URL%
echo  ADMIN_SECRET=%ADMIN_SECRET%
echo  Ctrl+C para detener
echo.

set PUBLIC_URL=%PUBLIC_URL%
set ADMIN_SECRET=%ADMIN_SECRET%
call npm start
