#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CATALOG_PATH = path.join(PUBLIC_DIR, 'catalogo.json');
const METRICS_PATH = path.join(PUBLIC_DIR, 'build-metrics.json');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'index.html');

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  // Obtener catálogo y adaptarlo a un array de documentos
  const catalogoRaw = readJson(CATALOG_PATH, []);
  let catalogo = [];
  if (Array.isArray(catalogoRaw)) {
    catalogo = catalogoRaw;
  } else if (catalogoRaw && typeof catalogoRaw === 'object') {
    catalogo = catalogoRaw.documentos || catalogoRaw.items || [];
  }

  const metrics = readJson(METRICS_PATH, {}) || {};

  const navLinks = [
    { href: '/nav.html', label: 'Navegación' },
    { href: '/search.html', label: 'Búsqueda Simplificada' },
    { href: '/search-advanced.html', label: 'Búsqueda Avanzada' },
    { href: '/search-relevance.html', label: 'Búsqueda con Relevancia' },
    { href: '/exports.html', label: 'Exportaciones' },
    { href: '/collection.html', label: 'Colección Completa' },
    { href: '/novedades.html', label: 'Novedades' },
    { href: '/global-timeline.html', label: 'Línea de Tiempo Global' },
    { href: '/metrics.html', label: 'Métricas' }
  ].map(link => `<a href="${link.href}">${link.label}</a>`).join(' | ');

  const totalDocumentos = metrics.totalDocumentos || catalogo.length;
  const totalVersiones = metrics.totalVersiones || 0;

  const cards = `
    <div class="card">
      <div class="label">Documentos</div>
      <div class="value">${totalDocumentos}</div>
    </div>
    <div class="card">
      <div class="label">Versiones</div>
      <div class="value">${totalVersiones}</div>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LexDigitalHD 2.0</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; display: inline-block; min-width: 150px; }
    .label { font-size: 0.9rem; color: #666; }
    .value { font-size: 2rem; font-weight: bold; }
    nav a { margin-right: 1rem; }
  </style>
</head>
<body>
  <header>
    <h1>LexDigitalHD 2.0</h1>
    <p>Bienvenido al portal público del corpus jurídico.</p>
  </header>
  <nav>${navLinks}</nav>
  <section>
    <h2>Resumen</h2>
    ${cards}
  </section>
  <footer>
    <p>Generado por scripts/build-public-home.js</p>
  </footer>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
  console.log(`Página principal generada en ${OUTPUT_PATH}`);
}

main();