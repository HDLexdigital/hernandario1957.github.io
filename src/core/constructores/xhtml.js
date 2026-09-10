'use strict';

function construirXHTML(titulo, contenido) {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${titulo}</title></head>
<body>${contenido}</body>
</html>`;
}

module.exports = { construirXHTML };
