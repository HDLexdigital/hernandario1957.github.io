const { performance } = require('perf_hooks');

const { normalizarJSON } =
    require('./core/validadorJson');

const { aplicarReglasJuridicas } =
    require('./core/clasificadorLegal');

const { construirEstructura } =
    require('./core/constructorXHTML');

const { procesarDOM } =
    require('./core/postProcesadorDom');

const { Logger } =
    require('./utils/logger');

const {
    PipelineError,
    ValidationError
} = require('./utils/errores');

const { Metricas } =
    require('./utils/metricas');

const { CONFIGURACION } =
    require('./config/default');

const { validarDocumento } =
    require('./core/validators/DocumentSchemaValidator');

const { validarContenido } =
    require('./core/validators/ContentSchemaValidator');

const logger =
    new Logger('compilarLexmotor');


/**
 * Compila un documento JSON jurídico mediante el pipeline LexDigital.
 *
 * Pipeline:
 *
 * 1. Validación y normalización JSON
 * 2. Aplicación de reglas jurídicas
 * 3. Construcción de estructura XHTML
 * 4. Post-procesamiento DOM
 * 5. Validación de salida
 *
 * Los errores contractuales (ValidationError / TypeError) se
 * propagan sin ser envueltos para preservar el contrato TDD.
 *
 * @param {Object} jsonCrudo
 * @param {string} nombreBase
 * @param {string} nombreCSS
 * @param {Object} opciones
 * @returns {Promise<Object>}
 */
