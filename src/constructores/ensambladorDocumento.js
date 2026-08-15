/**
 * Contrato C.43/C.44: Ensamblador de Documento XML/XHTML
 * Envuelve fragmentos serializados en una estructura EPUB3 estricta (raíz única, metadatos, CSS).
 */
'use strict';

function ensamblarDocumentoXHTML(fragmento, opciones = {}) {
    // 1. Valores por defecto para garantizar compatibilidad retroactiva (C.43)
    const title = opciones.title || 'Documento LexDigital';
    const lang = opciones.lang || 'es';
    
    // 2. Construcción dinámica del bloque CSS
    let linkCss = '';
    if (opciones.cssName) {
        linkCss = `\n<link rel="stylesheet" href="${opciones.cssName}" type="text/css" />`;
    }

    // 3. Plantilla EPUB3/XHTML conforme
    return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${title}</title>${linkCss}
</head>
<body>
${fragmento}
</body>
</html>`;
}

module.exports = {
    ensamblarDocumentoXHTML
};