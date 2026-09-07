'use strict';

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'public', 'nav.html');

const links = [
    { href: 'search.html', label: 'Búsqueda Simplificada' },
    { href: 'search-advanced.html', label: 'Búsqueda Avanzada' },
    { href: 'search-relevance.html', label: 'Búsqueda con Relevancia' },
    { href: 'novedades.html', label: 'Novedades' },
    { href: 'global-timeline.html', label: 'Línea de Tiempo Global' },
    { href: 'metrics.html', label: 'Métricas' },
    { href: 'exports.html', label: 'Exportaciones' },
    { href: 'collection.html', label: 'Colección Completa' }
];

const linksHtml = links.map(link => {
    return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
}).join('');

const htmlContent = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Navegación Pública — LexDigitalHD</title></head><body><h1>Navegación Pública</h1><ul>' + linksHtml + '</ul></body></html>';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('✅ public/nav.html generado.');
