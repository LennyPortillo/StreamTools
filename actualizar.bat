@echo off
title PENMA Overlay - Actualizar
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Git no esta instalado. Instalalo desde https://git-scm.com/download/win
  pause
  exit /b 1
)

echo Descargando ultima version del repo...
git pull

echo.
echo Instalando dependencias...
call npm install

echo.
echo Listo. Ya podes iniciar el overlay.
pause