async function compilarLexmotor(
    jsonCrudo,
    nombreBase,
    nombreCSS,
    opciones = {}
) {
    const metricas =
        new Metricas('Pipeline Completo');

    const tiempoInicio =
        performance.now();

    let faseActual =
        'Inicialización';

    try {

        /*
         * ============================================================
         * VALIDACIÓN DE ARGUMENTOS PÚBLICOS
         * ============================================================
         */

        if (
            jsonCrudo === null ||
            typeof jsonCrudo !== 'object' ||
            Array.isArray(jsonCrudo)
        ) {
            const tipoRecibido =
                jsonCrudo === null
                    ? 'null'
                    : Array.isArray(jsonCrudo)
                        ? 'array'
                        : typeof jsonCrudo;

            throw new TypeError(
                'jsonCrudo debe ser un objeto, se recibió: ' +
                tipoRecibido
            );
        }


        if (
            typeof nombreBase !== 'string' ||
            nombreBase.trim() === ''
        ) {
            throw new TypeError(
                'nombreBase debe ser un string no vacío'
            );
        }


        if (
            typeof nombreCSS !== 'string' ||
            nombreCSS.trim() === ''
        ) {
            throw new TypeError(
                'nombreCSS debe ser un string no vacío'
            );
        }


        if (
            typeof opciones !== 'object' ||
            opciones === null ||
            Array.isArray(opciones)
        ) {
            throw new TypeError(
                'opciones debe ser un objeto'
            );
        }


        /*
         * ============================================================
         * CONFIGURACIÓN
         * ============================================================
         */

        const config = {
            debug:
                opciones.debug ?? false,

            timeoutMs:
                opciones.timeoutMs ??
                CONFIGURACION.TIMEOUT_TOTAL ??
                30000,

            cache:
                opciones.cache ?? true,

            validarSalida:
                opciones.validarSalida ?? true
        };


        if (config.debug) {
            logger.setNivel('debug');
        }


        logger.info(
            'Iniciando compilación de LexDigital',
            {
                nombreBase,
                nombreCSS,
                debug: config.debug
            }
        );


        logger.debug(
            'Opciones de configuración',
            config
        );


        /*
         * ============================================================
         * FASE 1 — VALIDACIÓN Y NORMALIZACIÓN
         * ============================================================
         */

        faseActual =
            'Validación';

        logger.info(
            '▶ Fase 1: Validación y Normalización JSON'
        );


        const tiempoFase1 =
            performance.now();


        /*
         * ============================================================
         * FRONTERAS CONTRACTUALES
         * ============================================================
         *
         * PIPE-CONTRACT-001
         * Validación del objeto raíz.
         *
         * PIPE-CONTRACT-002
         * Validación de identidad documental.
         *
         * PIPE-CONTRACT-003
         * Validación estructural de contenido.
         *
         * Todas las fronteras se ejecutan ANTES de
         * normalizarJSON().
         */


        validarDocumento(
            jsonCrudo
        );


        validarContenido(
            jsonCrudo
        );


        /*
         * ============================================================
         * NORMALIZACIÓN
         * ============================================================
         *
         * A partir de este punto:
         *
         * - jsonCrudo es un objeto válido.
         * - documento existe y es válido.
         * - documento.titulo es válido.
         * - contenido existe.
         * - contenido es un array.
         * - cada elemento de contenido es un objeto.
         *
         * Por tanto normalizarJSON() recibe una entrada
         * estructuralmente válida.
         */

        const jsonEstructurado =
            normalizarJSON(
                jsonCrudo,
                nombreBase
            );


        if (
            !jsonEstructurado ||
            !Array.isArray(
                jsonEstructurado.tokens
            )
        ) {
            throw new ValidationError(
                'normalizarJSON no retornó estructura esperada'
            );
        }


        const duracionFase1 =
            performance.now() -
            tiempoFase1;


        metricas.registrarFase(
            'Validación',
            duracionFase1
        );


        logger.info(
            '✓ Fase 1 completa',
            {
                tokens:
                    jsonEstructurado.tokens.length,

                duracion:
                    `${duracionFase1.toFixed(2)}ms`
            }
        );


        /*
         * ============================================================
         * FASE 2 — CLASIFICACIÓN JURÍDICA
         * ============================================================
         */

        faseActual =
            'Clasificación';

        logger.info(
            '▶ Fase 2: Aplicación de Reglas Jurídicas'
        );


        const tiempoFase2 =
            performance.now();


        const tokensClasificados =
            aplicarReglasJuridicas(
                jsonEstructurado.tokens
            );


        if (
            !Array.isArray(tokensClasificados)
        ) {
            throw new ValidationError(
                'aplicarReglasJuridicas no retornó array'
            );
        }


        const duracionFase2 =
            performance.now() -
            tiempoFase2;


        metricas.registrarFase(
            'Clasificación',
            duracionFase2
        );


        logger.info(
            '✓ Fase 2 completa',
            {
                tokensClasificados:
                    tokensClasificados.length,

                duracion:
                    `${duracionFase2.toFixed(2)}ms`
            }
        );


        /*
         * ============================================================
         * FASE 3 — CONSTRUCCIÓN XHTML
         * ============================================================
         */

        faseActual =
            'Construcción';

        logger.info(
            '▶ Fase 3: Construcción de Estructura XHTML'
        );


        const tiempoFase3 =
            performance.now();


        const htmlBase =
            construirEstructura(
                tokensClasificados,
                jsonEstructurado.documento,
                nombreCSS
            );


        if (
            typeof htmlBase !== 'string' ||
            htmlBase.length === 0
        ) {
            throw new ValidationError(
                'construirEstructura retornó string vacío o inválido'
            );
        }


        const duracionFase3 =
            performance.now() -
            tiempoFase3;


        metricas.registrarFase(
            'Construcción',
            duracionFase3
        );


        logger.info(
            '✓ Fase 3 completa',
            {
                tamanioHTML:
                    `${(htmlBase.length / 1024).toFixed(2)}KB`,

                duracion:
                    `${duracionFase3.toFixed(2)}ms`
            }
        );


        /*
         * ============================================================
         * FASE 4 — POST-PROCESAMIENTO DOM
         * ============================================================
         */

        faseActual =
            'PostProcesamiento';

        logger.info(
            '▶ Fase 4: Post-Procesamiento DOM'
        );


        const tiempoFase4 =
            performance.now();


        const xhtmlFinal =
            procesarDOM(
                htmlBase
            );


        if (
            typeof xhtmlFinal !== 'string' ||
            xhtmlFinal.length === 0
        ) {
            throw new ValidationError(
                'procesarDOM retornó string vacío o inválido'
            );
        }


        const duracionFase4 =
            performance.now() -
            tiempoFase4;


        metricas.registrarFase(
            'PostProcesamiento',
            duracionFase4
        );


        logger.info(
            '✓ Fase 4 completa',
            {
                tamanioXHTML:
                    `${(xhtmlFinal.length / 1024).toFixed(2)}KB`,

                duracion:
                    `${duracionFase4.toFixed(2)}ms`
            }
        );


        /*
         * ============================================================
         * VALIDACIÓN DE SALIDA
         * ============================================================
         */

        faseActual =
            'Validación de salida';


        if (config.validarSalida) {

            logger.info(
                'Validando salida final...'
            );


            if (
                !xhtmlFinal.includes('<!DOCTYPE') &&
                !xhtmlFinal.includes('<html')
            ) {
                throw new ValidationError(
                    'XHTML final no contiene estructura HTML válida'
                );
            }


            logger.debug(
                '✓ Validación de salida exitosa'
            );
        }


        /*
         * ============================================================
         * RESULTADO FINAL
         * ============================================================
         */

        const tiempoTotal =
            performance.now() -
            tiempoInicio;


        metricas.registrarFaseTotal(
            tiempoTotal
        );


		const resultado = {

            jsonOficial: {
                documento: jsonEstructurado.documento,
                tokens: tokensClasificados
            },

            xhtml:
                xhtmlFinal,

            metadatos: {

                nombre:
                    nombreBase,

                version:
                    '1.0.0',

                timestamp:
                    new Date().toISOString(),

                tiempoTotal:
                    parseFloat(
                        tiempoTotal.toFixed(2)
                    ),

                fases: {

                    validacion:
                        parseFloat(
                            metricas
                                .obtenerDuracionFase(
                                    'Validación'
                                )
                                .toFixed(2)
                        ),

                    clasificacion:
                        parseFloat(
                            metricas
                                .obtenerDuracionFase(
                                    'Clasificación'
                                )
                                .toFixed(2)
                        ),

                    construccion:
                        parseFloat(
                            metricas
                                .obtenerDuracionFase(
                                    'Construcción'
                                )
                                .toFixed(2)
                        ),

                    postprocesamiento:
                        parseFloat(
                            metricas
                                .obtenerDuracionFase(
                                    'PostProcesamiento'
                                )
                                .toFixed(2)
                        )
                }
            }
        };


        const cantidadElementos =
            Array.isArray(
                jsonCrudo.contenido
            )
                ? jsonCrudo.contenido.length
                : 0;


        const velocidad =
            tiempoTotal > 0
                ? (
                    cantidadElementos /
                    (tiempoTotal / 1000)
                ).toFixed(2)
                : '0.00';


        logger.info(
            '✅ Pipeline completado exitosamente',
            {
                tiempoTotal:
                    `${tiempoTotal.toFixed(2)}ms`,

                velocidad:
                    `${velocidad} elementos/seg`
            }
        );


        return resultado;


    } catch (error) {

        /*
         * ============================================================
         * MANEJO GLOBAL DE ERRORES
         * ============================================================
         */

        logger.error(
            '❌ Error en el pipeline',
            {
                error:
                    error?.message ||
                    String(error),

                tipo:
                    error?.constructor?.name ||
                    'UnknownError',

                fase:
                    faseActual,

                tiempoHastaFalla:
                    `${(
                        performance.now() -
                        tiempoInicio
                    ).toFixed(2)}ms`,

                stack:
                    error?.stack
            }
        );


        /*
         * ============================================================
         * ERRORES CONTRACTUALES
         * ============================================================
         *
         * PIPE-CONTRACT-001
         * PIPE-CONTRACT-002
         * PIPE-CONTRACT-003
         *
         * Se conserva el tipo y mensaje originales.
         */

        if (
            error instanceof ValidationError ||
            error instanceof TypeError
        ) {
            throw error;
        }


        /*
         * ============================================================
         * ERRORES INTERNOS / INESPERADOS
         * ============================================================
         */

        throw new PipelineError(
            `Compilación falló: ${
                error?.message ||
                String(error)
            }`,
            {
                fase:
                    faseActual,

                original:
                    error
            }
        );
    }
}


