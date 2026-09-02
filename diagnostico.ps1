# diagnostico_proyecto.ps1
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   DIAGNÓSTICO PROYECTO LEXDIGITAL" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$projectRoot = "H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\proyecto-lexdigital_modular"

# 1. Estructura
Write-Host "`n📂 ESTRUCTURA DEL PROYECTO" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
Get-ChildItem $projectRoot -Directory | ForEach-Object {
    Write-Host "  📁 $($_.Name)" -ForegroundColor Green
    Get-ChildItem $_.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "    └── 📁 $($_.Name)" -ForegroundColor Gray
    }
}

# 2. Archivos JavaScript
Write-Host "`n📄 ARCHIVOS JAVASCRIPT" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
Get-ChildItem $projectRoot -Recurse -Filter "*.js" -Exclude node_modules |
    Where-Object { $_.FullName -notmatch 'node_modules|\.git' } |
    ForEach-Object {
        Write-Host "  📝 $($_.FullName.Replace($projectRoot, ''))" -ForegroundColor White
    }

# 3. Configuración
Write-Host "`n⚙️ CONFIGURACIÓN" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
if (Test-Path "$projectRoot\package.json") {
    $package = Get-Content "$projectRoot\package.json" | ConvertFrom-Json
    Write-Host "  📦 Nombre: $($package.name)" -ForegroundColor White
    Write-Host "  📦 Versión: $($package.version)" -ForegroundColor White
    Write-Host "  📦 Dependencias:" -ForegroundColor White
    $package.dependencies.PSObject.Properties | ForEach-Object {
        Write-Host "    - $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
}

# 4. Tamaños
Write-Host "`n📊 TAMAÑOS" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
Get-ChildItem $projectRoot -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
        Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  📁 $($_.Name): $([math]::Round($size, 2)) MB" -ForegroundColor White
}

# 5. Procesos Node
Write-Host "`n🔄 PROCESOS NODE ACTIVOS" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  ⚡ PID: $($_.Id), Memoria: $([math]::Round($_.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   FIN DEL DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan