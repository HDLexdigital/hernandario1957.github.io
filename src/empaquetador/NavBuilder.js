/**
 * @fileoverview src/empaquetador/NavBuilder.js
 *
 * E14.3 — Generador del Navigation Document (nav.xhtml).
 *
 * Responsabilidad exclusiva:
 *   Modelo de navegación lógico → nav.xhtml válido con marcado EPUB3.
 *
 * Invariante:
 *   CERO MUTACIÓN SEMÁNTICA. No interpreta AST ni modifica artefactos previos.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * Escapa caracteres especiales para garantizar XML/XHTML válido.
 */
function escaparXML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Valida la seguridad y sintaxis de un enlace href de navegación.
 */
function validarHref(href) {
    if (!href || typeof href !== 'string' || href.trim() === '') {
        throw new Error('E14.3: El href de navegación es obligatorio y debe ser un string válido.');
    }

    const trimmed = href.trim();

    // Rechazar URLs absolutas o esquemas peligrosos
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) || trimmed.startsWith('data:')) {
        throw new Error(`E14.3: No se permiten URLs absolutas o esquemas externos en la navegación: ${trimmed}`);
    }

    // Rechazar path traversal que intente escapar de OEBPS (ej: ../fuera)
    const normalized = path.posix.normalize(trimmed);
    if (normalized.startsWith('../') || normalized === '..') {
        throw new Error(`E14.3: El href no puede escapar del directorio OEBPS mediante trayectorias relativas: ${trimmed}`);
    }

    return trimmed;
}

/**
 * Construye y escribe el documento nav.xhtml en el staging (OEBPS/nav.xhtml).
 * 
 * @param {Object} options
 * @param {string} options.stagingDir - Ruta raíz del staging OCF
 * @param {Array<Object>} options.navItems - Modelo de navegación [{ title, href }]
 */
async function construirNavegacion({ stagingDir, navItems = [] }) {
    if (!stagingDir || typeof stagingDir !== 'string') {
        throw new TypeError('stagingDir debe ser una ruta válida');
    }

    if (!Array.isArray(navItems) || navItems.length === 0) {
        throw new Error('E14.3: El modelo de navegación (navItems) no puede estar vacío.');
    }

    // Validar y construir los elementos de la lista
    const liElements = navItems.map(item => {
        if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
            throw new Error('E14.3: Cada elemento de navegación debe tener un "title" válido.');
        }

        const safeHref = validarHref(item.href);
        const safeTitle = escaparXML(item.title.trim());

        return `        <li><a href="${safeHref}">${safeTitle}</a></li>`;
    }).join('\n');

    // Estructura XHTML5 estricta con namespaces requeridos por EPUB3
    const navContent = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">
  <head>
    <meta charset="utf-8"/>
    <title>Tabla de Contenido</title>
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h2>Índice</h2>
      <ol>
${liElements}
      </ol>
    </nav>
  </body>
</html>`;

    // Guardar directamente en OEBPS/nav.xhtml
    const navPath = path.join(stagingDir, 'OEBPS', 'nav.xhtml');
    await fs.writeFile(navPath, navContent, { encoding: 'utf8', flag: 'w' });

    return {
        navPath,
        content: navContent
    };
}

module.exports = {
    construirNavegacion
};