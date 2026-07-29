@echo off
REM === Entrar al repositorio clonado en H: ===
cd /d H:\LexDigital\GITHUB\hernandario1957.github.io

REM === Ver estado de cambios (opcional, para revisión) ===
git status

REM === Añadir todos los cambios detectados ===
git add .

REM === Crear commit con mensaje automático ===
git commit -m "Actualización automática desde carpeta clonada en H:"

REM === Subir cambios al repositorio remoto en GitHub ===
git push origin main

REM === Mensaje final ===
echo.
echo 🚀 Deploy completado: cambios sincronizados y enviados a GitHub.
pause
