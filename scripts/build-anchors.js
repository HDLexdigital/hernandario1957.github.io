#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CATALOG_PATH = path.join(PUBLIC_DIR, 'catalogo.json');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'anchors.json');

function extractAnchorsFromHtml(html) {
  const anchors = [];
  const regex = /<h([1-6])\s+[^>]*\bid="([^"]+)"[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    anchors.push({
      id: match[2],
      level: parseInt(match[1], 10),
      text: match[3].replace(/<[^>]+>/g, '').trim(),
    });
  }
  return anchors;
}

function getDocumentList() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.warn('No se encontró catalogo.json; se escaneará public/ directamente.');
    return [];
  }
  const catalogoRaw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  let catalogo = [];
  if (Array.isArray(catalogoRaw)) {
    catalogo = catalogoRaw;
  } else if (catalogoRaw && typeof catalogoRaw === 'object') {
    catalogo = catalogoRaw.documentos || catalogoRaw.items || [];
  }
  return catalogo.map(doc => ({
    id: doc.id || doc.slug || path.basename(doc.url || '', '.html'),
    url: doc.url || `/${doc.id}.html`,
  }));
}

function resolveHtmlPath(publicUrl) {
  const relative = publicUrl.replace(/^\//, '');
  return path.join(PUBLIC_DIR, relative);
}

function main() {
  const documentList = getDocumentList();
  const allAnchors = [];

  if (documentList.length > 0) {
    for (const doc of documentList) {
      const htmlPath = resolveHtmlPath(doc.url);
      if (!fs.existsSync(htmlPath)) {
        console.warn(`Archivo no encontrado: ${htmlPath}, se omite.`);
        continue;
      }
      const html = fs.readFileSync(htmlPath, 'utf8');
      const anchors = extractAnchorsFromHtml(html);
      anchors.forEach(anchor => {
        allAnchors.push({
          documentId: doc.id,
          url: `${doc.url}#${anchor.id}`,
          ...anchor,
        });
      });
    }
  } else {
    // Fallback: escanear todos los .html dentro de public/
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          const html = fs.readFileSync(fullPath, 'utf8');
          const anchors = extractAnchorsFromHtml(html);
          const relative = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
          const documentId = path.basename(relative, '.html');
          anchors.forEach(anchor => {
            allAnchors.push({
              documentId,
              url: `/${relative}#${anchor.id}`,
              ...anchor,
            });
          });
        }
      }
    };
    walk(PUBLIC_DIR);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allAnchors, null, 2));
  console.log(`Anchors generados: ${allAnchors.length} en ${OUTPUT_PATH}`);
}

main();
