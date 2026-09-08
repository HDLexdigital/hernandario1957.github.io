/**
 * MÓDULO: ariaMapper.js
 * Agrega atributos ARIA para accesibilidad WCAG 2.1 AA
 * 
 * Implementa:
 *   - Roles semánticos
 *   - aria-labelledby / aria-describedby
 *   - aria-live para contenido dinámico
 *   - aria-expanded, aria-hidden, etc.
 */

class AriaMapper {
  constructor(config = {}) {
    this.config = {
      nivel: config.nivel || 'AA',  // A, AA, AAA
      idioma: config.idioma || 'es-CO',
      generarLabels: config.generarLabels !== false,
      ...config
    };

    this.roles = this.rolesDefecto();
    this.atributos = this.atributosDefecto();
  }

  /**
   * Mapeo de roles ARIA por tipo de elemento
   */
  rolesDefecto() {
    return {
      'articulo': 'article',
      'seccion': 'region',
      'capitulo': 'doc-chapter',
      'titulo': 'heading',
      'paragrafo': 'doc-pagebreak',
      'inciso': 'doc-list-item',
      'termino': 'term',
      'definicion': 'definition',
      'nota': 'note',
      'advertencia': 'alert',
      'tabla': 'table',
      'lista': 'list',
      'enlace': 'doc-link',
      'cita': 'doc-quotation',
      'referencia': 'doc-ref'
    };
  }

  /**
   * Atributos ARIA por defecto según elemento
   */
  atributosDefecto() {
    return {
      'h1': { role: 'heading', 'aria-level': '1' },
      'h2': { role: 'heading', 'aria-level': '2' },
      'h3': { role: 'heading', 'aria-level': '3' },
      'h4': { role: 'heading', 'aria-level': '4' },
      'h5': { role: 'heading', 'aria-level': '5' },
      'h6': { role: 'heading', 'aria-level': '6' },
      'article': { role: 'article' },
      'section': { role: 'region' },
      'nav': { role: 'navigation' },
      'main': { role: 'main' },
      'aside': { role: 'complementary' },
      'footer': { role: 'contentinfo' },
      'form': { role: 'form' },
      'mark': { role: 'term' },
      'code': { role: 'code' },
      'strong': { role: 'emphasis' }
    };
  }

  /**
   * MÉTODO PRINCIPAL: Enriquecer elemento con ARIA
   * @param {string} etiqueta - Nombre de etiqueta (h1, article, etc.)
   * @param {Object} atributos - Atributos actuales
   * @param {Object} contexto - Contexto adicional { tipo, numero, id, padre, etc. }
   * @returns {Object} Atributos enriquecidos con ARIA
   */
  enriquecerElemento(etiqueta, atributos = {}, contexto = {}) {
    const atributosEnriquecidos = { ...atributos };

    // 1. Agregar role si no existe
    if (!atributosEnriquecidos.role) {
      const roleDefecto = this.atributosDefecto()[etiqueta]?.role;
      if (roleDefecto) {
        atributosEnriquecidos.role = roleDefecto;
      }
    }

    // 2. Agregar aria-level para headings
    if (/^h[1-6]$/i.test(etiqueta)) {
      const nivel = parseInt(etiqueta[1], 10);
      atributosEnriquecidos['aria-level'] = nivel;
    }

    // 3. Agregar aria-labelledby si tiene ID
    if (atributosEnriquecidos.id && !atributosEnriquecidos['aria-labelledby']) {
      atributosEnriquecidos['aria-labelledby'] = `${atributosEnriquecidos.id}-head`;
    }

    // 4. Agregar aria-describedby si hay descripción en contexto
    if (contexto.descripcion && !atributosEnriquecidos['aria-describedby']) {
      const idDesc = `${atributosEnriquecidos.id}-desc`;
      atributosEnriquecidos['aria-describedby'] = idDesc;
    }

    // 5. Contexto-específico (Artículos, Títulos, etc.)
    if (contexto.tipo === 'articulo') {
      this.enriquecerArticulo(atributosEnriquecidos, contexto);
    } else if (contexto.tipo === 'titulo') {
      this.enriquecerTitulo(atributosEnriquecidos, contexto);
    } else if (contexto.tipo === 'termino') {
      this.enriquecerTermino(atributosEnriquecidos, contexto);
    }

    // 6. Agregar lang si no existe
    if (!atributosEnriquecidos.lang && !atributosEnriquecidos['xml:lang']) {
      atributosEnriquecidos['xml:lang'] = this.config.idioma;
    }

    return atributosEnriquecidos;
  }

