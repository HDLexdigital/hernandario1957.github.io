'use strict';

const fs = require('fs');
const path = require('path');

const STYLE_MODEL_PATH = path.join(__dirname, '..', '..', '..', 'plantillas', 'style-model.base.json');

function cargarStyleModel() {
    try {
        return JSON.parse(fs.readFileSync(STYLE_MODEL_PATH, 'utf8'));
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

module.exports = { generarCSSDesdeStyleModel, cargarStyleModel };