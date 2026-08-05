/**
 * utils/fileSystem.js
 * Se encarga de la lectura, escritura y creación de directorios.
 */
const fs = require('fs');
const path = require('path');

function guardarPublicacion(nombreBase, jsonOficial, xhtmlFinal) {
    const dirSalida = path.join(process.cwd(), 'publicaciones', nombreBase);
    
    // Crear la carpeta si no existe
    if (!fs.existsSync(dirSalida)) {
        fs.mkdirSync(dirSalida, { recursive: true });
    }

    const rutaJson = path.join(dirSalida, `${nombreBase}_corregido.json`);
    const rutaXHTML = path.join(dirSalida, `${nombreBase}_procesado.xhtml`);

    // Guardar los archivos físicos
    fs.writeFileSync(rutaJson, JSON.stringify(jsonOficial, null, 2), 'utf-8');
    fs.writeFileSync(rutaXHTML, xhtmlFinal, 'utf-8');

    return { dirSalida, rutaJson, rutaXHTML };
}

module.exports = { guardarPublicacion };