'use strict';
/**
 * Sistema de reintentos para compilaciones fallidas
 */
async function conReintentos(funcion, opciones = {}) {
    const maxReintentos = opciones.maxReintentos || 3;
    const retrasoInicial = opciones.retraso || 1000;
    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            return await funcion();
        } catch (error) {
            console.warn(`⚠️ Intento ${intento}/${maxReintentos} falló: ${error.message}`);
            if (intento === maxReintentos) {
                throw error;
            }
            // Esperar con backoff exponencial
            const retraso = retrasoInicial * Math.pow(2, intento - 1);
            console.log(`⏳ Reintentando en ${retraso}ms...`);
            await new Promise(resolve => setTimeout(resolve, retraso));
        }
    }
}
module.exports = { conReintentos };