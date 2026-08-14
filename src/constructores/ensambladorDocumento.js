/**
 * Contrato C.43: Ensamblador de Documento XML/XHTML
 * Envuelve fragmentos serializados en una estructura EPUB3 estricta (raíz única).
 */
'use strict';

function ensamblarDocumentoXHTML(fragmento) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">
<head>
<title>LexDigital Document</title>
</head>
<body>
${fragmento}
</body>
</html>`;
}

module.exports = {
    ensamblarDocumentoXHTML
};