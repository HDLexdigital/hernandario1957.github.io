'use strict';

const fs = require('fs');
const path = require('path');

const STYLE_MODEL_PATH = process.env.STYLE_MODEL_PATH || path.join(__dirname, 'assets', 'style-model.json');

function cargarStyleModel(rutaPersonalizada = null) {
    const ruta = rutaPersonalizada || STYLE_MODEL_PATH;
    try {
        if (fs.existsSync(ruta)) {
            return JSON.parse(fs.readFileSync(ruta, 'utf8'));
        }
        return null;
    } catch(e) {
        return null;
    }
}

function generarCSSDesdeStyleModel(styleModel) {
    let css = '/* CSS CANÓNICO LEXDIGITALHD */\n';
    css += '/* Basado en style-model.json */\n\n';
    
    const paragraphStyles = styleModel.paragraphStyles || {};
    
    for (const [id, estilo] of Object.entries(paragraphStyles)) {
        // Obtener el nombre original del estilo
        const nombreOriginal = estilo.metadata && estilo.metadata.originalName 
            ? estilo.metadata.originalName 
            : id;
        
        // Obtener propiedades RESUELTAS (las heredadas)
        const props = estilo.resolved || estilo.declared || {};
        
        // Convertir nombre a clase CSS
        const clase = '.' + nombreOriginal
            .toLowerCase()
            .replace(/\[/g, '')
            .replace(/\]/g, '')
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-|-$/g, '');
        
        css += clase + ' {\n';
        
        // Fuente
        if (props.appliedFont && props.appliedFont !== 'Default') {
            const fuenteLimpia = String(props.appliedFont).replace(/\s+/g, ' ').trim();
            css += '  font-family: "' + fuenteLimpia + '", sans-serif;\n';
        }
        
        // Tamaño
        if (props.pointSize && props.pointSize > 1 && props.pointSize < 100) {
            css += '  font-size: ' + props.pointSize + 'pt;\n';
        }
        
        // Peso de fuente
        if (props.fontStyle && String(props.fontStyle).includes('Bold')) {
            css += '  font-weight: bold;\n';
        }
        if (props.fontStyle && String(props.fontStyle).includes('Italic')) {
            css += '  font-style: italic;\n';
        }
        
        // Tracking
        if (props.tracking && props.tracking !== 0) {
            css += '  letter-spacing: ' + props.tracking + 'px;\n';
        }
        
        // Subrayado
        if (props.underline) {
            css += '  text-decoration: underline;\n';
        }
        
        // Tachado
        if (props.strikeThru) {
            css += '  text-decoration: line-through;\n';
        }
        
        css += '}\n\n';
    }
    
    return css;
}

/**
 * Genera reglas CSS a partir de un arreglo de párrafos/elementos con propiedades de estilo
 * Requerido por scripts como scripts/compilar_decreto.js del proyecto principal.
 */
function generarCSSDesdePropiedades(contenido) {
    if (!Array.isArray(contenido)) return '';
    const estilosProcesados = new Set();
    let css = '/* CSS GENERADO DINÁMICAMENTE DESDE PROPIEDADES */\n\n';

    for (const item of contenido) {
        const nombreEstilo = item.inDesignStyle || item.estilo;
        if (!nombreEstilo || estilosProcesados.has(nombreEstilo)) continue;
        estilosProcesados.add(nombreEstilo);

        const props = item.propiedades || item.propiedadesEstilo || {};
        const clase = '.' + String(nombreEstilo)
            .toLowerCase()
            .replace(/\[/g, '')
            .replace(/\]/g, '')
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-|-$/g, '');

        css += clase + ' {\n';

        if (props.appliedFont && props.appliedFont !== 'Default') {
            const fuenteLimpia = String(props.appliedFont).replace(/\s+/g, ' ').trim();
            css += '  font-family: "' + fuenteLimpia + '", sans-serif;\n';
        } else if (props.fontFamily) {
            css += '  font-family: "' + props.fontFamily + '", sans-serif;\n';
        }

        if (props.pointSize && props.pointSize > 1 && props.pointSize < 100) {
            css += '  font-size: ' + props.pointSize + 'pt;\n';
        }

        if (props.leading) {
            css += '  line-height: ' + props.leading + ';\n';
        }

        if (props.fontStyle && String(props.fontStyle).includes('Bold')) {
            css += '  font-weight: bold;\n';
        }
        if (props.fontStyle && String(props.fontStyle).includes('Italic')) {
            css += '  font-style: italic;\n';
        }

        if (props.tracking && props.tracking !== 0) {
            css += '  letter-spacing: ' + props.tracking + 'px;\n';
        }

        if (props.underline) {
            css += '  text-decoration: underline;\n';
        }

        if (props.strikeThru) {
            css += '  text-decoration: line-through;\n';
        }

        if (props.fillColor) {
            css += '  color: ' + props.fillColor + ';\n';
        }

        if (props.spaceBefore && props.spaceBefore !== '0pt') {
            css += '  margin-top: ' + props.spaceBefore + ';\n';
        }

        if (props.spaceAfter && props.spaceAfter !== '0pt') {
            css += '  margin-bottom: ' + props.spaceAfter + ';\n';
        }

        if (props.firstLineIndent && props.firstLineIndent !== '0pt') {
            css += '  text-indent: ' + props.firstLineIndent + ';\n';
        }

        css += '}\n\n';
    }

    return css;
}

module.exports = {
    generarCSSDesdeStyleModel,
    generarCSSDesdePropiedades,
    cargarStyleModel
};