/**
 * core/postProcesadorDom.js
 * Inyecta clases adicionales y garantiza la validez del XML utilizando JSDOM.
 */
const { JSDOM } = require('jsdom');

function procesarDOM(htmlEstructura) {
    const dom = new JSDOM(htmlEstructura, { contentType: "application/xhtml+xml" });
    const document = dom.window.document;
    
    // Resaltar la etiqueta "Artículo N." al inicio del párrafo
    const regexArticulo = /^(Artículo\s+\d+\.?)/i;
    document.querySelectorAll('.articulo-p').forEach(p => {
        const match = p.innerHTML.match(regexArticulo);
        if (match) {
            p.innerHTML = p.innerHTML.replace(match[1], `<strong class="articulo-num">${match[1]}</strong>`);
        }
    });

    let htmlFinal = dom.serialize();
    
    // Garantizar que la declaración XML aparezca al inicio si JSDOM la oculta
    if (!htmlFinal.startsWith('<?xml')) {
        htmlFinal = `<?xml version="1.0" encoding="utf-8"?>\n` + htmlFinal;
    }

    return htmlFinal;
}

module.exports = { procesarDOM };