#!/usr/bin/env bash
set -e

echo "📦 Instalando dependencias..."
npm ci

echo "🧱 Generando artefactos públicos..."
npm run publish:constitucion || true

node scripts/build-catalog.js || true
node scripts/build-metrics.js || true
node scripts/build-timeline.js || true
node scripts/build-global-timeline.js || true
node scripts/build-integrity-report.js || true
node scripts/build-external-links-report.js || true
node scripts/build-audit-summary.js || true

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

echo "✅ Build completado."
