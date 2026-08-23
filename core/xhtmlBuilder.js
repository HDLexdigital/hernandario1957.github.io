/**
 * MÓDULO: xhtmlBuilder.js
 * Constructor XHTML refactorizado que usa:
 *   - fragmentProcesador.js (para estilos de carácter)
 *   - juridicoParser.js (para estructura jurídica)
 *   - ariaMapper.js (para accesibilidad ARIA)
 * 
 * ENTRADA: JSON normalizado de InDesign
 * SALIDA: XHTML 1.1 válido con ARIA + accesibilidad
 */

const FragmentProcesador = require('./fragmentProcesador');
const JuridicoParser = require('./juridicoParser');

class XHTMLBuilder {
  constructor(config = {}) {
    this.config = {
      titulo: config.titulo || 'Documento Sin Título',
      idioma: config.idioma || 'es-CO',
      doctype: config.doctype || 'xhtml',
      validar: config.validar !== false,
      generarTOC: config.generarTOC !== false,
      mapeoEstilos: config.mapeoEstilos || this.mapeoEstilosDefecto(),
      ...config
    };

    this.fragmentProcesador = new FragmentProcesador({
      mapeoEstilos: this.config.mapeoEstilos
    });

    this.juridicoParser = new JuridicoParser({
      generarIDs: true,
      idPrefix: 'doc'
    });

    this.erroresValidacion = [];
  }

  /**
   * Mapeo por defecto de estilos InDesign → elementos HTML
   */
  mapeoEstilosDefecto() {
    return {
      'P01_BODY_BASE': {
        etiqueta: 'p',
        clase: 'body-base',
        nivel: 0
      },
      'P01_BODY_CONT': {
        etiqueta: 'p',
        clase: 'body-cont',
        nivel: 0
      },
      'P02_TITLE_PART': {
        etiqueta: 'h2',
        clase: 'title-part',
        nivel: 2,
        role: 'heading'
      },
      'P02_TITLE_MAIN': {
        etiqueta: 'h1',
        clase: 'title-main',
        nivel: 1,
        role: 'heading',
        envolverEn: 'section'
      },
      'P03_CENTER_BOLD': {
        etiqueta: 'p',
        clase: 'center-bold',
        nivel: 0,
        estilo: 'text-align: center; font-weight: bold;'
      }
    };
  }

  /**
   * MÉTODO PRINCIPAL: Construir XHTML desde JSON
   * @param {Object} jsonData - JSON de InDesign normalizado
   * @returns {Object} { xhtml: string, metadatos: {}, errores: [] }
   */
  construirDesdeJSON(jsonData) {
    this.erroresValidacion = [];

    try {
      // 1. Extraer información
      const tokens = this.extraerTokens(jsonData);
      const titulo = this.extraerTitulo(jsonData);
      const autores = this.extraerAutores(jsonData);

      // 2. Analizar estructura jurídica
      const analisisJuridico = this.juridicoParser.analizarTokens(tokens);

      // 3. Construir contenido XHTML
      const contenidoHTML = this.construirContenido(tokens, analisisJuridico);

      // 4. Envolver con estructura DOCTYPE + head + body
      const xhtml = this.envolverEnDocumento(
        contenidoHTML,
        titulo,
        autores,
        analisisJuridico
      );

      // 5. Validar (opcional)
      if (this.config.validar) {
        this.validarXHTML(xhtml);
      }

      return {
        xhtml: xhtml,
        metadatos: {
          titulo: titulo,
          autores: autores,
          estructura: analisisJuridico.metadatos,
          elementos: analisisJuridico.elementos.length,
          erroresValidacion: this.erroresValidacion
        },
        errores: this.erroresValidacion
      };
    } catch (error) {
      return {
        xhtml: null,
        metadatos: {},
        errores: [
          {
            tipo: 'error_critico',
            mensaje: error.message,
            stack: error.stack
          }
        ]
      };
    }
  }

  /**
   * Extrae tokens del JSON de InDesign
   * @param {Object} jsonData - JSON completo
   * @returns {Array} Array de tokens normalizados
   */
  extraerTokens(jsonData) {
    if (!jsonData) return [];

    // Buscar tokens en distintas ubicaciones posibles
    const tokens = 
      jsonData.tokens ||
      jsonData.fragmentos ||
      jsonData.contenido ||
      (Array.isArray(jsonData) ? jsonData : []);

    if (!Array.isArray(tokens)) {
      return [];
    }

    // Normalizar cada token
    return tokens.map(token => ({
      texto: token.texto || token.text || '',
      estilo: token.estilo || token.style || token.tipo || '[Ninguno]',
      fragmentos: token.fragmentos || token.fragments || [],
      nivel: token.nivel || 0,
      id: token.id || null
    }));
  }

