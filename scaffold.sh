#!/bin/bash

# Nombre de la carpeta raíz del proyecto
PROJECT_NAME="lexdigitalhd-orchestrator"

echo "⚙️  Construyendo la estructura para $PROJECT_NAME..."

# 1. Crear todos los directorios (-p asegura que se creen los directorios padre necesarios)
mkdir -p $PROJECT_NAME/{electron,server/{routes,services,utils},src/{layouts,pages,components,scripts,styles},workers/{python,jsx,bash}}

# 2. Entrar al directorio raíz
cd $PROJECT_NAME

# 3. Crear archivos de configuración en la raíz
touch package.json astro.config.mjs tailwind.config.cjs

# 4. Crear archivos de la capa Electron
touch electron/main.js electron/preload.js

# 5. Crear archivos de la capa Server (Node.js/Express)
touch server/server.js
touch server/routes/pipeline.js server/routes/logs.js
touch server/services/sseManager.js server/services/pythonRunner.js server/services/uxpDeployer.js server/services/schemaValidator.js
touch server/utils/logger.js

# 6. Crear archivos de la capa Visual (Astro)
touch src/layouts/DashboardLayout.astro
touch src/pages/index.astro src/pages/settings.astro
touch src/components/LogViewer.astro src/components/PipelineCard.astro src/components/StatusIndicator.astro
touch src/scripts/sseClient.js
touch src/styles/global.css

echo "✅ ¡Estructura creada con éxito! Puedes abrir la carpeta con tu editor:"
echo "cd $PROJECT_NAME && code ."