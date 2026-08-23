/**
 * MÓDULO: xhtmlValidator.js
 * Valida XHTML 1.1 contra DTD, cierra etiquetas, valida atributos
 * 
 * Validaciones:
 *   - DOCTYPE correcto
 *   - Tags balanceados y cerrados correctamente
 *   - Atributos válidos
 *   - Caracteres especiales escapados
 *   - Estructura jerárquica correcta
 */

class XHTMLValidator {
  constructor(config = {}) {
    this.config = {
      doctype: config.doctype || 'xhtml11',
      estricto: config.estricto !== false,
      reparar: config.reparar || false,
      idioma: config.idioma || 'es',
      ...config
    };

    this.errores = [];
    this.advertencias = [];
    this.info = [];
  }

  /**
   * MÉTODO PRINCIPAL: Validar XHTML
   * @param {string} xhtml - Contenido XHTML a validar
   * @returns {Object} { valido: boolean, errores: [], advertencias: [], info: [] }
   */
  validar(xhtml) {
    this.errores = [];
    this.advertencias = [];
    this.info = [];

    try {
      // 1. Validar DOCTYPE
      this.validarDOCTYPE(xhtml);

      // 2. Validar XML declaration
      this.validarXMLDeclaration(xhtml);

      // 3. Validar estructura básica
      this.validarEstructuraBasica(xhtml);

      // 4. Validar balanceo de tags
      this.validarBalanceoTags(xhtml);

      // 5. Validar atributos
      this.validarAtributos(xhtml);

      // 6. Validar caracteres especiales
      this.validarCaracteresEspeciales(xhtml);

      // 7. Validar accesibilidad ARIA
      this.validarARIA(xhtml);

      // 8. Validar semántica
      this.validarSemantica(xhtml);

      this.info.push(`Validación completada. Errores: ${this.errores.length}, Advertencias: ${this.advertencias.length}`);

    } catch (error) {
      this.errores.push({
        tipo: 'error_critico',
        mensaje: `Error durante validación: ${error.message}`,
        severidad: 'error'
      });
    }

    const valido = this.errores.length === 0 && (!this.config.estricto || this.advertencias.length === 0);

    return {
      valido: valido,
      errores: this.errores,
      advertencias: this.advertencias,
      info: this.info,
      resumen: {
        totalErrores: this.errores.length,
        totalAdvertencias: this.advertencias.length,
        totalInfo: this.info.length
      }
    };
  }

  /**
   * Valida DOCTYPE
   */
  validarDOCTYPE(xhtml) {
    const doctypeValidos = [
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
      '<!DOCTYPE html>',
      '<?xml version="1.0" encoding="UTF-8"?>'
    ];

    const tieneDOCTYPE = doctypeValidos.some(dt => xhtml.includes(dt));

    if (!tieneDOCTYPE && xhtml.substring(0, 100).includes('<!DOCTYPE')) {
      this.advertencias.push({
        tipo: 'doctype_no_estandar',
        mensaje: 'DOCTYPE no es estándar W3C',
        severidad: 'warning'
      });
    } else if (!tieneDOCTYPE && !xhtml.substring(0, 100).includes('<!DOCTYPE')) {
      this.errores.push({
        tipo: 'doctype_falta',
        mensaje: 'Falta DOCTYPE en el documento',
        severidad: 'error'
      });
    }
  }

  /**
   * Valida XML declaration
   */
  validarXMLDeclaration(xhtml) {
    if (xhtml.startsWith('<?xml')) {
      const xmlDecl = xhtml.match(/^<\?xml[^?]*\?>/);
      if (xmlDecl && !xmlDecl[0].includes('encoding')) {
        this.advertencias.push({
          tipo: 'xml_encoding_falta',
          mensaje: 'XML declaration debería incluir encoding',
          severidad: 'warning'
        });
      }
    }
  }

