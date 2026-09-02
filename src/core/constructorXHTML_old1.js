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
    let fragmentosHijos = token.fragmentos || token.contenido || [];

    if (token.tipo === 'articulo') {
        const textoCompleto = token.texto || '';
        const matchCabecera = textoCompleto.match(/^(Artículo\s+\d+\.?\s*)([\s\S]*)/i);
        
        if (matchCabecera && fragmentosHijos.length > 0) {
            const cabeceraStr = matchCabecera[1];
            let charsToSkip = cabeceraStr.length;
            
            let nuevosFragmentos = [
                { 
                    texto: cabeceraStr.trim(), 
                    estiloCaracter: 'negrita-resaltado', 
                    formatoDirecto: { negrita: true } 
                },
                { 
                    texto: ' ', 
                    estiloCaracter: 'c01-bold', 
                    formatoDirecto: { negrita: true } 
                }
            ];

            fragmentosHijos.forEach(frag => {
                let fText = frag.texto || frag.text || '';
                if (charsToSkip >= fText.length) {
                    charsToSkip -= fText.length;
                } else {
                    let textoRestante = charsToSkip > 0 ? fText.substring(charsToSkip) : fText;
                    charsToSkip = 0;
                    
                    let esEstiloBase = !frag.estiloCaracter || frag.estiloCaracter === '[Ninguno]' || frag.estiloCaracter === '[ninguno]';
                    let negritaLimpia = frag.formatoDirecto?.negrita;
                    if (esEstiloBase) {
                        negritaLimpia = false; 
                    }

                    nuevosFragmentos.push({
                        ...frag,
                        texto: textoRestante,
                        formatoDirecto: { ...frag.formatoDirecto, negrita: negritaLimpia }
                    });
                }
            });
            fragmentosHijos = nuevosFragmentos;
        }
    }

    if (fragmentosHijos.length === 0) {
        let textoPlano = escaparHTML(token.texto || '');
        return textoPlano.replace(/\n/g, '<br/>');
    }

    const mapeoCaracteres = reglasBase.mapeoEstilosCaracter || {};
    
    return fragmentosHijos.map(frag => {
        let textoFrag = escaparHTML(frag.texto || frag.text || '');
        if (!textoFrag) return '';
        textoFrag = textoFrag.replace(/\n/g, '<br/>');

        const estiloClave = (frag.estiloCaracter || frag.characterStyle || frag.inDesignStyle || '').toLowerCase().replace(/[\s\_]+/g, "-");
        const negritaDirecta = frag.formatoDirecto?.negrita || frag.format?.capitalization === 'BOLD';
        const esEstiloVacio = !estiloClave || estiloClave === '[ninguno]' || estiloClave === 'ninguno' || estiloClave === '[]' || estiloClave === '[ningún]';

        let etiqueta = 'span';
        let clase = '';
        let atributos = '';

        if (!esEstiloVacio && mapeoCaracteres[estiloClave]) {
            const regla = mapeoCaracteres[estiloClave];
            etiqueta = regla.etiqueta || 'span';
            clase = regla.clase || estiloClave;
            if (regla.atributos) {
                atributos = Object.entries(regla.atributos).map(([k, v]) => ` ${escaparHTML(k)}="${escaparHTML(v)}"`).join('');
            }
        } else if (!esEstiloVacio) {
            etiqueta = 'span';
            clase = estiloClave;
        } else if (negritaDirecta) {
            etiqueta = 'strong';
        }

        if (esEstiloVacio && !negritaDirecta) {
            return textoFrag;
        }

        if (etiqueta === 'strong' && esEstiloVacio) {
            return `<strong>${textoFrag}</strong>`;
        }

        return `<${etiqueta} class="${clase}"${atributos}>${textoFrag}</${etiqueta}>`;
    }).join('');
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
        
        let nombreEstiloBase = token.claseLegal || token.estilo;
        if (!nombreEstiloBase && token.estiloParrafo && token.estiloParrafo.nombreEstilo) {
            nombreEstiloBase = token.estiloParrafo.nombreEstilo;
        }
        
        const clase = normalizarClase(nombreEstiloBase || token.tipo || 'parrafo');

        let etiqueta = 'p';
        let atributos = '';

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
            case 'capitulo':
            case 'seccion':
                etiqueta = 'h2';
                atributos = ' role="heading" aria-level="2"';
                break;
            case 'articulo':
                etiqueta = 'p';
                atributos = ' role="doc-section"';
                break;
            default:
                etiqueta = 'p';
                break;
        }

        let idAttr = token.id ? ` id="${escaparHTML(token.id)}"` : '';
        html += `            <${etiqueta}${idAttr} class="${clase}"${atributos}>${texto}</${etiqueta}>\n`;
    });

    html += `        </article>\n    </main>\n</body>\n</html>`;
    return html;
}

module.exports = { construirEstructura };