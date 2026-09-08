/**
 * MÓDULO: fragmentProcesador.js
 * Procesa fragmentos internos (estilos de carácter) dentro de párrafos
 * 
 * ENTRADA: token.fragmentos[] con estiloCaracter (TerminoGlosario, [Ninguno], etc.)
 * SALIDA: HTML con <mark>, <span>, <strong> según el estilo
 * 
 * Ejemplo:
 *   Input:  { fragmentos: [
 *     { texto: "Constitución", estiloCaracter: "TerminoGlosario" },
 *     { texto: " Política de ", estiloCaracter: "[Ninguno]" },
 *     { texto: "Colombia", estiloCaracter: "TerminoGlosario" }
 *   ]}
 *   Output: <mark class="termino-glosario" role="term">Constitución</mark> 
 *           Política de <mark class="termino-glosario" role="term">Colombia</mark>
 */

class FragmentProcesador {
  constructor(config = {}) {
    this.config = {
      mapeoEstilos: config.mapeoEstilos || this.mapeoEstilosDefecto(),
      escaparHTML: config.escaparHTML !== false,
      preservarEspacios: config.preservarEspacios || false,
      ...config
    };
  }

  /**
   * Mapeo por defecto de estilos de carácter → elementos HTML
   */
  mapeoEstilosDefecto() {
    return {
      'TerminoGlosario': {
        etiqueta: 'mark',
        clase: 'termino-glosario',
        role: 'term',
        atributos: { 'data-tipo': 'glosario' }
      },
      '00_Normal_char': {
        etiqueta: 'span',
        clase: 'texto-normal',
        role: null
      },
      '[Ninguno]': {
        etiqueta: null,  // Sin envolver
        clase: null,
        role: null
      },
      'TITLE_ENFASIS': {
        etiqueta: 'strong',
        clase: 'enfasis-titulo',
        role: null
      },
      'CITA_LEGAL': {
        etiqueta: 'cite',
        clase: 'cita-legal',
        role: 'doc-quotation',
        atributos: { 'data-tipo': 'cita' }
      },
      'REFERENCIA_ARTICULO': {
        etiqueta: 'a',
        clase: 'ref-articulo',
        role: 'doc-link',
        atributos: { 'data-tipo': 'referencia' }
      }
    };
  }

  /**
   * MÉTODO PRINCIPAL: Procesar fragmentos de un token
   * @param {Object} token - Token con .texto y .fragmentos[]
   * @returns {string} HTML con fragmentos procesados
   */
  procesarFragmentos(token) {
    // Si no hay fragmentos, retornar texto limpio
    if (!token.fragmentos || token.fragmentos.length === 0) {
      return this.escaparTexto(token.texto || '');
    }

    // Procesar cada fragmento y construir HTML
    return token.fragmentos
      .map(frag => this.procesarFragmento(frag))
      .join('');
  }

  /**
   * Procesa un fragmento individual
   * @param {Object} fragmento - { texto, estiloCaracter }
   * @returns {string} HTML del fragmento
   */
  procesarFragmento(fragmento) {
    const { texto, estiloCaracter } = fragmento;
    
    if (!texto) return '';

    const textoEscapado = this.escaparTexto(texto);
    const estilo = this.config.mapeoEstilos[estiloCaracter] || 
                   this.config.mapeoEstilos['[Ninguno]'];

    // Si el estilo no especifica etiqueta, retornar texto plano
    if (!estilo || !estilo.etiqueta) {
      return textoEscapado;
    }

    // Construir etiqueta HTML
    return this.construirEtiqueta(textoEscapado, estilo, estiloCaracter);
  }

  /**
   * Construye etiqueta HTML con atributos
   * @param {string} contenido - Contenido de la etiqueta
   * @param {Object} estilo - Configuración de estilo
   * @param {string} nombreEstilo - Nombre original del estilo
   * @returns {string} Etiqueta HTML
   */
  construirEtiqueta(contenido, estilo, nombreEstilo) {
    const { etiqueta, clase, role, atributos = {} } = estilo;
    
    let html = `<${etiqueta}`;
    
    // Agregar clase
    if (clase) {
      html += ` class="${clase}"`;
    }
    
    // Agregar role ARIA
    if (role) {
      html += ` role="${role}"`;
    }
    
    // Agregar data-style para debugging
    html += ` data-char-style="${this.escaparAtributo(nombreEstilo)}"`;
    
    // Agregar atributos adicionales
    Object.entries(atributos).forEach(([key, value]) => {
      html += ` ${key}="${this.escaparAtributo(value)}"`;
    });
    
    html += `>${contenido}</${etiqueta}>`;
    
    return html;
  }

  /**
   * Procesa fragmentos complejos anidados (si los hay)
   * @param {Array} fragmentos - Array de fragmentos
   * @param {number} nivel - Nivel de anidación (para debugging)
   * @returns {string} HTML procesado
   */
  procesarFragmentosAnidados(fragmentos, nivel = 0) {
    if (!Array.isArray(fragmentos)) {
      return this.escaparTexto(String(fragmentos || ''));
    }

    return fragmentos
      .map(frag => {
        // Si el fragmento tiene subfragmentos, procesar recursivamente
        if (frag.fragmentos && Array.isArray(frag.fragmentos)) {
          const contenidoAnidado = this.procesarFragmentosAnidados(frag.fragmentos, nivel + 1);
          const estilo = this.config.mapeoEstilos[frag.estiloCaracter] || 
                        this.config.mapeoEstilos['[Ninguno]'];
          
          if (estilo && estilo.etiqueta) {
            return this.construirEtiqueta(contenidoAnidado, estilo, frag.estiloCaracter);
          }
          return contenidoAnidado;
        }
        
        // Sino, procesar como fragmento simple
        return this.procesarFragmento(frag);
      })
      .join('');
  }

  /**
   * Escapa caracteres especiales HTML
   * @param {string} texto - Texto a escapar
   * @returns {string} Texto escapado
   */
  escaparTexto(texto) {
    if (!this.config.escaparHTML) return texto;
    
    const mapa = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '\r\n': '<br/>',
      '\n': '<br/>',
      '\r': '<br/>'
    };
    
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\r\n/g, '<br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\r/g, '<br/>');
  }

  /**
   * Escapa caracteres en atributos HTML
   * @param {string} valor - Valor de atributo
   * @returns {string} Valor escapado
   */
  escaparAtributo(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Agrega un mapeo de estilo personalizado
   * @param {string} nombreEstilo - Nombre del estilo (ej: "TerminoGlosario")
   * @param {Object} config - Configuración de estilo
   */
  agregarEstilo(nombreEstilo, config) {
    this.config.mapeoEstilos[nombreEstilo] = {
      etiqueta: config.etiqueta,
      clase: config.clase || null,
      role: config.role || null,
      atributos: config.atributos || {}
    };
  }

  /**
   * Obtiene estilos activos
   * @returns {Object} Mapeo de estilos actual
   */
  obtenerEstilos() {
    return this.config.mapeoEstilos;
  }
}

module.exports = FragmentProcesador;
