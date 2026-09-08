/**
 * ARCHIVO DE INTEGRACIÓN: compilarLexmotor_v2.js
 * Reemplaza el compilarLexmotor.js actual
 * 
 * Orquesta los 5 módulos modernos:
 *   1. fragmentProcesador.js
 *   2. juridicoParser.js
 *   3. xhtmlBuilder.js
 *   4. ariaMapper.js
 *   5. xhtmlValidator.js
 * 
 * USO:
	const compilador = require('./compilarLexmotor_v2.js');
 *   const resultado = compilador.compilarAXHTML(jsonData, opciones);
 */

const XHTMLBuilder = require('./xhtmlBuilder');
const AriaMapper = require('./ariaMapper');
const XHTMLValidator = require('./xhtmlValidator');
const JuridicoParser = require('./juridicoParser');

/**
 * FUNCIÓN PRINCIPAL: Compila JSON de InDesign a XHTML completo
 * @param {Object} jsonData - JSON normalizado de InDesign
 * @param {Object} opciones - Opciones de compilación
 * @returns {Object} { xhtml, metadatos, validacion, errores }
 */
function compilarAXHTML(jsonData, opciones = {}) {
  console.log('[compilarLexmotor_v2] Iniciando compilación a XHTML...');

  try {
    // PASO 1: Crear builder XHTML
    const builder = new XHTMLBuilder({
      titulo: opciones.titulo || extraerTitulo(jsonData),
      idioma: opciones.idioma || 'es-CO',
      mapeoEstilos: opciones.mapeoEstilos || {},
      validar: opciones.validar !== false,
      generarTOC: opciones.generarTOC !== false
    });

    console.log(`[compilarLexmotor_v2] Builder creado. Título: "${builder.config.titulo}"`);

    // PASO 2: Construir XHTML básico
    const resultadoBuilder = builder.construirDesdeJSON(jsonData);

    if (!resultadoBuilder.xhtml) {
      throw new Error('XHTMLBuilder no pudo generar XHTML: ' + JSON.stringify(resultadoBuilder.errores));
    }

    console.log('[compilarLexmotor_v2] XHTML generado exitosamente');

    // PASO 3: Enriquecer con ARIA
    const ariaMapper = new AriaMapper({
      nivel: opciones.nivelAccesibilidad || 'AA',
      idioma: opciones.idioma || 'es-CO'
    });

    const xhtmlConARIA = enriquecerConARIA(
      resultadoBuilder.xhtml,
      resultadoBuilder.metadatos,
      ariaMapper
    );

    console.log('[compilarLexmotor_v2] ARIA agregado correctamente');

    // PASO 4: Validar XHTML
    const validator = new XHTMLValidator({
      doctype: opciones.doctype || 'xhtml11',
      estricto: opciones.validacionEstricta || false,
      reparar: opciones.reparar || false
    });

    const resultadoValidacion = validator.validar(xhtmlConARIA);

    if (!resultadoValidacion.valido && opciones.validacionEstricta) {
      console.warn('[compilarLexmotor_v2] Validación fallida en modo estricto');
      return {
        xhtml: null,
        metadatos: resultadoBuilder.metadatos,
        validacion: resultadoValidacion,
        errores: resultadoValidacion.errores
      };
    }

    console.log(`[compilarLexmotor_v2] Validación completada: ${resultadoValidacion.totalErrores} errores, ${resultadoValidacion.totalAdvertencias} advertencias`);

    // PASO 5: Retornar resultado final
    const resultado = {
      xhtml: xhtmlConARIA,
      metadatos: {
        ...resultadoBuilder.metadatos,
        validacion: resultadoValidacion,
        fechaCompilacion: new Date().toISOString(),
        compilador: 'compilarLexmotor_v2'
      },
      validacion: resultadoValidacion,
      errores: resultadoValidacion.errores,
      advertencias: resultadoValidacion.advertencias,
      stats: {
        bytesXHTML: xhtmlConARIA.length,
        lineasXHTML: xhtmlConARIA.split('\n').length
      }
    };

    console.log('[compilarLexmotor_v2] ✓ Compilación completada exitosamente');
    return resultado;

  } catch (error) {
    console.error('[compilarLexmotor_v2] ERROR CRÍTICO:', error.message);
    return {
      xhtml: null,
      metadatos: {},
      validacion: null,
      errores: [{
        tipo: 'error_compilacion',
        mensaje: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Enriquece XHTML con atributos ARIA
 * @param {string} xhtml - XHTML básico
 * @param {Object} metadatos - Metadatos de compilación
 * @param {AriaMapper} ariaMapper - Instancia de AriaMapper
 * @returns {string} XHTML enriquecido con ARIA
 */
function enriquecerConARIA(xhtml, metadatos, ariaMapper) {
  let resultado = xhtml;

  // Enriquecer articles
  resultado = resultado.replace(
    /<article([^>]*)>/g,
    (match, attrs) => {
      let atributosEnriquecidos = attrs;
      if (!attrs.includes('role=')) {
        atributosEnriquecidos += ' role="article"';
      }
      if (!attrs.includes('aria-')) {
        atributosEnriquecidos += ' aria-labelledby="doc-art-head"';
      }
      return `<article${atributosEnriquecidos}>`;
    }
  );

  // Enriquecer headings
  resultado = resultado.replace(
    /<h([1-6])([^>]*)>/g,
    (match, nivel, attrs) => {
      let atributosEnriquecidos = attrs;
      if (!attrs.includes('role=')) {
        atributosEnriquecidos += ` role="heading" aria-level="${nivel}"`;
      }
      return `<h${nivel}${atributosEnriquecidos}>`;
    }
  );

  // Enriquecer términos de glosario
  resultado = resultado.replace(
    /<mark([^>]*)class="termino-glosario"([^>]*)>/g,
    (match, attrs1, attrs2) => {
      let atributosEnriquecidos = attrs1 + 'class="termino-glosario"' + attrs2;
      if (!match.includes('role=')) {
        atributosEnriquecidos += ' role="term"';
      }
      return `<mark${atributosEnriquecidos}>`;
    }
  );

  // Agregar nav con TOC si hay artículos
  if (metadatos.estructura?.porTipo?.articulo > 0) {
    const tocHTML = generarTOC(metadatos);
    resultado = resultado.replace(
      /(<div id="contenido"[^>]*>)/,
      `$1\n${tocHTML}`
    );
  }

  return resultado;
}

/**
 * Genera tabla de contenidos desde metadatos
 * @param {Object} metadatos - Metadatos de compilación
 * @returns {string} HTML de TOC
 */
function generarTOC(metadatos) {
  if (!metadatos.estructura?.articulos || metadatos.estructura.articulos.length === 0) {
    return '';
  }

  let html = '<nav id="toc" role="navigation" aria-label="Tabla de Contenidos">\n';
  html += '<h2>Tabla de Contenidos</h2>\n';
  html += '<ol>\n';

  metadatos.estructura.articulos.forEach(numArticulo => {
    html += `<li><a href="#doc-articulo-${numArticulo}">Artículo ${numArticulo}</a></li>\n`;
  });

  html += '</ol>\n';
  html += '</nav>\n';

  return html;
}

/**
 * Extrae título del JSON de InDesign
 * @param {Object} jsonData - JSON completo
 * @returns {string} Título extraído o genérico
 */
function extraerTitulo(jsonData) {
  if (jsonData?.titulo) return jsonData.titulo;
  if (jsonData?.documento?.titulo) return jsonData.documento.titulo;
  if (jsonData?.tokens?.[0]?.texto) return jsonData.tokens[0].texto.substring(0, 100);
  return 'Documento Sin Título';
}

/**
 * Función auxiliar: Normaliza JSON de InDesign (prepara entrada)
 * @param {Object} jsonRaw - JSON raw de InDesign
 * @returns {Object} JSON normalizado
 */
function normalizarJSON(jsonRaw) {
  // Esta función debería ser similar a jsonEditorialAdapter
  // Por ahora, retorna el JSON tal cual
  return jsonRaw || {};
}

/**
 * Función auxiliar: Compila a EPUB3
 * @param {string} xhtml - XHTML base
 * @param {Object} metadatos - Metadatos
 * @returns {Object} { epub3: Buffer, metadatos }
 */
function compilarAEPUB3(xhtml, metadatos) {
  console.log('[compilarLexmotor_v2] Compilación a EPUB3 pendiente para Fase 2');
  return {
    epub3: null,
    mensaje: 'EPUB3 se implementará en Fase 2'
  };
}

/**
 * Función auxiliar: Compila a PDF/UA
 * @param {string} xhtml - XHTML base
 * @param {Object} metadatos - Metadatos
 * @returns {Object} { pdf: Buffer, metadatos }
 */
function compilarAPDFUA(xhtml, metadatos) {
  console.log('[compilarLexmotor_v2] Compilación a PDF/UA pendiente para Fase 2');
  return {
    pdf: null,
    mensaje: 'PDF/UA se implementará en Fase 2'
  };
}

// Exportar funciones principales
module.exports = {
  compilarAXHTML,
  compilarAEPUB3,
  compilarAPDFUA,
  normalizarJSON,
  enriquecerConARIA,
  generarTOC
};
