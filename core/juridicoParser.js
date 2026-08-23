/**
 * MÓDULO: juridicoParser.js
 * Detecta y estructura elementos jurídicos en documentos legales
 * 
 * ENTRADA: Array de tokens con .texto (pueden contener "Artículo 1.", "Título X", etc.)
 * SALIDA: Árbol jerárquico de elementos con metadatos jurídicos
 * 
 * Patrones detectados:
 *   - "Artículo 1" → { tipo: 'articulo', numero: 1 }
 *   - "Título I" → { tipo: 'titulo', numero: 'I', nivel: 'alto' }
 *   - "Capítulo X" → { tipo: 'capitulo', numero: 'X' }
 *   - "Parágrafo" → { tipo: 'paragrafo', numero: 1 }
 *   - "Inciso" → { tipo: 'inciso', numero: 'a' }
 */

class JuridicoParser {
  constructor(config = {}) {
    this.config = {
      detectarArticulos: config.detectarArticulos !== false,
      detectarTitulos: config.detectarTitulos !== false,
      detectarCapitulos: config.detectarCapitulos !== false,
      detectarParafos: config.detectarParafos !== false,
      detectarIncisos: config.detectarIncisos !== false,
      generarIDs: config.generarIDs !== false,
      idPrefix: config.idPrefix || 'doc',
      ...config
    };

    // Patrones regex para detección
    this.patrones = {
      articulo: /^articulo\s+(\d+)/i,
      titulo: /^t[ií]tulo\s+([IVX\d]+)/i,
      capitulo: /^cap[ií]tulo\s+([IVX\d]+)/i,
      paragrafo: /^p[aá]rrafo\s+(\d+)?/i,
      parafosimple: /^§\s*(\d+)?/,
      inciso: /^inciso\s+([a-zA-Z0-9]+)/i,
      transitorios: /^disposici[óo]n\s+transitoria/i,
      final: /^disposici[óo]n\s+final/i,
      derogatoria: /^disposici[óo]n\s+derogatoria/i,
    };

    this.elementosDetectados = [];
    this.estructura = [];
  }

  /**
   * MÉTODO PRINCIPAL: Analizar array de tokens
   * @param {Array} tokens - Array de tokens con propiedades .texto, .estilo
   * @returns {Object} { estructura: [], mapa: {}, metadatos: {} }
   */
  analizarTokens(tokens) {
    if (!Array.isArray(tokens)) {
      throw new Error('Los tokens deben ser un array');
    }

    this.elementosDetectados = [];
    this.estructura = [];
    const mapa = {}; // Mapa de IDs

    let nivelActual = 0;
    let articuloActual = null;
    let tituloActual = null;

    tokens.forEach((token, indice) => {
      const texto = (token.texto || '').trim();
      if (!texto) return;

      // Detectar tipo de elemento
      const elemento = this.detectarElemento(texto, token, indice);

      if (elemento) {
        // Actualizar contexto jerárquico
        if (elemento.tipo === 'titulo') {
          tituloActual = elemento;
          articuloActual = null;
          nivelActual = 1;
        } else if (elemento.tipo === 'articulo') {
          articuloActual = elemento;
          nivelActual = 2;
        }

        // Asociar con contexto
        elemento.tituloParent = tituloActual?.id;
        elemento.articuloParent = articuloActual?.id;
        elemento.nivel = nivelActual;
        elemento.indiceToken = indice;

        this.elementosDetectados.push(elemento);
        mapa[elemento.id] = elemento;
      }
    });

    // Construir estructura jerárquica
    this.estructura = this.construirEstructura(this.elementosDetectados);

    return {
      estructura: this.estructura,
      elementos: this.elementosDetectados,
      mapa: mapa,
      metadatos: this.generarMetadatos()
    };
  }

  /**
   * Detecta si un texto es un elemento jurídico específico
   * @param {string} texto - Texto a analizar
   * @param {Object} token - Token completo para contexto
   * @param {number} indice - Índice en el array
   * @returns {Object|null} Elemento detectado o null
   */
  detectarElemento(texto, token, indice) {
    // Probar cada patrón
    for (const [tipo, patron] of Object.entries(this.patrones)) {
      const match = texto.match(patron);
      if (match) {
        return this.construirElemento(tipo, match, token, indice);
      }
    }

    return null;
  }

  /**
   * Construye objeto de elemento jurídico
   * @param {string} tipo - Tipo detectado (articulo, titulo, etc.)
   * @param {Array} match - Resultado de regex.match()
   * @param {Object} token - Token original
   * @param {number} indice - Índice en array
   * @returns {Object} Elemento jurídico estructurado
   */
  construirElemento(tipo, match, token, indice) {
    const numero = match[1] || '';
    const id = this.config.generarIDs 
      ? `${this.config.idPrefix}-${tipo}-${numero || indice}`
      : null;

    return {
      id: id,
      tipo: tipo,
      numero: numero,
      numeroRomano: this.arabigaARomana(numero),
      textoCompleto: token.texto,
      estilo: token.estilo || null,
      indice: indice,
      atributos: {
        'id': id,
        'class': `elemento-juridico ${tipo}`,
        'role': this.obtenerRole(tipo),
        'data-tipo': tipo,
        'data-numero': numero,
        'data-indice': indice
      }
    };
  }

