'use strict';

const fs = require('fs');
const path = require('path');
const { resolverTipoBase, tipoAEtiqueta } = require('../../adaptadores/TypeResolver');
const { purgarCSSInDesign } = require('../utils/cssPurifier');

const STYLE_MODEL_PATH = path.join(__dirname, '..', '..', '..', 'plantillas', 'style-model.base.json');

function cargarStyleModel() {
    try {
        if (fs.existsSync(STYLE_MODEL_PATH)) {
            return JSON.parse(fs.readFileSync(STYLE_MODEL_PATH, 'utf8'));
        }
    } catch(e) {
        console.warn('No se pudo cargar style-model.json:', e.message);
    }
    return null;
}

function compilarLexmotor(ast, deps = {}) {
    if (!ast) return { ast: null, astEnriquecido: null };
    
    const astNormalizado = JSON.parse(JSON.stringify(ast));
    const styleModel = deps.styleModel || cargarStyleModel();
    
    const contenido = astNormalizado.contenido || astNormalizado;
    const elementos = Array.isArray(contenido) ? contenido : [];
    
    // Generar CSS desde el style-model (con claves CORRECTAS)
    let cssGenerado = '';
    
    if (styleModel && styleModel.paragraphStyles) {
        cssGenerado = generarCSSDesdeStyleModel(styleModel);
    } else {
        cssGenerado = generarCSSDesdeContenido(elementos);
    }
    
    // Purificar CSS
    cssGenerado = purgarCSSInDesign(cssGenerado, styleModel);
    
    // Generar XHTML
    const xhtml = generarXHTML(elementos, cssGenerado, astNormalizado.titulo || 'Documento');
    
    return {
        xhtml: xhtml,
        css: cssGenerado,
        ast: astNormalizado,
        styleModel: styleModel,
        metadatos: {
            totalElementos: elementos.length,
            cssBytes: cssGenerado.length,
            xhtmlBytes: xhtml.length,
            timestamp: new Date().toISOString()
        }
    };
}

function generarCSSDesdeStyleModel(styleModel) {
    let css = '/* CSS CANÓNICO LEXDIGITALHD */\n';
    css += '/* Basado en style-model.json */\n\n';
    
    // CORRECTO: usar paragraphStyles
    const estilosParrafo = styleModel.paragraphStyles || {};
    
    for (const [nombre, props] of Object.entries(estilosParrafo)) {
        const clase = '.' + nombre.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        css += clase + ' {\n';
        
        if (props.fuente && props.fuente !== 'Default' && props.fuente !== 'undefined') {
            css += '  font-family: "' + props.fuente + '", sans-serif;\n';
        }
        if (props.tamano && props.tamano > 1 && props.tamano < 100) {
            css += '  font-size: ' + props.tamano + 'pt;\n';
        }
        if (props.estiloFuente && String(props.estiloFuente).includes('Bold')) {
            css += '  font-weight: bold;\n';
        }
        if (props.color && props.color !== 'Black' && props.color !== '[Ninguno]') {
            css += '  color: "' + props.color + '";\n';
        }
        if (props.alineacion) {
            const alin = String(props.alineacion);
            if (alin.includes('CENTER')) css += '  text-align: center;\n';
            else if (alin.includes('JUSTIF')) css += '  text-align: justify;\n';
        }
        if (props.mayusculas && String(props.mayusculas).includes('CAP')) {
            css += '  text-transform: uppercase;\n';
        }
        if (props.espacioAntes) css += '  margin-top: ' + props.espacioAntes + 'mm;\n';
        if (props.espacioDespues) css += '  margin-bottom: ' + props.espacioDespues + 'mm;\n';
        if (props.sangriaIzquierda) css += '  margin-left: ' + props.sangriaIzquierda + 'mm;\n';
        if (props.fileteInferior) css += '  border-bottom: 2pt dotted;\n';
        if (props.sombreado) css += '  background-color: "' + props.sombreado + '";\n';
        
        css += '}\n\n';
    }
    
    return css;
}

function generarCSSDesdeContenido(elementos) {
    const estilosUnicos = new Map();
    
    for (const elem of elementos) {
        const estilo = elem.inDesignStyle || elem.estilo || 'P01_BODY_BASE';
        if (!estilosUnicos.has(estilo)) {
            estilosUnicos.set(estilo, elem.propiedades || elem.estiloParrafo || {});
        }
    }
    
    let css = '/* CSS GENERADO */\n\n';
    
    for (const [estilo, props] of estilosUnicos) {
        const clase = '.' + estilo.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        css += clase + ' {\n';
        if (props.fuente) css += '  font-family: "' + props.fuente + '", sans-serif;\n';
        if (props.tamano && props.tamano < 100) css += '  font-size: ' + props.tamano + 'pt;\n';
        if (props.color && props.color !== 'Black') css += '  color: "' + props.color + '";\n';
        css += '}\n\n';
    }
    
    return css;
}

function generarXHTML(elementos, cssGenerado, titulo) {
    let xhtml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xhtml += '<!DOCTYPE html>\n';
    xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es-CO" lang="es-CO">\n';
    xhtml += '<head>\n';
    xhtml += '  <meta charset="UTF-8" />\n';
    xhtml += '  <title>' + escapeHTML(titulo) + '</title>\n';
    xhtml += '  <style>\n' + cssGenerado + '  </style>\n';
    xhtml += '</head>\n';
    xhtml += '<body>\n';
    
    for (const elem of elementos) {
        const texto = elem.texto || elem.texto_completo || '';
        if (!texto || !texto.trim()) continue;
        
        const estilo = elem.inDesignStyle || elem.estilo || 'P01_BODY_BASE';
        const clase = estilo.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const tipo = resolverTipoBase(estilo) || 'parrafo';
        const etiqueta = tipoAEtiqueta(tipo);
        
        xhtml += '  <' + etiqueta + ' class="' + clase + '">' + escapeHTML(texto) + '</' + etiqueta + '>\n';
    }
    
    xhtml += '</body>\n';
    xhtml += '</html>';
    
    return xhtml;
}

function escapeHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

module.exports = { compilarLexmotor };