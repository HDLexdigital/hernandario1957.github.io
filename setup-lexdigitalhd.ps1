# Script PowerShell para crear estructura base de LexDigitalHD

# Carpeta raíz
$root = "lexdigitalhd"
New-Item -ItemType Directory -Force -Path $root

# Subcarpetas .github/workflows
New-Item -ItemType Directory -Force -Path "$root\.github\workflows"

# Carpeta public y subcarpetas
New-Item -ItemType Directory -Force -Path "$root\public\css"
New-Item -ItemType Directory -Force -Path "$root\public\js"
New-Item -ItemType Directory -Force -Path "$root\public\assets\img"
New-Item -ItemType Directory -Force -Path "$root\public\assets\docs"

# Archivos base en public
New-Item -ItemType File -Force -Path "$root\public\index.html"
New-Item -ItemType File -Force -Path "$root\public\publicaciones.html"
New-Item -ItemType File -Force -Path "$root\public\suscripcion.html"
New-Item -ItemType File -Force -Path "$root\public\contacto.html"
New-Item -ItemType File -Force -Path "$root\public\css\style.css"
New-Item -ItemType File -Force -Path "$root\public\js\main.js"

# Archivos raíz
New-Item -ItemType File -Force -Path "$root\.github\workflows\accessibility.yml"
New-Item -ItemType File -Force -Path "$root\.pa11yci"
New-Item -ItemType File -Force -Path "$root\README.md"
New-Item -ItemType File -Force -Path "$root\LICENSE"

Write-Host "Estructura de LexDigitalHD creada exitosamente."
