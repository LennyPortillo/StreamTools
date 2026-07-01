@echo off
title PENMA Overlay - Tunel Cloudflare
cd /d "%~dp0"

if exist config.bat call config.bat

echo.
echo  IMPORTANTE: El servidor debe estar corriendo en otra ventana
echo  (iniciar-servidor.bat).
echo.
echo  Abriendo tunel hacia localhost:3847...
echo  Copia la URL https://....trycloudflare.com que aparezca abajo.
echo  Deja esta ventana abierta durante el directo.
echo.

REM Ruta mas comun en Windows — probar primero
if exist "C:\cloudflared\cloudflared.exe" (
  echo  Usando C:\cloudflared\cloudflared.exe
  echo.
  "C:\cloudflared\cloudflared.exe" tunnel --url http://localhost:3847
  goto :fin
)

REM Ruta en config.bat
if defined CLOUDFLARED (
  if exist "%CLOUDFLARED%" (
    echo  Usando %CLOUDFLARED%
    echo.
    "%CLOUDFLARED%" tunnel --url http://localhost:3847
    goto :fin
  )
)

REM En PATH del sistema
where cloudflared >nul 2>&1
if not errorlevel 1 (
  echo  Usando cloudflared del PATH
  echo.
  cloudflared tunnel --url http://localhost:3847
  goto :fin
)

echo.
echo  ERROR: no se encontro cloudflared.
echo  Proba manualmente:
echo    C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3847
echo.

:fin
pause
