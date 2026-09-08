const fs = require('fs');

function constructorXHTML(documento, opciones = {}) {
    const { titulo = 'Documento Fragmento', idioma = 'es-CO' } = opciones;
    
    let xhtml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xhtml += '<!DOCTYPE html>\n';
    xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' + idioma + '" lang="' + idioma + '">\n';
    xhtml += '<head>\n';
    xhtml += '  <meta charset="UTF-8" />\n';
    xhtml += '  <title>' + escapeHTML(titulo) + '</title>\n';
    xhtml += '  <link rel="stylesheet" href="assets/lexcodex.css" type="text/css" />\n';
    xhtml += '</head>\n';
    xhtml += '<body>\n';
    
    const contenido = extraerContenido(documento);
    console.log(`✅ Se encontraron y procesaron ${contenido.length} párrafos reales.`);
    
    for (const elemento of contenido) {
        xhtml += procesarElementoConClaseExacta(elemento);
    }
    
    xhtml += '</body>\n';
    xhtml += '</html>';
    
    return xhtml;
}

function extraerContenido(documento) {
    if (documento.body && Array.isArray(documento.body)) {
        const elementos = [];
        for (const story of documento.body) {
            if (story.type === 'story' && Array.isArray(story.children)) {
                for (const parrafo of story.children) {
                    if (parrafo.type === 'paragraph') {
                        let textoCompleto = '';
                        if (Array.isArray(parrafo.children)) {
                            for (const nodoTexto of parrafo.children) {
                                if (nodoTexto.type === 'text' && nodoTexto.text) {
                                    textoCompleto += nodoTexto.text;
                                }
                            }
                        }
                        if (textoCompleto.trim().length > 0) {
                            elementos.push({ texto: textoCompleto, estilo: parrafo.style || 'P01_BODY_BASE' });
                        }
                    }
                }
            }
        }
        return elementos;
    }
    return documento.contenido || documento.fragmentos || [];
}

function procesarElementoConClaseExacta(elemento) {
    if (!elemento || !elemento.texto) return '';
    const texto = escapeHTML(String(elemento.texto));
    const estilo = elemento.inDesignStyle || elemento.estilo || 'P01_BODY_BASE';
    const claseExacta = estilo.toLowerCase().replace(/_/g, '-');
    
    let etiqueta = 'p';
    if (estilo.includes('TITLE_MAIN') || estilo.includes('TITLE_BASE')) etiqueta = 'h1';
    else if (estilo.includes('TITLE_CHAPTER')) etiqueta = 'h2';
    else if (estilo.includes('TITLE_PART')) etiqueta = 'h1';
    else if (estilo.includes('TITLE')) etiqueta = 'h3';
    
    let clasesFinales = claseExacta;
    if (claseExacta.includes('body')) clasesFinales += ' parrafo-justificado';
    
    return '  <' + etiqueta + ' class="' + clasesFinales + '">' + texto + '</' + etiqueta + '>\n';
}

function escapeHTML(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- ZONA DE EJECUCIÓN DIRECTA ---
try {
    const rutaJSON = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\MisJSON\\fragmento.json';
    const rutaSalida = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\output\\fragmento_ESTILIZADO.xhtml';
    
    console.log("Leyendo AST de InDesign...");
    const json = JSON.parse(fs.readFileSync(rutaJSON, 'utf8'));
    
    const html = constructorXHTML(json);
    
    fs.writeFileSync(rutaSalida, html, 'utf8');
    console.log(`✅ ¡ÉXITO! HTML generado con un peso de ${html.length} bytes.`);
    console.log("👉 Abre este archivo en tu navegador: " + rutaSalida);
} catch (e) {
    console.error("❌ Error:", e);
}