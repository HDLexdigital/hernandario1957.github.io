# procesar_publicacion.ps1
# Automatización para Windows 11 (PowerShell + WSL2)
# Uso: .\procesar_publicacion.ps1 archivo.idml

param(
    [Parameter(Mandatory=$true)]
    [string]$ArchivoIDML,
    
    [switch]$Ayuda
)

# --- FUNCIONES ---
function Show-Help {
    Write-Host @"
Uso: .\procesar_publicacion.ps1 archivo.idml

Descripción:
  Convierte un archivo IDML a HTML, EPUB y PDF accesibles usando WSL2

Requisitos:
  - WSL2 instalado y configurado
  - Distribución Linux (Ubuntu) en WSL2
  - idml2docbook instalado en WSL2
  - pandoc instalado en WSL2

Ejemplos:
  .\procesar_publicacion.ps1 constitucion.idml
  .\procesar_publicacion.ps1 C:\Users\Usuario\Documentos\libro.idml

Opciones:
  -Ayuda    Mostrar esta ayuda
"@
}

function Write-Step {
    param([string]$Mensaje)
    Write-Host "▶ $Mensaje" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Mensaje)
    Write-Host "✅ $Mensaje" -ForegroundColor Green
}

function Write-Error {
    param([string]$Mensaje)
    Write-Host "❌ $Mensaje" -ForegroundColor Red
}

function Write-Info {
    param([string]$Mensaje)
    Write-Host "ℹ️ $Mensaje" -ForegroundColor Yellow
}

# --- VALIDACIÓN ---
if ($Ayuda) {
    Show-Help
    exit 0
}

if (-not (Test-Path $ArchivoIDML)) {
    Write-Error "El archivo '$ArchivoIDML' no existe"
    exit 1
}

# --- VERIFICAR WSL2 ---
$wslCheck = wsl --status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "WSL2 no está instalado o no está configurado"
    Write-Info "Instala WSL2 desde: https://learn.microsoft.com/windows/wsl/install"
    exit 1
}

# --- OBTENER RUTA ABSOLUTA ---
$rutaAbsoluta = Resolve-Path $ArchivoIDML
$nombreBase = [System.IO.Path]::GetFileNameWithoutExtension($ArchivoIDML)
$directorioBase = [System.IO.Path]::GetDirectoryName($rutaAbsoluta)

# --- ESCAPE DE RUTAS PARA WSL ---
$rutaWSL = $rutaAbsoluta.Path -replace '\\','/' -replace '^([A-Za-z]):','/mnt/$1'
$directorioWSL = $directorioBase -replace '\\','/' -replace '^([A-Za-z]):','/mnt/$1'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AUTOMATIZACIÓN DE PUBLICACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "Archivo: $ArchivoIDML"
Write-Info "Directorio: $directorioBase"
Write-Info "Nombre base: $nombreBase"
Write-Host ""

# --- CREAR CARPETA DE SALIDA ---
$carpetaSalida = Join-Path $directorioBase "${nombreBase}_publicacion"
if (-not (Test-Path $carpetaSalida)) {
    New-Item -ItemType Directory -Path $carpetaSalida | Out-Null
    Write-Success "Carpeta creada: $carpetaSalida"
}

$carpetaSalidaWSL = $carpetaSalida -replace '\\','/' -replace '^([A-Za-z]):','/mnt/$1'

# --- CREAR METADATA ---
$metadataContent = @'
---
title: "Constitución Política de Colombia"
author: "Gobierno de Colombia"
publisher: "Gobierno Nacional"
date: "2024"
lang: "es"
rights: "Dominio Público"
---
'@

$metadataPath = Join-Path $carpetaSalida "metadata.yaml"
Set-Content -Path $metadataPath -Value $metadataContent
Write-Success "Metadatos creados"

# --- CREAR CSS ---
$cssContent = @'
/* ================================================================
   PUBLICACIÓN ACCESIBLE - ESTILOS EDITORIALES
   ================================================================ */

* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 16px; }

body {
    font-family: "Liberation Serif", "Georgia", "Times New Roman", serif;
    font-size: 1rem;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
    max-width: 800px;
    margin: 2rem auto;
    padding: 1.5rem;
}

.p02-title-main {
    font-family: "Georgia Pro", "Georgia", serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    color: #1a3c6e;
    text-align: center;
    margin-top: 2.5rem;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
}

.titulo {
    font-family: "Georgia Pro", "Georgia", serif;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
    color: #1a3c6e;
    margin-top: 2rem;
    margin-bottom: 1rem;
    text-align: center;
    text-transform: uppercase;
}

