#!/usr/bin/env bash
set -e

echo "🧪 Generando documentos defectuosos..."
node tests-estres/generar-documentos-defectuosos.js

echo "📋 Ejecutando pruebas estresantes..."
node tests-estres/ejecutar-pruebas.js

echo "📊 Reporte generado en tests-estres/reporte-defectos.json"
