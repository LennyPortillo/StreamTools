@echo off
title PENMA Overlay - Tunel Cloudflare
cd /d "%~dp0"

if exist config.bat call config.bat

if not defined CLOUDFLARED set CLOUDFLARED=cloudflared

echo.
echo  Abriendo tunel hacia localhost:3847...
echo  Copia la URL https://....trycloudflare.com que aparezca abajo
echo  y reinicia el servidor con esa URL en PUBLIC_URL.
echo.
echo  Deja esta ventana abierta durante el directo.
echo.

"%CLOUDFLARED%" tunnel --url http://localhost:3847

pause
