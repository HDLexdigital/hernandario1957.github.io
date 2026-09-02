'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// PATRONES ORIGINALES (FALLBACK)
// Estos se usan si no se puede cargar el JSON externo.
// ============================================================================
const PATRONES_INTERNOS = [
  {
    nombre: 'preambulo',
    regex: /^(PREÁMBULO|PREAMBULO|Preámbulo|Preambulo)\b/,
    tipo: 'preambulo',
    epubType: 'preamble',
    nivelHtml: 2,
    ariaRole: 'heading'
  },
  {
    nombre: 'titulo_parte',
    regex: /^(TÍTULO|TITULO|Parte|PARTE)\s+[IVXLC]+\b/,
    tipo: 'titulo_parte',
    epubType: 'part',
    nivelHtml: 1,
    ariaRole: 'heading'
  },
  {
    nombre: 'titulo_capitulo',
    regex: /^(CAPÍTULO|CAPITULO|Capítulo|Capitulo)\s+\d+/,
    tipo: 'titulo_capitulo',
    epubType: 'chapter',
    nivelHtml: 2,
    ariaRole: 'heading'
  },
  {
    nombre: 'articulo',
    regex: /^Art[íi]culo\s+\d+/,
    tipo: 'articulo',
    epubType: 'article',
    nivelHtml: 3,
    ariaRole: 'article'
  },
  {
    nombre: 'inciso',
    regex: /^(INCISO|Inciso)\s+[A-Za-z]/,
    tipo: 'inciso',
    epubType: null,
    nivelHtml: 4,
    ariaRole: 'listitem'
  },
  {
    nombre: 'parrafo_generico',
    regex: /^(?!.*(?:Art[íi]culo|CAPÍTULO|CAPITULO|TÍTULO|TITULO|PREÁMBULO|PREAMBULO|INCISO|Inciso)).+/,
    tipo: 'parrafo',
    epubType: null,
    nivelHtml: null,
    ariaRole: null
  }
];

// ============================================================================
// CARGA DE PATRONES EXTERNOS CON FALLBACK
// ============================================================================
function cargarPatrones() {
  const rutaConfig = path.join(__dirname, '..', '..', 'config', 'grep-patterns.json');
  
  try {
    if (fs.existsSync(rutaConfig)) {
      const raw = fs.readFileSync(rutaConfig, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.patrones) && data.patrones.length > 0) {
        // Convertir regex de string a RegExp
        return data.patrones.map(p => ({
          ...p,
          regex: new RegExp(p.regex)
        }));
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudieron cargar patrones externos, usando internos:', err.message);
  }
  return PATRONES_INTERNOS;
}

const patronesActivos = cargarPatrones();

// ============================================================================
// FUNCIÓN PRINCIPAL (CONTRATO INALTERADO)
// ============================================================================
function evaluarTokenConGrep(texto) {
  // Acepta string o objeto con propiedad texto
  const contenido = typeof texto === 'string' ? texto : (texto.texto || texto.text || '');
  
  for (const patron of patronesActivos) {
    if (patron.regex.test(contenido)) {
      return {
        tipo: patron.tipo,
        epubType: patron.epubType,
        nivelHtml: patron.nivelHtml,
        ariaRole: patron.ariaRole
      };
    }
  }
  
  // Si ningún patrón coincide, devolver parrafo por defecto
  return {
    tipo: 'parrafo',
    epubType: null,
    nivelHtml: null,
    ariaRole: null
  };
}

// ============================================================================
// EXPORTACIÓN PARA NODE.JS
// ============================================================================
module.exports = {
  evaluarTokenConGrep,
  _test: {
    patronesActivos,
    cargarPatrones
  }
};