'use strict';

const { escaparHTML, normalizarClase } = require('../src/utils/textUtils');
const { purgarCSSInDesign } = require('../src/utils/cssPurifier');

function construirEstructura(
    tokensEntrada,
    documentoEntrada,
    nombreCSS = 'Lexdigital_Modular.css',
    cssCrudoOriginal = ''
) {
    // 1. SELECCIÓN ESTRICTA DE TOKENS
    let tokens;
    if (Array.isArray(tokensEntrada)) {
        tokens = tokensEntrada;
    } else if (Array.isArray(tokensEntrada?.contenido)) {
        tokens = tokensEntrada.contenido;
    } else if (Array.isArray(tokensEntrada?.tokens)) {
        tokens = tokensEntrada.tokens;
    } else if (Array.isArray(tokensEntrada?.ast?.contenido)) {
        tokens = tokensEntrada.ast.contenido;
    } else {
        tokens = [];
    }

    // 2. LA LLAVE MAESTRA: Desenvolver el nodo raíz del AST
    if (tokens.length === 1 && Array.isArray(tokens[0].fragmentos) && tokens[0].fragmentos.length > 1) {
        console.log(`\n[LexDigital-XHTML] 🔓 Desenvolviendo nodo raíz. Bloques: ${tokens[0].fragmentos.length}\n`);
        
        if (tokens[0].documento && !documentoEntrada) {
            documentoEntrada = tokens[0].documento;
        }
        
        tokens = tokens[0].fragmentos;

        // 👇 AÑADE ESTAS DOS LÍNEAS TEMPORALMENTE 👇
        console.log('\n--- ANATOMÍA DEL PRIMER BLOQUE ---', JSON.stringify(tokens[0], null, 2));
        console.log('\n--- ANATOMÍA DEL SEGUNDO BLOQUE ---', JSON.stringify(tokens[1], null, 2));
    }
    } else if (tokens.length === 0) {
        console.error('[XHTML-CONTRACT-ERROR] construirEstructura recibió 0 tokens válidos.');
        return '';
    }

    let documento = documentoEntrada || { titulo: "Documento Jurídico" };
    const titulo = documento.titulo || "Constitución Política de Colombia";
    const cssDepurado = cssCrudoOriginal ? purgarCSSInDesign(cssCrudoOriginal) : '';

    let html = `<?xml version="1.0" encoding="utf-8"?>\n`;
    html += `<!DOCTYPE html>\n`;
    html += `<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">\n`;
    html += `<head>\n`;
    html += `    <meta charset="utf-8" />\n`;
    html += `    <title>${escaparHTML(titulo)}</title>\n`;
    html += `    <meta name="generator" content="LexDigitalHD Modular Engine" />\n`;
    
    if (cssDepurado) {
        html += `    <style>\n${cssDepurado}\n    </style>\n`;
    } else {
        html += `    <link rel="stylesheet" type="text/css" href="../estilos/${escaparHTML(nombreCSS)}" />\n`;
    }

    html += `</head>\n`;
    html += `<body role="document">\n`;
    html += `    <header role="banner">\n`;
    html += `        <h1 role="heading" aria-level="1">${escaparHTML(titulo)}</h1>\n`;
    html += `    </header>\n`;
    html += `    <main>\n`;

    let contadorArticulos = 0;
    let contadorSecciones = 0;
    let enSeccion = false;
    let enArticulo = false;

    tokens.forEach((token) => {
        if (!token || typeof token !== 'object') return;

        const estilo = token.estilo || token.inDesignStyle || token.estilo_indesign || token.tipo || 'parrafo';
        const clase = normalizarClase(estilo);

        let contenidoHtml = '';
        
        // 3. PROCESAMIENTO DE FRAGMENTOS INTERNOS (Estilos de carácter)
        if (Array.isArray(token.fragmentos) && token.fragmentos.length > 0) {
            contenidoHtml = token.fragmentos.map(frag => {
                const textoFrag = escaparHTML(frag.texto || '').replace(/\r\n|\r|\n/g, '<br/>');
                const estiloCar = frag.estiloCaracter;

                if (estiloCar && estiloCar !== '[Ninguno]') {
                    const claseCar = normalizarClase(estiloCar);
                    // Mapeo especial para glosario
                    if (estiloCar === 'TerminoGlosario') {
                        return `<mark class="${claseCar}" role="term">${textoFrag}</mark>`;
                    }
                    return `<span class="${claseCar}">${textoFrag}</span>`;
                }
                return textoFrag;
            }).join('');
        } else {
            let textoCrudo = token.texto || token.texto_completo || token.texto_limpio || '';
            // Sin trim() para preservar espacios en concatenaciones
            contenidoHtml = escaparHTML(textoCrudo).replace(/\r\n|\r|\n/g, '<br/>');
        }

        // Validación estricta y segura de contenido vacío
        const textoPlano = contenidoHtml.replace(/<[^>]*>/g, '').trim();
        if (!textoPlano || textoPlano === '[VACÍO]') {
            return;
        }

        // 4. MÁQUINA DE ESTADOS: Construcción jerárquica
        const esTitulo = estilo.includes('TITLE') || estilo.includes('TITULO') || textoPlano.toUpperCase().startsWith('TÍTULO');
        const esCapitulo = estilo.includes('CAPITULO') || textoPlano.toUpperCase().startsWith('CAPÍTULO');
        const esArticulo = textoPlano.toUpperCase().startsWith('ARTÍCULO');

        if (esTitulo) {
            if (enArticulo) { html += `        </article>\n`; enArticulo = false; }
            if (enSeccion) { html += `    </section>\n`; }
            
            contadorSecciones++;
            html += `    <section id="seccion-${contadorSecciones}" aria-labelledby="sec-head-${contadorSecciones}">\n`;
            html += `        <h2 id="sec-head-${contadorSecciones}" class="${clase}">${contenidoHtml}</h2>\n`;
            enSeccion = true;
        } 
        else if (esCapitulo) {
            if (enArticulo) { html += `        </article>\n`; enArticulo = false; }
            const indent = enSeccion ? '        ' : '    ';
            html += `${indent}<h3 class="${clase}">${contenidoHtml}</h3>\n`;
        }
        else if (esArticulo) {
            if (enArticulo) { html += `        </article>\n`; }
            contadorArticulos++;
            const indent = enSeccion ? '        ' : '    ';
            
            html += `${indent}<article id="art-${contadorArticulos}" aria-labelledby="art-head-${contadorArticulos}">\n`;
            html += `${indent}    <p id="art-head-${contadorArticulos}" class="${clase}"><strong>${contenidoHtml}</strong></p>\n`;
            enArticulo = true;
        } 
        else {
            const indent = enArticulo ? (enSeccion ? '            ' : '        ') : (enSeccion ? '        ' : '    ');
            html += `${indent}<p class="${clase}">${contenidoHtml}</p>\n`;
        }
    });

    // Cerrar etiquetas abiertas al finalizar el bucle
    if (enArticulo) html += `        </article>\n`;
    if (enSeccion) html += `    </section>\n`;

    html += `    </main>\n`;
    html += `</body>\n`;
    html += `</html>\n`;

    return html;
}

module.exports = {
    construirEstructura
};