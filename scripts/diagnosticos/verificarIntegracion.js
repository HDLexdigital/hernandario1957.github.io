'use strict';

const path = require('path');

function verificarRuta(nombreModulo) {
    try {
        const ruta = path.join(__dirname, 'src', 'core', 'constants', nombreModulo);
        require.resolve(ruta);
        return { success: true, ruta };
    } catch (e) {
        return { success: false, error: e.message };
    }
}


console.log('--- AUDITORÍA DE INTEGRACIÓN DE CONTRATO ---');

const check = verificarRuta('tiposValidos.js');
if (check.success) {
    console.log('✅ El contrato compartido es accesible en:', check.ruta);
    
    // Verificamos que el validador pueda importar ese contrato
    try {
        const { TIPOS_VALIDOS } = require(check.ruta);
        if (TIPOS_VALIDOS instanceof Set && TIPOS_VALIDOS.size > 0) {
            console.log('✅ TIPOS_VALIDOS exportado correctamente.');
        } else {
            console.error('❌ TIPOS_VALIDOS no está correctamente exportado como Set.');
        }
    } catch (err) {
        console.error('❌ Error al intentar importar el contrato:', err.message);
    }
} else {
    console.error('❌ Error: No se puede resolver la ruta del contrato:', check.error);
    console.log('⚠️ Asegúrate de crear "src/core/constants/tiposValidos.js" antes de integrar.');
}