.capitulo {
    font-family: "Georgia Pro", "Georgia", serif;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    color: #1a3c6e;
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    text-align: center;
}

.p01-body-cont, .p01-body-base {
    font-family: "Liberation Serif", "Georgia", serif;
    font-size: 1rem;
    line-height: 1.6;
    color: #1a1a1a;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    text-align: justify;
    text-indent: 1.25rem;
}

.glosario {
    font-style: italic;
    color: #0056b3;
    border-bottom: 1px dashed #0056b3;
}

@media (max-width: 600px) {
    body { font-size: 0.9rem; padding: 0.75rem; }
    .p02-title-main { font-size: 1.5rem; }
    .titulo { font-size: 1.25rem; }
    .capitulo { font-size: 1.1rem; }
}

@media print {
    body { font-size: 11pt; line-height: 1.4; margin: 0.5in; max-width: 100%; }
}
'@

$cssPath = Join-Path $carpetaSalida "estilos_accesibles.css"
Set-Content -Path $cssPath -Value $cssContent
Write-Success "CSS creado"

# --- PROCESAR CON WSL ---
Write-Host ""
Write-Info "Iniciando procesamiento en WSL2..."
Write-Host ""

# 1. IDML → DocBook
Write-Step "1/4: IDML → DocBook"
$wslCommand = @"
cd '$directorioWSL'
idml2docbook '$rutaWSL' -o '$carpetaSalidaWSL/${nombreBase}.docbook'
"@
wsl -e bash -c $wslCommand
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al generar DocBook"
    exit 1
}
Write-Success "DocBook generado"

# 2. DocBook → HTML
Write-Step "2/4: DocBook → HTML accesible"
$wslCommand = @"
cd '$carpetaSalidaWSL'
pandoc '${nombreBase}.docbook' -f docbook -t html5 --standalone --css='estilos_accesibles.css' --metadata-file='metadata.yaml' -o '${nombreBase}.html'
"@
wsl -e bash -c $wslCommand
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al generar HTML"
    exit 1
}
Write-Success "HTML generado"

# 3. DocBook → EPUB3
Write-Step "3/4: DocBook → EPUB3 accesible"
$wslCommand = @"
cd '$carpetaSalidaWSL'
pandoc '${nombreBase}.docbook' -f docbook -t epub3 --metadata-file='metadata.yaml' --css='estilos_accesibles.css' -o '${nombreBase}.epub'
"@
wsl -e bash -c $wslCommand
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al generar EPUB3"
    exit 1
}
Write-Success "EPUB3 generado"

# 4. DocBook → PDF
Write-Step "4/4: DocBook → PDF accesible"
$wslCommand = @"
cd '$carpetaSalidaWSL'
pandoc '${nombreBase}.docbook' -f docbook -t pdf --pdf-engine=xelatex -V documentclass=report -V geometry:margin=2.5cm -V fontsize=11pt -V mainfont="Liberation Serif" -o '${nombreBase}.pdf' 2>/dev/null
"@
wsl -e bash -c $wslCommand
if ($LASTEXITCODE -ne 0) {
    Write-Info "PDF no generado (puede faltar LaTeX en WSL2)"
    Write-Info "Para instalar LaTeX en WSL2: sudo apt install texlive-xetex"
} else {
    Write-Success "PDF generado"
}

# --- RESUMEN ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   PROCESAMIENTO COMPLETADO ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Info "📁 Archivos generados en: $carpetaSalida"
Write-Host ""
Write-Host "📄 Archivos disponibles:" -ForegroundColor Cyan
Write-Host "   - ${nombreBase}.docbook  (fuente intermedia)"
Write-Host "   - ${nombreBase}.html     (HTML accesible)"
Write-Host "   - ${nombreBase}.epub     (EPUB3 accesible)"
if (Test-Path (Join-Path $carpetaSalida "${nombreBase}.pdf")) {
    Write-Host "   - ${nombreBase}.pdf      (PDF accesible)"
}
Write-Host "   - estilos_accesibles.css  (hoja de estilos)"
Write-Host "   - metadata.yaml           (metadatos)"
Write-Host ""
Write-Info "💡 Para ver los resultados:"
Write-Host "   - HTML:  start $carpetaSalida\${nombreBase}.html"
Write-Host "   - EPUB:  Abrir en cualquier lector de EPUB"
Write-Host "   - PDF:   Abrir en Adobe Acrobat Reader"
Write-Host ""