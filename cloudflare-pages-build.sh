#!/usr/bin/env bash
set -e

echo "📦 Instalando dependencias..."
npm ci

echo "📁 Creando directorio public..."
mkdir -p public

echo "🧹 Limpiando temporales grandes..."
find . -type f -size +25M -not -path './node_modules/*' -delete
find public -type f -size +25M -delete

echo "🧱 Generando artefactos públicos..."

# Generar catálogo y métricas
node scripts/build-catalog.js || true
node scripts/build-metrics.js || true
node scripts/build-timeline.js || true
node scripts/build-global-timeline.js || true
node scripts/build-integrity-report.js || true
node scripts/build-external-links-report.js || true
node scripts/build-audit-summary.js || true

# Generar dashboards HTML
node scripts/build-public-home.js || true
node scripts/build-public-nav.js || true
node scripts/build-public-search.js || true
node scripts/build-public-search-advanced.js || true
node scripts/build-public-search-relevance.js || true
node scripts/build-public-novedades.js || true
node scripts/build-global-timeline-html.js || true
node scripts/build-public-exports.js || true
node scripts/build-public-collection.js || true
node scripts/build-public-integrity.js || true
node scripts/build-deploy-status.js || true
node scripts/build-public-external-links.js || true
node scripts/build-public-anchors.js || true
node scripts/build-public-audit.js || true
node scripts/build-public-metrics.js || true

echo "🧹 Limpieza final de temporales..."
find . -type f -size +25M -not -path './node_modules/*' -delete
find public -type f -size +25M -delete

echo "✅ Build completado."
