@echo off
title PENMA Overlay - Servidor con URL publica
cd /d "%~dp0"

if not exist config.bat (
  echo Copia config.ejemplo.bat a config.bat primero.
  pause
  exit /b 1
)

call config.bat

set /p PUBLIC_URL="Pega la URL del tunel (https://....trycloudflare.com): "
if "%PUBLIC_URL%"=="" (
  echo URL vacia, cancelado.
  pause
  exit /b 1
)

echo.
echo  PUBLIC_URL=%PUBLIC_URL%
echo  ADMIN_SECRET=%ADMIN_SECRET%
echo.

set PUBLIC_URL=%PUBLIC_URL%
set ADMIN_SECRET=%ADMIN_SECRET%
call npm start