  /**
   * Extrae título del documento
   * @param {Object} jsonData - JSON completo
   * @returns {string} Título del documento
   */
  extraerTitulo(jsonData) {
    if (jsonData.titulo) return jsonData.titulo;
    if (jsonData.title) return jsonData.title;
    if (jsonData.documento?.titulo) return jsonData.documento.titulo;
    if (jsonData.metadatos?.titulo) return jsonData.metadatos.titulo;

    return this.config.titulo;
  }

  /**
   * Extrae información de autores
   * @param {Object} jsonData - JSON completo
   * @returns {Array} Array de autores
   */
  extraerAutores(jsonData) {
    if (jsonData.autores && Array.isArray(jsonData.autores)) return jsonData.autores;
    if (jsonData.autores && typeof jsonData.autores === 'string') return [jsonData.autores];
    if (jsonData.autor) return [jsonData.autor];
    if (jsonData.metadatos?.autores) return jsonData.metadatos.autores;

    return [];
  }

  /**
   * Construye el contenido HTML desde tokens
   * @param {Array} tokens - Tokens normalizados
   * @param {Object} analisisJuridico - Análisis de estructura
   * @returns {string} HTML del contenido
   */
  construirContenido(tokens, analisisJuridico) {
    let html = '';
    const mapaElementosDetectados = new Map(
      analisisJuridico.elementos.map(e => [e.indiceToken, e])
    );

    tokens.forEach((token, indice) => {
      const elementoDetectado = mapaElementosDetectados.get(indice);
      
      if (elementoDetectado) {
        // Es un elemento jurídico (Artículo, Título, etc.)
        html += this.construirElementoJuridico(token, elementoDetectado);
      } else {
        // Es un párrafo o elemento normal
        html += this.construirParagrafo(token);
      }
    });

    return html;
  }

  /**
   * Construye un párrafo normal con fragmentos
   * @param {Object} token - Token de párrafo
   * @returns {string} Párrafo HTML
   */
  construirParagrafo(token) {
    const mapeo = this.config.mapeoEstilos[token.estilo] || 
                  this.config.mapeoEstilos['P01_BODY_BASE'];

    const { etiqueta, clase, estilo: estiloCSS, role } = mapeo;

    // Procesar fragmentos internos
    let contenido = this.fragmentProcesador.procesarFragmentos(token);

    // Construir etiqueta
    let html = `<${etiqueta}`;
    if (clase) html += ` class="${clase}"`;
    if (role) html += ` role="${role}"`;
    if (estiloCSS) html += ` style="${estiloCSS}"`;
    html += `>${contenido}</${etiqueta}>\n`;

    return html;
  }

  /**
   * Construye un elemento jurídico (Artículo, Título, etc.)
   * @param {Object} token - Token del elemento
   * @param {Object} elemento - Elemento detectado
   * @returns {string} Elemento HTML completo
   */
  construirElementoJuridico(token, elemento) {
    const { tipo, numero, id } = elemento;

    let html = '';

    // Construir header del elemento
    html += `<article id="${id}" class="elemento-juridico ${tipo}" role="article" aria-labelledby="${id}-head">\n`;

    // Header con número del artículo
    html += `  <header>\n`;
    html += `    <p id="${id}-head" class="${tipo}-numero"><strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numero}</strong></p>\n`;
    html += `  </header>\n`;

    // Contenido
    html += `  <div class="${tipo}-contenido">\n`;

    // Procesar fragmentos
    let contenido = this.fragmentProcesador.procesarFragmentos(token);

    // Saltar el texto del número en el contenido (ya está en header)
    const textoSinNumero = token.texto
      .replace(new RegExp(`^${tipo}\\s+${numero}[.\\s]*`, 'i'), '')
      .trim();

    if (textoSinNumero) {
      html += `    <p>${this.fragmentProcesador.escaparTexto(textoSinNumero)}</p>\n`;
    }

    html += `  </div>\n`;
    html += `</article>\n`;

    return html;
  }

