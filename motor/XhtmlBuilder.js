'use strict';

class XhtmlBuilder {
  constructor(config = {}) {
    this.config = {
      // Ruta por defecto flexible; puedes cambiarla a 'assets/lexcodex.css' si lo prefieres para EPUB
      rutaCSS: config.rutaCSS || 'file:///H:/LexCodex/salidas/assets/lexcodex.css',
      idioma: config.idioma || 'es',
      ...config
    };
  }

  construir(metadatos, eventosSemanticos, fragmentProcessor) {
    let html = '<!DOCTYPE html>\n';
    html += `<html lang="${this.config.idioma}" xmlns="http://www.w3.org/1999/xhtml">\n`;
    html += '<head>\n';
    
    html += '    <meta charset="UTF-8" />\n';
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
    html += `    <title>${this.escaparXML(metadatos.titulo)}</title>\n`;
    html += `    <link rel="stylesheet" href="${this.config.rutaCSS}" />\n`;
    
    html += '</head>\n';
    html += '<body>\n';
    html += '    <main role="main" aria-label="Texto Principal de la Constitución Política de Colombia">\n';

    let seccionAbierta = false;

    for (const ev of eventosSemanticos) {
      if (ev.tipo === 'APERTURA_CONTENEDOR') {
        if (ev.tag === 'section') {
            const attrs = Object.entries(ev.atributos || {}).map(([k, v]) => ` ${k}="${v}"`).join('');
            html += `        <${ev.tag}${attrs}>\n`;
            seccionAbierta = true;
        }
      } else if (ev.tipo === 'CIERRE_CONTENEDOR') {
        if (ev.tag === 'section') {
            html += `        </${ev.tag}>\n`;
            seccionAbierta = false;
        }
      } else if (ev.tipo === 'ELEMENTO_PARRAFO') {
        
        let contenidoInline = fragmentProcessor.procesar(ev.parrafo.fragmentos);

        // Limpieza de fugas de texto sobrantes al final del párrafo
        contenidoInline = contenidoInline.replace(/\s*(?:Artículo|Art\.)\s+\d+[A-Za-z]?\.?\s*$/i, '');

        let tag = ev.reglaMapeo?.etiqueta || 'p';
        let clase = ev.reglaMapeo?.clase ? ev.reglaMapeo.clase : '';
        let extraAttrs = '';

        // Inyectar ID al H2 de la sección si está activa
        if (tag === 'h2' && seccionAbierta) {
            extraAttrs = ` id="titulo-i"`;
        }

        // Reconstrucción milimétrica del Artículo como etiqueta <article> y sus estilos
        const artMatch = contenidoInline.match(/^(Artículo\s+(\d+[A-Za-z]?)\.)(.*)/i);
        
        if (artMatch) {
            tag = 'article';
            clase = 'p01-body-first parrafo-justificado'; 
            const artId = `art-${artMatch[2].toLowerCase()}`;
            extraAttrs = ` aria-labelledby="${artId}"`;
            
            const textoRestante = artMatch[3].trim();
            contenidoInline = `<strong><span class="negrita-resaltado" id="${artId}">${artMatch[1]}</span></strong><strong><span class="c01-bold"> </span></strong>${textoRestante}`;
        }

        const role = ev.reglaMapeo?.role ? ` role="${ev.reglaMapeo.role}"` : '';
        const classAttr = clase ? ` class="${clase}"` : '';
        
        // Evitamos escapar los <br/> recuperados
        contenidoInline = contenidoInline.replace(/&lt;br\/&gt;/g, '<br/>');

        html += `        <${tag}${classAttr}${role}${extraAttrs}>${contenidoInline}</${tag}>\n`;
      }
    }

    html += '    </main>\n';
    html += '</body>\n';
    html += '</html>';

    return html;
  }

  escaparXML(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

module.exports = XhtmlBuilder;