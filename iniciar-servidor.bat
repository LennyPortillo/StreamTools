@echo off
title PENMA Overlay - Servidor
cd /d "%~dp0"

if not exist config.bat (
  echo.
  echo  Falta config.bat
  echo  Copia config.ejemplo.bat a config.bat y pon tu ADMIN_SECRET
  echo.
  pause
  exit /b 1
)

call config.bat

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

echo.
echo  Servidor en http://localhost:3847
echo  Admin: http://localhost:3847/admin.html
echo.
echo  Despues de abrir el tunel, reinicia con PUBLIC_URL si hace falta.
echo  Ctrl+C para detener
echo.

if defined PUBLIC_URL (
  set PUBLIC_URL=%PUBLIC_URL%
) else (
  set PUBLIC_URL=http://localhost:3847
)

set ADMIN_SECRET=%ADMIN_SECRET%
call npm start
