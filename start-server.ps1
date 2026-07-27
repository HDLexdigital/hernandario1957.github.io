# Script PowerShell para iniciar servidor local en LexDigitalHD

# Carpeta raíz de publicación
$root = "public"

# Puerto donde se servirá el sitio
$port = 8080

# Inicia servidor usando Python (requiere tener Python instalado)
Write-Host "Iniciando servidor local en http://localhost:$port ..."
python -m http.server $port --directory $root
