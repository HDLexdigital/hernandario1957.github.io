const fs = require('fs');
const path = require('path');

const reporteDefectos = require('./reporte-defectos.json');
const diccionario = require('../modelos-referencia/diccionario-defectos.json');

function buscarDefecto(tipoDefecto) {
    return diccionario.find(d => d.tipoDefecto === tipoDefecto || d.id === tipoDefecto) || null;
}

function generarResenaUsuario(defecto) {
    if (!defecto) return 'No se encontró solución documentada.';
    return defecto.solucion.split('.')[0] + '.';
}

function generarResenaTecnica(defecto, reporte) {
    if (!defecto) return 'Revisar manualmente el archivo.';
    return {
        causaProbable: defecto.causaProbable,
        solucion: defecto.solucion,
        ejemploIncorrecto: defecto.ejemploIncorrecto,
        ejemploCorrecto: defecto.ejemploCorrecto,
        mensajeOriginal: reporte.mensaje
    };
}

function generarReporte() {
    const salida = reporteDefectos.map(reporte => {
        const defecto = buscarDefecto(reporte.tipoDefecto);
        return {
            archivo: reporte.archivo,
            estado: reporte.estado,
            severidad: reporte.severidad,
            reseña_usuario: generarResenaUsuario(defecto),
            reseña_tecnica: generarResenaTecnica(defecto, reporte)
        };
    });

    const outputPath = path.join(__dirname, 'reporte-soluciones.json');
    fs.writeFileSync(outputPath, JSON.stringify(salida, null, 2));
    console.log('✅ Reporte de soluciones generado en tests-estres/reporte-soluciones.json');
}

generarReporte();
