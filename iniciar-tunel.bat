@echo off
title PENMA Overlay - Tunel Cloudflare
cd /d "%~dp0"

if exist config.bat call config.bat

if not defined CLOUDFLARED set CLOUDFLARED=cloudflared

where "%CLOUDFLARED%" >nul 2>&1
if errorlevel 1 (
  if not exist "%CLOUDFLARED%" (
    echo.
    echo  ERROR: cloudflared no encontrado.
    echo.
    echo  1. Descarga Windows 64-bit desde:
    echo     https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo  2. Extrae cloudflared.exe a C:\cloudflared\
    echo  3. En config.bat pon: set CLOUDFLARED=C:\cloudflared\cloudflared.exe
    echo.
    pause
    exit /b 1
  )
)

echo.
echo  IMPORTANTE: El servidor debe estar corriendo en otra ventana
echo  (iniciar-servidor.bat). Este script NO inicia el servidor.
echo.
echo  Abriendo tunel hacia localhost:3847...
echo  Copia la URL https://....trycloudflare.com que aparezca abajo.
echo.
echo  Deja esta ventana abierta durante el directo.
echo.

"%CLOUDFLARED%" tunnel --url http://localhost:3847

pause
