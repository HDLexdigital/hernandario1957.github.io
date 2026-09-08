'use strict';

class FragmentProcessor {
  constructor(reglasCaracter = {}) {
    this.reglas = reglasCaracter;
  }

  procesar(fragmentos) {
    if (!fragmentos || !Array.isArray(fragmentos)) return '';

    return fragmentos.map(frag => {
      const textoEscapado = this.escaparXML(frag.texto);
      
      // SOLUCIÓN: Normalizar espacios y guiones bajos a guiones medios (ej. "Negrita Resaltado" -> "negrita-resaltado")
      const estiloNorm = frag.estiloCaracter.toLowerCase().replace(/[_\s]+/g, '-');
      const regla = this.reglas[estiloNorm] || this.reglas[frag.estiloCaracter.toLowerCase()];

      if (regla) {
        const attrStr = regla.atributos 
          ? Object.entries(regla.atributos).map(([k, v]) => ` ${k}="${v}"`).join('')
          : '';
        const claseStr = regla.clase ? ` class="${regla.clase}"` : '';
        return `<${regla.etiqueta}${claseStr}${attrStr}>${textoEscapado}</${regla.etiqueta}>`;
      }

      if (frag.formatoDirecto?.negrita) {
        return `<strong>${textoEscapado}</strong>`;
      }

      return textoEscapado;
    }).join('');
  }

  escaparXML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = FragmentProcessor;