  /**
   * Enriquece un artículo jurídico
   * @param {Object} atributos - Atributos actuales
   * @param {Object} contexto - Contexto { numero, id, etc. }
   */
  enriquecerArticulo(atributos, contexto) {
    atributos.role = 'article';
    
    if (contexto.numero) {
      atributos['aria-label'] = `Artículo ${contexto.numero}`;
    }

    // Si tiene secciones anidadas
    if (contexto.tieneSubsecciones) {
      atributos['aria-expanded'] = 'true';
    }

    // Referencia cruzada si tiene padre
    if (contexto.tituloParent) {
      atributos['aria-owns'] = contexto.tituloParent;
    }
  }

  /**
   * Enriquece un título/sección
   * @param {Object} atributos - Atributos actuales
   * @param {Object} contexto - Contexto { numero, id, etc. }
   */
  enriquecerTitulo(atributos, contexto) {
    atributos.role = 'doc-chapter';
    
    if (contexto.numero) {
      atributos['aria-label'] = `Título ${contexto.numero}`;
    }

    // Marcar como expandible si tiene subsecciones
    if (contexto.tieneSubsecciones) {
      atributos['aria-expanded'] = 'true';
    }
  }

  /**
   * Enriquece un término de glosario
   * @param {Object} atributos - Atributos actuales
   * @param {Object} contexto - Contexto { termino, definicion, etc. }
   */
  enriquecerTermino(atributos, contexto) {
    atributos.role = 'term';
    
    if (contexto.termino) {
      atributos['aria-label'] = contexto.termino;
    }

    // Enlace a definición si existe
    if (contexto.idDefinicion) {
      atributos['aria-describedby'] = contexto.idDefinicion;
    }

    // Marcar como parte de glosario
    atributos.class = (atributos.class || '') + ' termino-glosario';
  }

  /**
   * Genera tabla de contenidos con estructura ARIA
   * @param {Array} elementos - Elementos detectados
   * @returns {string} HTML de TOC con ARIA
   */
  generarTOCAccesible(elementos) {
    if (elementos.length === 0) return '';

    let html = '<nav id="toc" role="navigation" aria-label="Tabla de Contenidos">\n';
    html += '  <h2>Tabla de Contenidos</h2>\n';
    html += '  <ol>\n';

    elementos.forEach(elem => {
      if (elem.tipo === 'articulo' || elem.tipo === 'titulo') {
        html += `    <li>\n`;
        html += `      <a href="#${elem.id}" aria-label="${elem.tipo} ${elem.numero}">\n`;
        html += `        ${elem.tipo.toUpperCase()} ${elem.numero}\n`;
        html += `      </a>\n`;

        // Si tiene subsecciones, crear subnivel
        if (elem.hijos && elem.hijos.length > 0) {
          html += `      <ol>\n`;
          elem.hijos.forEach(hijo => {
            html += `        <li><a href="#${hijo.id}">${hijo.tipo} ${hijo.numero}</a></li>\n`;
          });
          html += `      </ol>\n`;
        }

        html += `    </li>\n`;
      }
    });

    html += '  </ol>\n';
    html += '</nav>\n';

    return html;
  }

  /**
   * Agrega atributos ARIA para navegación por links
   * @param {string} href - URL destino
   * @param {string} tipo - Tipo de referencia (articulo, nota, etc.)
   * @param {string} numero - Número o identificador
   * @returns {Object} Atributos para etiqueta <a>
   */
  generarAtributosLink(href, tipo, numero) {
    const titulo = `${tipo} ${numero}`;
    
    return {
      href: href,
      role: 'doc-link',
      'aria-label': titulo,
      title: titulo,
      class: `ref-${tipo.toLowerCase()}`
    };
  }

  /**
   * Agrega aria-live para contenido que cambia dinámicamente
   * @param {Object} atributos - Atributos actuales
   * @param {string} politica - 'polite', 'assertive', 'off'
   * @param {boolean} atomic - Si debe anunciar toda la región
   */
  agregarAriaLive(atributos, politica = 'polite', atomic = false) {
    atributos['aria-live'] = politica;
    if (atomic) {
      atributos['aria-atomic'] = 'true';
    }
    return atributos;
  }