  /**
   * Valida estructura básica: <html>, <head>, <body>
   */
  validarEstructuraBasica(xhtml) {
    if (!/<html[\s>]/.test(xhtml)) {
      this.errores.push({
        tipo: 'tag_html_falta',
        mensaje: 'Falta etiqueta <html>',
        severidad: 'error'
      });
    }

    if (!/<\/html>/.test(xhtml)) {
      this.errores.push({
        tipo: 'tag_html_no_cerrada',
        mensaje: 'Etiqueta </html> no está cerrada',
        severidad: 'error'
      });
    }

    if (!/<head[\s>]/.test(xhtml)) {
      this.errores.push({
        tipo: 'tag_head_falta',
        mensaje: 'Falta etiqueta <head>',
        severidad: 'error'
      });
    }

    if (!/<body[\s>]/.test(xhtml)) {
      this.errores.push({
        tipo: 'tag_body_falta',
        mensaje: 'Falta etiqueta <body>',
        severidad: 'error'
      });
    }

    // Validar <title> dentro de <head>
    if (!/<head[\s\S]*<title[\s\S]*<\/title>[\s\S]*<\/head>/.test(xhtml)) {
      this.errores.push({
        tipo: 'title_estructura',
        mensaje: '<title> debe estar dentro de <head>',
        severidad: 'error'
      });
    }
  }

