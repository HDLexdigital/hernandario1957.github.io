/**
 * Catálogo estricto de niveles de severidad soportados.
 */
const NIVELES_SEVERIDAD = {
    DEBUG: 'debug',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

/**
 * Catálogo inicial de tipos de eventos de diagnóstico permitidos.
 */
const TIPOS_EVENTO = {
    COMPILACION_INFO: 'COMPILACION_INFO',
    PERFIL_CARGADO: 'PERFIL_CARGADO',
    COMPILACION_ERROR: 'COMPILACION_ERROR'
};

/**
 * Crea y valida un evento de diagnóstico canónico e inmutable.
 * @param {Object} opciones - Parámetros del evento de diagnóstico.
 * @returns {Readonly<Object>} Objeto de evento congelado e independiente.
 * @throws {Error} Si el tipo o el nivel de severidad no son válidos.
 */
function crearEventoDiagnostico({ tipo, nivel, mensaje, fase = 'GENERAL', codigo = 0, metadatos = {} } = {}) {
    if (!Object.values(TIPOS_EVENTO).includes(tipo)) {
        throw new Error(`Tipo de evento no soportado o inválido: ${tipo}`);
    }

    if (!Object.values(NIVELES_SEVERIDAD).includes(nivel)) {
        throw new Error(`Nivel de severidad no soportado o inválido: ${nivel}`);
    }

    const evento = {
        id: `diag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        fase,
        nivel,
        tipo,
        codigo,
        mensaje: mensaje || '',
        metadatos: metadatos && typeof metadatos === 'object' ? JSON.parse(JSON.stringify(metadatos)) : {}
    };

    // Retorna una estructura estrictamente congelada para garantizar inmutabilidad periférica
    return Object.freeze(evento);
}

module.exports = {
    crearEventoDiagnostico,
    TIPOS_EVENTO,
    NIVELES_SEVERIDAD
};