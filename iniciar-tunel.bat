@echo off
title PENMA Overlay - Tunel Cloudflare
cd /d "%~dp0"

if exist config.bat call config.bat

REM Auto-detectar si no esta en config.bat
if not defined CLOUDFLARED (
  if exist "C:\cloudflared\cloudflared.exe" (
    set "CLOUDFLARED=C:\cloudflared\cloudflared.exe"
  ) else (
    set "CLOUDFLARED=cloudflared"
  )
)

REM Verificar que existe (ruta completa o en PATH)
if exist "%CLOUDFLARED%" goto :run
where "%CLOUDFLARED%" >nul 2>&1
if not errorlevel 1 goto :run

echo.
echo  ERROR: cloudflared no encontrado.
echo.
echo  Ya funciona con: C:\cloudflared\cloudflared.exe --version ?
echo  Entonces agrega en config.bat:
echo    set CLOUDFLARED=C:\cloudflared\cloudflared.exe
echo.
echo  O descarga desde:
echo  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
echo.
pause
exit /b 1

:run
echo.
echo  Usando: %CLOUDFLARED%
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
