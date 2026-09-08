'use strict';
const fs = require('fs');
const path = require('path');
function limpiarCache(directorioCache, maxEdadMs = 3600000) {
    if (!fs.existsSync(directorioCache)) return 0;
    const archivos = fs.readdirSync(directorioCache);
    let eliminados = 0;
    for (const archivo of archivos) {
        try {
            const stat = fs.statSync(path.join(directorioCache, archivo));
            if (Date.now() - stat.mtimeMs > maxEdadMs) {
                fs.unlinkSync(path.join(directorioCache, archivo));
                eliminados++;
            }
        } catch (e) {}
    }
    return eliminados;
}
module.exports = { limpiarCache };