/**
 * Comprueba compatibilidad básica de una entrada JSON
 * sin ejecutar el pipeline completo.
 *
 * Esta función NO lanza errores contractuales.
 * Devuelve siempre un objeto de diagnóstico.
 *
 * @param {Object} jsonCrudo
 * @returns {Object}
 */
function validarCompatibilidad(
    jsonCrudo
) {

    const resultado = {

        esValido:
            false,

        errores:
            [],

        advertencias:
            [],

        estadisticas:
            {}
    };


    try {

        /*
         * ============================================================
         * ENTRADA
         * ============================================================
         */

        if (
            jsonCrudo === null ||
            typeof jsonCrudo !== 'object' ||
            Array.isArray(jsonCrudo)
        ) {
            resultado.errores.push(
                'Entrada no es un objeto'
            );

            return resultado;
        }


        /*
         * ============================================================
         * DOCUMENTO
         * ============================================================
         */

        if (
            !jsonCrudo.documento ||
            typeof jsonCrudo.documento !== 'object' ||
            Array.isArray(jsonCrudo.documento)
        ) {
            resultado.errores.push(
                'Campo "documento" faltante o inválido'
            );
        }


        /*
         * ============================================================
         * CONTENIDO
         * ============================================================
         */

        if (
            !Array.isArray(
                jsonCrudo.contenido
            )
        ) {

            resultado.errores.push(
                'Campo "contenido" no es un array'
            );

        } else {

            resultado.estadisticas.elementos =
                jsonCrudo.contenido.length;
        }


        /*
         * ============================================================
         * RESULTADO
         * ============================================================
         */

        resultado.esValido =
            resultado.errores.length === 0;


    } catch (error) {

        resultado.errores.push(
            `Error en validación: ${error.message}`
        );
    }


    return resultado;
}


module.exports = {
    compilarLexmotor,
    validarCompatibilidad,
    PipelineError,
    ValidationError,
    Logger
};