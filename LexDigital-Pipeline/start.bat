@echo off
title LexDigital Pipeline Server
cd /d "%~dp0"
echo ========================================================
echo       INICIANDO SERVIDOR LEXDIGITAL PIPELINE
echo ========================================================
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo ----------------------------------------------------
    echo [ERROR CRITICO] Node.js no pudo iniciar el servidor.
    echo Revisa si 'server.js' esta en esta misma carpeta.
    echo ----------------------------------------------------
)

pause