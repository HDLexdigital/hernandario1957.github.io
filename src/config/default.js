const { ConfigurationError } = require('../utils/errores');

const CONFIGURACION = {
    // Timeouts (en ms)
    TIMEOUT_TOTAL: parseInt(process.env.TIMEOUT_TOTAL || 30000),
    TIMEOUT_FASE_1: parseInt(process.env.TIMEOUT_FASE_1 || 5000),
    TIMEOUT_FASE_2: parseInt(process.env.TIMEOUT_FASE_2 || 10000),
    TIMEOUT_FASE_3: parseInt(process.env.TIMEOUT_FASE_3 || 10000),
    TIMEOUT_FASE_4: parseInt(process.env.TIMEOUT_FASE_4 || 5000),

    // Límites
    TAMANIO_MAXIMO_JSON: parseInt(process.env.TAMANIO_MAXIMO_JSON || 50 * 1024 * 1024), // 50MB
    ELEMENTOS_MAXIMO: parseInt(process.env.ELEMENTOS_MAXIMO || 100000),
    PROFUNDIDAD_MAXIMA: parseInt(process.env.PROFUNDIDAD_MAXIMA || 10),

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || './logs/lexdigital.log',

    // Cache
    USAR_CACHE: process.env.USAR_CACHE !== 'false',
    CACHE_DURACION_MS: parseInt(process.env.CACHE_DURACION_MS || 3600000), // 1 hora

    // Rendimiento
    PROCESOS_PARALELOS: parseInt(process.env.PROCESOS_PARALELOS || 4),
    TAMANIO_BATCH: parseInt(process.env.TAMANIO_BATCH || 100),

    // Validación
    VALIDAR_ENTRADA: process.env.VALIDAR_ENTRADA !== 'false',
    VALIDAR_SALIDA: process.env.VALIDAR_SALIDA !== 'false',

    // Ambiente
    AMBIENTE: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG === 'true',

    // Rutas
    RUTA_ENTRADA: process.env.RUTA_ENTRADA || './documentos',
    RUTA_SALIDA: process.env.RUTA_SALIDA || './outputs',
    RUTA_CACHE: process.env.RUTA_CACHE || './cache',

    // Versión
    VERSION: '1.0.0',
    API_VERSION: '1.0'
};

// Validar configuración
function validarConfiguracion() {
    const errores = [];

    if (CONFIGURACION.TIMEOUT_TOTAL < 1000) {
        errores.push('TIMEOUT_TOTAL debe ser >= 1000ms');
    }

    if (CONFIGURACION.ELEMENTOS_MAXIMO < 100) {
        errores.push('ELEMENTOS_MAXIMO debe ser >= 100');
    }

    if (errores.length > 0) {
        throw new ConfigurationError(
            'Configuración inválida:\n' + errores.join('\n')
        );
    }

    return true;
}

// Validar al cargar
try {
    validarConfiguracion();
} catch (error) {
    console.error('Error de configuración:', error.message);
    process.exit(1);
}

module.exports = {
    CONFIGURACION,
    validarConfiguracion
};