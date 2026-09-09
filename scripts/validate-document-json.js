'use strict';

const fs = require('fs');
const path = require('path');

function validarJSON(ruta) {
    const reporte = {
        status: 'ERROR',
        checks: [],
        mensaje: ''
    };

    if (!fs.existsSync(ruta)) {
        reporte.mensaje = 'Archivo no existe.';
        return reporte;
    }

    const buffer = fs.readFileSync(ruta);
    const texto = buffer.toString('utf8');

    // Verificar BOM
    if (texto.charCodeAt(0) === 0xFEFF || texto.includes('\uFEFF')) {
        reporte.checks.push({ check: 'UTF-8 sin BOM', ok: false });
        reporte.mensaje = 'El archivo contiene BOM o caracteres nulos.';
        return reporte;
    }
    reporte.checks.push({ check: 'UTF-8 sin BOM', ok: true });

    let data;
    try {
        data = JSON.parse(texto);
    } catch (error) {
        reporte.checks.push({ check: 'JSON válido', ok: false });
        reporte.mensaje = 'JSON inválido: ' + error.message;
        return reporte;
    }
    reporte.checks.push({ check: 'JSON válido', ok: true });

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        reporte.checks.push({ check: 'Objeto raíz', ok: false });
        reporte.mensaje = 'El documento debe ser un objeto JSON.';
        return reporte;
    }
    reporte.checks.push({ check: 'Objeto raíz', ok: true });

    const tieneMetadata = data.metadata && typeof data.metadata === 'object';
    reporte.checks.push({ check: 'metadata presente', ok: tieneMetadata });

    const tieneContenido = data.content || data.nodes || data.body;
    reporte.checks.push({ check: 'content/nodes/body presente', ok: !!tieneContenido });

    if (!tieneMetadata || !tieneContenido) {
        reporte.mensaje = 'El documento no cumple con la estructura mínima.';
        return reporte;
    }

    reporte.status = 'OK';
    reporte.mensaje = 'Documento válido para procesamiento.';
    return reporte;
}

if (require.main === module) {
    const ruta = process.argv[2];
    if (!ruta) {
        console.error('Uso: node scripts/validate-document-json.js <ruta-json>');
        process.exit(1);
    }
    const resultado = validarJSON(path.resolve(ruta));
    console.log(JSON.stringify(resultado, null, 2));
    process.exit(resultado.status === 'OK' ? 0 : 1);
}

module.exports = { validarJSON };