  /**
   * Agrega atributos para elemento oculto pero accesible
   * @param {Object} atributos - Atributos actuales
   * @returns {Object} Atributos con aria-hidden
   */
  hacerOcultoPeroAccesible(atributos) {
    atributos['aria-hidden'] = 'true';
    atributos.class = (atributos.class || '') + ' sr-only';  // Screen reader only
    return atributos;
  }

  /**
   * Valida atributos ARIA según nivel (A, AA, AAA)
   * @param {Object} atributos - Atributos a validar
   * @returns {Array} Errores de validación
   */
  validarARIA(atributos) {
    const errores = [];

    // Validaciones comunes
    const rolesValidos = [
      'article', 'region', 'heading', 'navigation', 'main', 'contentinfo',
      'complementary', 'application', 'form', 'search', 'button', 'link',
      'menuitem', 'tab', 'tabpanel', 'listbox', 'option', 'alert', 'alertdialog',
      'dialog', 'marquee', 'progressbar', 'scrollbar', 'slider', 'spinbutton',
      'status', 'timer', 'tooltip', 'treeitem', 'treegrid', 'doc-chapter',
      'doc-quotation', 'doc-link', 'doc-ref', 'doc-pagebreak', 'term'
    ];

    // Validar role
    if (atributos.role && !rolesValidos.includes(atributos.role)) {
      errores.push(`Role inválido: ${atributos.role}`);
    }

    // Validar aria-level
    if (atributos['aria-level']) {
      const nivel = parseInt(atributos['aria-level'], 10);
      if (nivel < 1 || nivel > 6) {
        errores.push(`aria-level debe estar entre 1-6: ${nivel}`);
      }
    }

    // Validar aria-live
    const ariaLiveValidos = ['off', 'polite', 'assertive'];
    if (atributos['aria-live'] && !ariaLiveValidos.includes(atributos['aria-live'])) {
      errores.push(`aria-live inválido: ${atributos['aria-live']}`);
    }

    // Validar aria-expanded
    const expandedValidos = ['true', 'false', 'undefined'];
    if (atributos['aria-expanded'] && !expandedValidos.includes(atributos['aria-expanded'])) {
      errores.push(`aria-expanded debe ser true/false: ${atributos['aria-expanded']}`);
    }

    return errores;
  }

  /**
   * Genera metadatos ARIA para accesibilidad
   * @param {Array} elementos - Elementos del documento
   * @returns {Object} Metadatos de accesibilidad
   */
  generarMetadatosAccesibilidad(elementos) {
    const metadatos = {
      nivel: this.config.nivel,
      elementosConRole: 0,
      elementosConLabel: 0,
      elementosConDescribedby: 0,
      headingsCorrectos: 0,
      linksConLabel: 0,
      erroresValidacion: []
    };

    elementos.forEach(elem => {
      if (elem.role) metadatos.elementosConRole++;
      if (elem['aria-label'] || elem['aria-labelledby']) metadatos.elementosConLabel++;
      if (elem['aria-describedby']) metadatos.elementosConDescribedby++;
      if (elem.role === 'heading') metadatos.headingsCorrectos++;
      if (elem.role === 'doc-link' && elem['aria-label']) metadatos.linksConLabel++;
    });

    return metadatos;
  }

  /**
   * Obtiene plantilla de atributos para un tipo específico
   * @param {string} tipo - Tipo de elemento
   * @returns {Object} Plantilla de atributos
   */
  obtenerPlantilla(tipo) {
    const plantillas = {
      'articulo': {
        role: 'article',
        'aria-label': 'Artículo [número]',
        'aria-labelledby': '[id]-head'
      },
      'titulo': {
        role: 'doc-chapter',
        'aria-label': 'Título [número]'
      },
      'termino': {
        role: 'term',
        'aria-describedby': '[id]-def',
        class: 'termino-glosario'
      },
      'nota': {
        role: 'note',
        'aria-label': 'Nota'
      },
      'tabla': {
        role: 'table',
        'aria-label': 'Tabla [número]'
      },
      'enlace': {
        role: 'doc-link',
        'aria-label': '[texto]'
      }
    };

    return plantillas[tipo] || {};
  }
}

module.exports = AriaMapper;