  /**
   * Obtiene el rol ARIA para cada tipo de elemento
   * @param {string} tipo - Tipo de elemento
   * @returns {string} Rol ARIA
   */
  obtenerRole(tipo) {
    const roles = {
      'articulo': 'article',
      'titulo': 'heading',
      'capitulo': 'doc-chapter',
      'paragrafo': 'doc-pagebreak',
      'inciso': 'doc-list-item',
      'transitorios': 'doc-part',
      'final': 'doc-conclusion',
      'derogatoria': 'doc-part'
    };

    return roles[tipo] || 'region';
  }

  /**
   * Construye árbol jerárquico a partir de elementos detectados
   * @param {Array} elementos - Elementos detectados
   * @returns {Array} Árbol jerárquico
   */
  construirEstructura(elementos) {
    const arbol = [];
    const pila = []; // Pila para mantener jerarquía

    elementos.forEach((elemento) => {
      // Determinar nivel en la jerarquía
      let nivel = this.obtenerNivelJerarquico(elemento.tipo);

      // Sacar de la pila elementos de igual o mayor nivel
      while (pila.length > 0 && pila[pila.length - 1].nivel >= nivel) {
        pila.pop();
      }

      // Asignar padre
      if (pila.length > 0) {
        elemento.padre = pila[pila.length - 1];
        if (!pila[pila.length - 1].hijos) {
          pila[pila.length - 1].hijos = [];
        }
        pila[pila.length - 1].hijos.push(elemento);
      } else {
        arbol.push(elemento);
      }

      // Agregar a pila
      pila.push({ ...elemento, nivel });
    });

    return arbol;
  }

  /**
   * Obtiene nivel jerárquico de un tipo de elemento
   * @param {string} tipo - Tipo de elemento
   * @returns {number} Nivel (menor = más alto en jerarquía)
   */
  obtenerNivelJerarquico(tipo) {
    const niveles = {
      'titulo': 1,
      'capitulo': 2,
      'articulo': 3,
      'paragrafo': 4,
      'inciso': 5,
      'transitorios': 1,
      'derogatoria': 1,
      'final': 1
    };

    return niveles[tipo] || 99;
  }

  /**
   * Convierte número arábigo a romano
   * @param {string} numero - Número a convertir
   * @returns {string} Número romano o número original
   */
  arabigaARomana(numero) {
    if (!numero || isNaN(numero)) return numero;

    const num = parseInt(numero, 10);
    if (num < 1 || num > 3999) return numero;

    const valores = [
      { valor: 1000, romano: 'M' },
      { valor: 900, romano: 'CM' },
      { valor: 500, romano: 'D' },
      { valor: 400, romano: 'CD' },
      { valor: 100, romano: 'C' },
      { valor: 90, romano: 'XC' },
      { valor: 50, romano: 'L' },
      { valor: 40, romano: 'XL' },
      { valor: 10, romano: 'X' },
      { valor: 9, romano: 'IX' },
      { valor: 5, romano: 'V' },
      { valor: 4, romano: 'IV' },
      { valor: 1, romano: 'I' }
    ];

    let romano = '';
    let resto = num;

    valores.forEach(({ valor, romano: r }) => {
      while (resto >= valor) {
        romano += r;
        resto -= valor;
      }
    });

    return romano;
  }

  /**
   * Genera metadatos sobre la estructura encontrada
   * @returns {Object} Metadatos
   */
  generarMetadatos() {
    const metadata = {
      totalElementos: this.elementosDetectados.length,
      porTipo: {},
      articulos: [],
      titulos: [],
      capitulos: [],
      tieneTransitorios: false,
      tieneDerogatoria: false,
      tieneFinal: false
    };

    this.elementosDetectados.forEach((elem) => {
      // Contar por tipo
      metadata.porTipo[elem.tipo] = (metadata.porTipo[elem.tipo] || 0) + 1;

      // Recolectar elementos principales
      if (elem.tipo === 'articulo') {
        metadata.articulos.push(elem.numero);
      } else if (elem.tipo === 'titulo') {
        metadata.titulos.push(elem.numero);
      } else if (elem.tipo === 'capitulo') {
        metadata.capitulos.push(elem.numero);
      }

      // Detectar secciones especiales
      if (elem.tipo === 'transitorios') metadata.tieneTransitorios = true;
      if (elem.tipo === 'derogatoria') metadata.tieneDerogatoria = true;
      if (elem.tipo === 'final') metadata.tieneFinal = true;
    });

    return metadata;
  }

  /**
   * Obtiene un elemento por su ID
   * @param {string} id - ID del elemento
   * @returns {Object|null} Elemento o null
   */
  obtenerElementoPorID(id) {
    return this.elementosDetectados.find(elem => elem.id === id) || null;
  }

  /**
   * Obtiene todos los artículos
   * @returns {Array} Array de elementos con tipo 'articulo'
   */
  obtenerArticulos() {
    return this.elementosDetectados.filter(elem => elem.tipo === 'articulo');
  }

  /**
   * Obtiene todos los títulos
   * @returns {Array} Array de elementos con tipo 'titulo'
   */
  obtenerTitulos() {
    return this.elementosDetectados.filter(elem => elem.tipo === 'titulo');
  }

  /**
   * Busca elementos por patrón de texto
   * @param {RegExp|string} patron - Patrón de búsqueda
   * @returns {Array} Elementos que coinciden
   */
  buscar(patron) {
    const regex = patron instanceof RegExp ? patron : new RegExp(patron, 'i');
    return this.elementosDetectados.filter(elem => 
      regex.test(elem.textoCompleto)
    );
  }
}

module.exports = JuridicoParser;
