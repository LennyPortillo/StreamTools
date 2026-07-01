@echo off
title PENMA Overlay - Tunel Cloudflare
cd /d "%~dp0"

echo.
echo  IMPORTANTE: El servidor debe estar corriendo en otra ventana
echo  (iniciar-servidor.bat).
echo.
echo  Abriendo tunel hacia localhost:3847...
echo  Copia la URL https://....trycloudflare.com que aparezca abajo.
echo  Deja esta ventana abierta durante el directo.
echo.

REM Ejecutar directo — sin if exist (fallaba en algunos Windows)
"C:\cloudflared\cloudflared.exe" tunnel --url http://localhost:3847
if %errorlevel% equ 0 goto :fin
if %errorlevel% equ 130 goto :fin

REM Fallback config.bat
if exist config.bat call config.bat
if defined CLOUDFLARED (
  "%CLOUDFLARED%" tunnel --url http://localhost:3847
  if %errorlevel% equ 0 goto :fin
)

echo.
echo  No arranco. Proba: tunnel-directo.bat
echo  O manual: C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3847
echo.

:fin
pause
