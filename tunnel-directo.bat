@echo off
title PENMA Overlay - Tunel
cd /d "%~dp0"

echo.
echo  El servidor debe estar corriendo en otra ventana (iniciar-servidor.bat)
echo  Copia la URL https://....trycloudflare.com que aparezca abajo
echo.

"C:\cloudflared\cloudflared.exe" tunnel --url http://localhost:3847

pause
