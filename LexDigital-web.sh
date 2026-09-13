#!/bin/bash

# Navegar a la carpeta del proyecto (por si se ejecuta desde otro directorio)
cd "$(dirname "$0")"

echo "=== Iniciando entorno de LexDigitalHD en Astro ==="

# Cargar nvm si está disponible para asegurar la versión correcta de Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Asegurar que se use la versión v22
nvm use 22 > /dev/null 2>&1

# Ejecutar el servidor de desarrollo
npm run dev