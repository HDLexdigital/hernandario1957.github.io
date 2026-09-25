/**
 * src/telemetria/persistenciaBatch.js
 * Persistencia histórica e inmutable de reportes C01-OBS
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function persistirReporteBatch(reporte, baseReportDir = 'reportes') {
    const fechaIso = reporte.batchId;
    const fechaCarpeta = fechaIso.split('T')[0];

    const directorioDestino = path.resolve(process.cwd(), baseReportDir, fechaCarpeta);
    
    if (!fs.existsSync(directorioDestino)) {
        fs.mkdirSync(directorioDestino, { recursive: true });
    }

    const timestampArchivo = fechaIso.replace(/[:.]/g, '-');
    let nombreArchivo = `batch-report-${timestampArchivo}.json`;
    let rutaAbsoluta = path.join(directorioDestino, nombreArchivo);

    // Salvaguarda OBS-INV-01: Evitar sobrescritura determinista si el archivo ya existe
    if (fs.existsSync(rutaAbsoluta)) {
        const sufijoUnico = crypto.randomBytes(4).toString('hex');
        nombreArchivo = `batch-report-${timestampArchivo}-${sufijoUnico}.json`;
        rutaAbsoluta = path.join(directorioDestino, nombreArchivo);
    }

    fs.writeFileSync(rutaAbsoluta, JSON.stringify(reporte, null, 2), 'utf8');

    return rutaAbsoluta;
}

module.exports = { persistirReporteBatch };