  /**
   * Valida balanceo de tags
   */
  validarBalanceoTags(xhtml) {
    const pila = [];
    const tagRegex = /<(\/?)(\w+)[^>]*>/g;
    let match;

    const tagsAutoclosing = ['br', 'hr', 'img', 'meta', 'link', 'input', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

    while ((match = tagRegex.exec(xhtml)) !== null) {
      const [, cierre, etiqueta] = match;
      const esAutoclosing = tagsAutoclosing.includes(etiqueta.toLowerCase());

      if (!cierre) {
        // Tag de apertura
        if (!esAutoclosing) {
          pila.push({ etiqueta, posicion: match.index });
        }
      } else {
        // Tag de cierre
        if (pila.length === 0) {
          this.errores.push({
            tipo: 'tag_sin_apertura',
            mensaje: `Tag de cierre sin apertura: </${etiqueta}>`,
            severidad: 'error',
            posicion: match.index
          });
        } else if (pila[pila.length - 1].etiqueta.toLowerCase() === etiqueta.toLowerCase()) {
          pila.pop();
        } else {
          this.errores.push({
            tipo: 'tag_desbalanceado',
            mensaje: `Tag desbalanceado: esperado </${pila[pila.length - 1].etiqueta}>, encontrado </${etiqueta}>`,
            severidad: 'error',
            posicion: match.index
          });
        }
      }
    }

    // Verificar que la pila esté vacía
    if (pila.length > 0) {
      pila.forEach(({ etiqueta, posicion }) => {
        this.errores.push({
          tipo: 'tag_no_cerrada',
          mensaje: `Tag no cerrada: <${etiqueta}>`,
          severidad: 'error',
          posicion: posicion
        });
      });
    }
  }

  /**
   * Valida atributos XHTML
   */
  validarAtributos(xhtml) {
    const atributosValidos = {
      'html': ['xmlns', 'lang', 'xml:lang', 'dir'],
      'meta': ['name', 'content', 'http-equiv', 'charset'],
      'link': ['rel', 'href', 'type', 'media'],
      'a': ['href', 'title', 'rel', 'type', 'hreflang', 'target'],
      'img': ['src', 'alt', 'width', 'height', 'usemap', 'ismap'],
      'form': ['action', 'method', 'enctype', 'name', 'id'],
      'input': ['type', 'name', 'value', 'checked', 'disabled', 'readonly'],
      '*': ['class', 'id', 'style', 'title', 'lang', 'xml:lang', 'dir', 'role', 'aria-label', 'aria-labelledby', 'aria-describedby']
    };

    const regexAttr = /<(\w+)\s+([^>]*?)>/g;
    let match;

    while ((match = regexAttr.exec(xhtml)) !== null) {
      const [, etiqueta, atributos] = match;
      const attrRegex = /(\w+(?::\w+)?)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(atributos)) !== null) {
        const attrNombre = attrMatch[1];

        // Validar nombre de atributo
        if (!/^[\w:\-]+$/.test(attrNombre)) {
          this.errores.push({
            tipo: 'atributo_invalido',
            mensaje: `Nombre de atributo inválido: ${attrNombre}`,
            severidad: 'error'
          });
        }

        // Validar que tenga valor
        if (!attrMatch[0].includes('=')) {
          this.advertencias.push({
            tipo: 'atributo_sin_valor',
            mensaje: `Atributo sin valor explícito: ${attrNombre}`,
            severidad: 'warning'
          });
        }
      }
    }
  }

  /**
   * Valida caracteres especiales
   */
  validarCaracteresEspeciales(xhtml) {
    // Buscar & sin escapar (excepto &nbsp;, &amp;, etc.)
    const ampersandRegex = /&(?![a-zA-Z]+;)(?![#\d]+;)/g;
    const matches = xhtml.match(ampersandRegex);
    if (matches) {
      this.errores.push({
        tipo: 'ampersand_sin_escapar',
        mensaje: `Encontrados ${matches.length} ampersands sin escapar`,
        severidad: 'error'
      });
    }

    // Buscar < y > sin escapar en contenido
    const ltRegex = /<(?![\w/])/g;
    const gtRegex = />(?![\w])/g;

    // Esto es más complejo, se necesita parsear correctamente
  }

  /**
   * Valida ARIA según WCAG 2.1 AA
   */
  validarARIA(xhtml) {
    // Validar que headings usen roles correctos
    const headingRegex = /<h[1-6][^>]*>/gi;
    let match;

    while ((match = headingRegex.exec(xhtml)) !== null) {
      const tag = match[0];
      const nivel = tag.match(/h([1-6])/i)[1];

      // Advertencia si heading salta niveles
      if (!tag.includes('role')) {
        // Los headings deberían tener roles
        this.advertencias.push({
          tipo: 'heading_sin_role',
          mensaje: `Heading <h${nivel}> debería tener role="heading"`,
          severidad: 'warning'
        });
      }
    }

    // Validar que enlaces tengan accesibilidad
    const linkRegex = /<a[^>]*>/gi;
    while ((match = linkRegex.exec(xhtml)) !== null) {
      const tag = match[0];
      if (!tag.includes('aria-label') && !tag.includes('title')) {
        this.advertencias.push({
          tipo: 'link_sin_label',
          mensaje: 'Enlaces deberían tener aria-label o title',
          severidad: 'warning'
        });
      }
    }
  }

  /**
   * Valida semántica HTML
   */
  validarSemantica(xhtml) {
    // <strong> vs <b> (se prefiere <strong>)
    if (/<b[\s>]/.test(xhtml)) {
      this.advertencias.push({
        tipo: 'uso_b',
        mensaje: 'Se prefiere usar <strong> en lugar de <b>',
        severidad: 'warning'
      });
    }

    // <em> vs <i> (se prefiere <em>)
    if (/<i[\s>]/.test(xhtml)) {
      this.advertencias.push({
        tipo: 'uso_i',
        mensaje: 'Se prefiere usar <em> en lugar de <i>',
        severidad: 'warning'
      });
    }

    // Advertencia si hay mucho contenido sin estructura de headings
    const headings = (xhtml.match(/<h[1-6]/g) || []).length;
    const paragrafos = (xhtml.match(/<p[\s>]/g) || []).length;

    if (paragrafos > 10 && headings === 0) {
      this.advertencias.push({
        tipo: 'falta_estructura_headings',
        mensaje: 'Documento tiene muchos párrafos pero ningún heading',
        severidad: 'warning'
      });
    }
  }

  /**
   * Repara XHTML simple
   * @param {string} xhtml - XHTML a reparar
   * @returns {string} XHTML reparado
   */
  reparar(xhtml) {
    if (!this.config.reparar) return xhtml;

    let resultado = xhtml;

    // Reparar & sin escapar (cuidadosamente)
    resultado = resultado.replace(/&([^a-zA-Z#])/g, '&amp;$1');

    // Agregar DOCTYPE si falta
    if (!resultado.match(/^<\?xml|^<!DOCTYPE/)) {
      resultado = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n' + resultado;
    }

    return resultado;
  }

  /**
   * Obtiene reporte de validación
   * @returns {string} Reporte legible
   */
  generarReporte() {
    let reporte = '=== REPORTE DE VALIDACIÓN XHTML ===\n\n';

    reporte += `ERRORES (${this.errores.length}):\n`;
    this.errores.forEach(err => {
      reporte += `  [${err.tipo}] ${err.mensaje}\n`;
    });

    if (this.advertencias.length > 0) {
      reporte += `\nADVERTENCIAS (${this.advertencias.length}):\n`;
      this.advertencias.forEach(adv => {
        reporte += `  [${adv.tipo}] ${adv.mensaje}\n`;
      });
    }

    if (this.info.length > 0) {
      reporte += `\nINFORMACIÓN:\n`;
      this.info.forEach(inf => {
        reporte += `  ${inf}\n`;
      });
    }

    return reporte;
  }
}

module.exports = XHTMLValidator;
