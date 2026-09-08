'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// UTILIDADES INTEGRADAS
// ============================================================================
function escaparHTML(texto) {
    if (!texto) return '';
    return String(texto)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizarClase(clase) {
    if (!clase) return 'parrafo';
    return String(clase).toLowerCase().replace(/[\s\_]+/g, '-').replace(/[^a-z0-9_-]/g, '');
}

let purgarCSSInDesign = (css) => css;
try {
    const cssPurifier = require('../utils/cssPurifier');
    if (cssPurifier && cssPurifier.purgarCSSInDesign) {
        purgarCSSInDesign = cssPurifier.purgarCSSInDesign;
    }
} catch (e) {}

let reglasBase = { mapeoEstilosCaracter: {} };
try {
    const rutaReglas = path.join(__dirname, '..', '..', 'reglas-editorial.json');
    if (fs.existsSync(rutaReglas)) {
        reglasBase = JSON.parse(fs.readFileSync(rutaReglas, 'utf8'));
    }
} catch (e) {}

// ============================================================================

function procesarTextoInterno(token) {
    // ... mantén esta función exactamente igual ...
}

function construirEstructura(tokensEntrada, documentoEntrada, nombreCSS = 'Lexdigital_Modular.css', cssCrudoOriginal = '') {
    let tokens = [];
    let documento = documentoEntrada || { titulo: "Documento LexCodex" };

    if (Array.isArray(tokensEntrada)) tokens = tokensEntrada;
    else if (tokensEntrada && typeof tokensEntrada === 'object') {
        if (tokensEntrada.documento) documento = tokensEntrada.documento;
        if (Array.isArray(tokensEntrada.tokens)) tokens = tokensEntrada.tokens;
        else if (Array.isArray(tokensEntrada.contenido)) tokens = tokensEntrada.contenido;
    }

    const titulo = documento.titulo || "Documento LexCodex";
    const cssDepurado = cssCrudoOriginal ? purgarCSSInDesign(cssCrudoOriginal) : '';

    let html = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    html += `<!DOCTYPE html>\n`;
    html += `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">\n`;
    html += `<head>\n`;
    html += `    <meta charset="utf-8" />\n`;
    html += `    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5, user-scalable=yes" />\n`;
    html += `    <title>${escaparHTML(titulo)}</title>\n`;
    
    if (cssDepurado) {
        html += `    <style>\n/*<![CDATA[*/\n${cssDepurado}\n/*]]>*/\n    </style>\n`;
    } else {
        html += `    <link rel="stylesheet" href="${escaparHTML(nombreCSS)}" type="text/css" />\n`;
    }

    html += `</head>\n<body role="document">\n    <header role="banner">\n        <h1 role="heading" aria-level="1">${escaparHTML(titulo)}</h1>\n    </header>\n    <main role="main" aria-label="Contenido principal del documento">\n        <article role="article">\n`;

    tokens.forEach((token) => {
        const texto = procesarTextoInterno(token); 
        
        // Obtener estilo base para clase CSS
        let nombreEstiloBase = token.claseLegal || token.estilo;
        if (!nombreEstiloBase && token.estiloParrafo && token.estiloParrafo.nombreEstilo) {
            nombreEstiloBase = token.estiloParrafo.nombreEstilo;
        }
        const clase = normalizarClase(nombreEstiloBase || token.tipo || 'parrafo');

        // Determinar etiqueta y atributos
        let etiqueta = 'p';
        let atributos = '';
        let epubTypeAttr = token.epubType ? ` epub:type="${escaparHTML(token.epubType)}"` : '';

        // Heurística de títulos: si token.tipo es 'titulo' usa nivelHtml
        if (token.tipo === 'titulo') {
            const nivel = parseInt(token.nivelHtml) || 2; // por defecto 2
            etiqueta = `h${Math.min(Math.max(nivel, 1), 6)}`;
            atributos = ` role="heading" aria-level="${nivel}"${epubTypeAttr}`;
        } else {
            switch (token.tipo) {
                case 'preliminar_portada':
                case 'preliminar_legal':
                case 'preliminar_indice':
                case 'preliminar_prologo':
                    etiqueta = 'section';
                    atributos = ' role="doc-preface"';
                    break;
                case 'libro':
                case 'titulo_parte':
                    etiqueta = 'h1';
                    atributos = ' role="heading" aria-level="1"';
                    break;
                case 'capitulo':
                    etiqueta = 'h2';
                    atributos = ' role="heading" aria-level="2"';
                    break;
                case 'seccion':
                    etiqueta = 'h3';
                    atributos = ' role="heading" aria-level="3"';
                    break;
                case 'articulo':
                    etiqueta = 'p';
                    atributos = ' role="doc-section"';
                    break;
                default:
                    etiqueta = 'p';
                    break;
            }
            // Agregar epub:type si existe
            if (token.epubType) {
                atributos += epubTypeAttr;
            }
        }

        let idAttr = token.id ? ` id="${escaparHTML(token.id)}"` : '';
        html += `            <${etiqueta}${idAttr} class="${clase}"${atributos}>${texto}</${etiqueta}>\n`;
    });

    html += `        </article>\n    </main>\n</body>\n</html>`;
    return html;
}

module.exports = { construirEstructura };