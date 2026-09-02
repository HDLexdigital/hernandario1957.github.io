/**
 * MÓDULO: xhtmlBuilder.js
 * Constructor XHTML refactorizado que usa:
 *   - fragmentProcesador.js (para estilos de carácter)
 *   - juridicoParser.js (para estructura jurídica)
 *   - ariaMapper.js (para accesibilidad ARIA)
 * 
 * ENTRADA: JSON normalizado de InDesign (Formato AST)
 * SALIDA: XHTML 1.1 válido con ARIA + accesibilidad y vinculación a LEXCODEX
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
   * Mapeo por defecto de estilos InDesign → clases CSS reales de LEXCODEX
   */
  mapeoEstilosDefecto() {
    return {
      'P01_BODY_BASE': { etiqueta: 'p', clase: 'p01-body-base parrafo-justificado', nivel: 0 },
      'P01_BODY_FIRST': { etiqueta: 'p', clase: 'p01-body-first parrafo-justificado', nivel: 0 },
      'P01_BODY_CONT': { etiqueta: 'p', clase: 'p01-body-cont parrafo-justificado', nivel: 0 },
      'P02_TITLE_PART': { etiqueta: 'h1', clase: 'p02-title-part', nivel: 1, role: 'doc-subtitle' },
      'P02_TITLE_MAIN': { etiqueta: 'h2', clase: 'p02-title-main', nivel: 2, role: 'doc-subtitle' },
      'P03_CENTER_BOLD': { etiqueta: 'p', clase: 'p03-center-bold', nivel: 0 }
    };
  }

  construirDesdeJSON(jsonData) {
    this.erroresValidacion = [];

    try {
      // 1. Extraer información (Ahora sabe leer el AST de InDesign)
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
        errores: [{ tipo: 'error_critico', mensaje: error.message, stack: error.stack }]
      };
    }
  }

  /**
   * Extrae tokens del JSON de InDesign (Soporta formato AST nuevo y formato plano antiguo)
   */
  extraerTokens(jsonData) {
    if (!jsonData) return [];

    // 1. Detectar el nuevo formato de árbol AST (body > story > paragraph)
    if (jsonData.body && Array.isArray(jsonData.body)) {
      const tokensAplanados = [];
      
      jsonData.body.forEach(story => {
        if (story.type === 'story' && Array.isArray(story.children)) {
          story.children.forEach(nodoParrafo => {
            if (nodoParrafo.type === 'paragraph') {
              let textoCompleto = '';
              const fragmentos = [];
              
              // Extraer cada nodo de texto dentro del párrafo
              if (Array.isArray(nodoParrafo.children)) {
                nodoParrafo.children.forEach(nodoTexto => {
                  if (nodoTexto.type === 'text' && nodoTexto.text) {
                    textoCompleto += nodoTexto.text;
                    fragmentos.push({
                      texto: nodoTexto.text,
                      estiloCaracter: nodoTexto.characterStyle || '[Ninguno]'
                    });
                  }
                });
              }

              // Solo agregar si realmente hay texto, omitiendo retornos de carro vacíos
              if (textoCompleto.trim().length > 0) {
                tokensAplanados.push({
                  texto: textoCompleto,
                  estilo: nodoParrafo.style || 'P01_BODY_BASE',
                  fragmentos: fragmentos,
                  nivel: 0,
                  id: nodoParrafo.nodeId || null
                });
              }
            }
          });
        }
      });
      return tokensAplanados;
    }

    // 2. Si es el formato antiguo (plano)
    const tokens = jsonData.tokens || jsonData.fragmentos || jsonData.contenido || (Array.isArray(jsonData) ? jsonData : []);
    
    return tokens.map(token => ({
      texto: token.texto || token.text || '',
      estilo: token.estilo || token.style || token.tipo || '[Ninguno]',
      fragmentos: token.fragmentos || token.fragments || [],
      nivel: token.nivel || 0,
      id: token.id || null
    }));
  }

  /**
   * Extrae título del documento desde los metadatos del AST
   */
  extraerTitulo(jsonData) {
    if (jsonData.document?.metadata?.title) return jsonData.document.metadata.title;
    if (jsonData.titulo) return jsonData.titulo;
    if (jsonData.documento?.titulo) return jsonData.documento.titulo;

    return this.config.titulo;
  }

  /**
   * Extrae información de autores desde el AST
   */
  extraerAutores(jsonData) {
    if (jsonData.document?.metadata?.author) return [jsonData.document.metadata.author];
    if (jsonData.autores && Array.isArray(jsonData.autores)) return jsonData.autores;
    
    return [];
  }

  construirContenido(tokens, analisisJuridico) {
    let html = '';
    const mapaElementosDetectados = new Map(
      analisisJuridico.elementos.map(e => [e.indiceToken, e])
    );

    tokens.forEach((token, indice) => {
      const elementoDetectado = mapaElementosDetectados.get(indice);
      
      if (elementoDetectado) {
        html += this.construirElementoJuridico(token, elementoDetectado);
      } else {
        html += this.construirParagrafo(token);
      }
    });

    return html;
  }

  construirParagrafo(token) {
    const mapeo = this.config.mapeoEstilos[token.estilo] ||
                  this.config.mapeoEstilos['P01_BODY_BASE'] ||
                  { etiqueta: 'p', clase: token.estilo || 'P01_BODY_BASE', estilo: null, role: null };

    const { etiqueta, clase, estilo: estiloCSS, role } = mapeo;

    let contenido = this.fragmentProcesador.procesarFragmentos(token);

    let html = `<${etiqueta}`;
    if (clase) html += ` class="${clase}"`;
    if (role) html += ` role="${role}"`;
    if (estiloCSS) html += ` style="${estiloCSS}"`;
    html += `>${contenido}</${etiqueta}>\n`;

    return html;
  }

  construirElementoJuridico(token, elemento) {
    const { tipo, numero, id } = elemento;
    let html = '';

    html += `<article id="${id}" class="elemento-juridico ${tipo}" role="article" aria-labelledby="${id}-head">\n`;
    html += `  <header>\n`;
    html += `    <p id="${id}-head" class="${tipo}-numero"><strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numero}</strong></p>\n`;
    html += `  </header>\n`;
    html += `  <div class="${tipo}-contenido">\n`;

    let contenido = this.fragmentProcesador.procesarFragmentos(token);
    const textoSinNumero = token.texto.replace(new RegExp(`^${tipo}\\s+${numero}[.\\s]*`, 'i'), '').trim();

    if (textoSinNumero) {
      // Usamos el estilo original (ej. P01_BODY_BASE) convertido a clase CSS (p01-body-base)
      const claseOriginal = token.estilo ? token.estilo.toLowerCase().replace(/_/g, '-') : 'p01-body-base';
      html += `    <p class="${claseOriginal} parrafo-justificado">${this.fragmentProcesador.escaparTexto(textoSinNumero)}</p>\n`;
    }

    html += `  </div>\n`;
    html += `</article>\n`;

    return html;
  }

  envolverEnDocumento(contenido, titulo, autores, analisisJuridico) {
    const doctype = this.obtenerDOCTYPE();
    let xhtml = doctype + '\n';
    xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' + this.config.idioma + '">\n';

    xhtml += '<head>\n';
    xhtml += `  <meta charset="UTF-8" />\n`;
    xhtml += `  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8" />\n`;
    xhtml += `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n`;
    xhtml += `  <meta name="language" content="${this.config.idioma}" />\n`;
    xhtml += `  <title>${this.escaparXML(titulo)}</title>\n`;
    
    if (autores.length > 0) {
      autores.forEach(autor => {
        if(autor) xhtml += `  <meta name="author" content="${this.escaparXML(autor)}" />\n`;
      });
    }

    const descripcion = analisisJuridico.metadatos.porTipo.articulo 
      ? `Documento jurídico con ${analisisJuridico.metadatos.porTipo.articulo} artículos`
      : 'Documento jurídico';
    xhtml += `  <meta name="description" content="${this.escaparXML(descripcion)}" />\n`;

    // Vincular hoja de estilos externa LEXCODEX
    xhtml += `  <link rel="stylesheet" href="assets/lexcodex.css" type="text/css" />\n`;

    xhtml += '</head>\n';
    xhtml += '<body>\n';
    xhtml += `  <div id="documento" class="documento-juridico" role="main">\n`;
    xhtml += `    <header id="encabezado" class="encabezado-documento">\n`;
    xhtml += `      <h1 id="titulo-principal">${this.escaparXML(titulo)}</h1>\n`;
    
    if (autores.length > 0 && autores[0]) {
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

  obtenerDOCTYPE() {
    if (this.config.doctype === 'html5') return '<!DOCTYPE html>';
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
  }

  escaparXML(texto) {
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  validarXHTML(xhtml) {
    const validaciones = [
      { nombre: 'DOCTYPE presente', test: () => /<!DOCTYPE html|<!DOCTYPE html PUBLIC/.test(xhtml) },
      { nombre: 'XML declaration', test: () => /^<\?xml/.test(xhtml) || /<!DOCTYPE html [^P]/.test(xhtml) },
      { nombre: 'Tags cerrados', test: () => (xhtml.match(/<[^/][^>]*>/g) || []).length === (xhtml.match(/<\/[^>]*>/g) || []).length },
      { nombre: 'Estructura básica', test: () => /<html[^>]*>[\s\S]*<\/html>/.test(xhtml) }
    ];

    validaciones.forEach(({ nombre, test }) => {
      if (!test()) this.erroresValidacion.push({ tipo: 'validacion_xhtml', severidad: 'warning', mensaje: `Validación fallida: ${nombre}` });
    });
    return this.erroresValidacion.length === 0;
  }
}

module.exports = XHTMLBuilder;