  /**
   * Envuelve el contenido en documento XHTML completo
   * @param {string} contenido - Contenido HTML
   * @param {string} titulo - Título del documento
   * @param {Array} autores - Autores
   * @param {Object} analisisJuridico - Análisis de estructura
   * @returns {string} Documento XHTML completo
   */
  envolverEnDocumento(contenido, titulo, autores, analisisJuridico) {
    const doctype = this.obtenerDOCTYPE();

    let xhtml = doctype + '\n';
    xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' + this.config.idioma + '">\n';

    // HEAD
    xhtml += '<head>\n';
    xhtml += `  <meta charset="UTF-8" />\n`;
    xhtml += `  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8" />\n`;
    xhtml += `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n`;
    xhtml += `  <meta name="language" content="${this.config.idioma}" />\n`;
    xhtml += `  <title>${this.escaparXML(titulo)}</title>\n`;
    
    // Meta autores
    if (autores.length > 0) {
      autores.forEach(autor => {
        xhtml += `  <meta name="author" content="${this.escaparXML(autor)}" />\n`;
      });
    }

    // Meta descripción
    const descripcion = analisisJuridico.metadatos.porTipo.articulo 
      ? `Documento jurídico con ${analisisJuridico.metadatos.porTipo.articulo} artículos`
      : 'Documento jurídico';
    xhtml += `  <meta name="description" content="${this.escaparXML(descripcion)}" />\n`;

    // CSS por defecto
    xhtml += `  <style type="text/css">\n`;
    xhtml += this.obtenerCSSDefecto();
    xhtml += `  </style>\n`;

    xhtml += '</head>\n';

    // BODY
    xhtml += '<body>\n';
    xhtml += `  <div id="documento" class="documento-juridico" role="main">\n`;
    xhtml += `    <header id="encabezado" class="encabezado-documento">\n`;
    xhtml += `      <h1 id="titulo-principal">${this.escaparXML(titulo)}</h1>\n`;
    
    if (autores.length > 0) {
      xhtml += `      <p class="autores">Por: ${autores.map(a => this.escaparXML(a)).join(', ')}</p>\n`;
    }

    xhtml += `    </header>\n`;
    
    xhtml += `    <div id="contenido" class="contenido-principal">\n`;
    xhtml += contenido;
    xhtml += `    </div>\n`;

    xhtml += `  </div>\n`;
    xhtml += '</body>\n';
    xhtml += '</html>\n';

    return xhtml;
  }

  /**
   * Obtiene el DOCTYPE según configuración
   * @returns {string} DOCTYPE declaration
   */
  obtenerDOCTYPE() {
    if (this.config.doctype === 'html5') {
      return '<!DOCTYPE html>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
  }

  /**
   * Obtiene CSS por defecto para XHTML
   * @returns {string} CSS embebido
   */
  obtenerCSSDefecto() {
    return `
      body { font-family: Georgia, serif; line-height: 1.5; margin: 2em; }
      h1, h2 { margin-top: 1.5em; margin-bottom: 0.5em; }
      .articulo-numero { font-weight: bold; margin-bottom: 0.5em; }
      .termino-glosario { background-color: #fff8dc; font-weight: bold; }
      .elemento-juridico { margin: 1em 0; padding: 1em; border-left: 4px solid #333; }
      .encabezado-documento { text-align: center; margin-bottom: 2em; border-bottom: 2px solid #333; }
    `;
  }

  /**
   * Escapa caracteres XML
   * @param {string} texto - Texto a escapar
   * @returns {string} Texto escapado
   */
  escaparXML(texto) {
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Valida XHTML (básico)
   * @param {string} xhtml - XHTML a validar
   * @returns {boolean} Es válido
   */
  validarXHTML(xhtml) {
    const validaciones = [
      {
        nombre: 'DOCTYPE presente',
        test: () => /<!DOCTYPE html|<!DOCTYPE html PUBLIC/.test(xhtml)
      },
      {
        nombre: 'XML declaration',
        test: () => /^<\?xml/.test(xhtml) || /<!DOCTYPE html [^P]/.test(xhtml)
      },
      {
        nombre: 'Tags cerrados',
        test: () => {
          const abiertos = (xhtml.match(/<[^/][^>]*>/g) || []).length;
          const cerrados = (xhtml.match(/<\/[^>]*>/g) || []).length;
          return abiertos === cerrados;
        }
      },
      {
        nombre: 'Estructura básica',
        test: () => /<html[^>]*>[\s\S]*<\/html>/.test(xhtml)
      }
    ];

    validaciones.forEach(({ nombre, test }) => {
      if (!test()) {
        this.erroresValidacion.push({
          tipo: 'validacion_xhtml',
          severidad: 'warning',
          mensaje: `Validación fallida: ${nombre}`
        });
      }
    });

    return this.erroresValidacion.length === 0;
  }
}

module.exports = XHTMLBuilder;
