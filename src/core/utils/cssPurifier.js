'use strict';

/**
 * CSS PURIFIER COMPLETO
 * Convierte CSS crudo de InDesign en CSS canónico LexDigitalHD
 * Preserva TODAS las propiedades visuales con fidelidad
 */

function purgarCSSInDesign(cssCrudo, styleModel = null) {
    if (typeof cssCrudo !== 'string' || cssCrudo.trim() === '') {
        return '';
    }
    
    let cssLimpio = cssCrudo;
    
    // 1. Eliminar valores inválidos (1851876449pt es un bug de InDesign)
    cssLimpio = cssLimpio.replace(/font-size:\s*1851876449pt;/gi, '');
    
    // 2. Corregir fuentes 'undefined'
    cssLimpio = cssLimpio.replace(/font-family:\s*['"]undefined['"]/gi, "font-family: 'Liberation Serif'");
    
    // 3. Corregir colores comentados de InDesign
    cssLimpio = cssLimpio.replace(/color:\s*\/\*\s*InDesign Color:\s*([^*]+)\*\//gi, 'color: "$1";');
    
    // 4. Corregir selectores especiales
    cssLimpio = cssLimpio.replace(/\.05-Hiperlink_char/g, '.C05_HIPERLINK_CHAR');
    cssLimpio = cssLimpio.replace(/\.P-rrafo-b-sico/g, '.P01_PARRAFO_BASICO');
    
    // 5. Corregir encoding
    cssLimpio = cssLimpio
        .replace(/Ã“/g, 'Ó')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã /g, 'Á')
        .replace(/Ãš/g, 'Ú')
        .replace(/Ã‘/g, 'Ñ')
        .replace(/Ã©/g, 'é')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã¼/g, 'ü');
    
    // 6. Si hay styleModel, usar sus propiedades EXACTAS
    if (styleModel && styleModel.estilosParrafo) {
        cssLimpio = aplicarStyleModel(cssLimpio, styleModel);
    }
    
    return cssLimpio;
}

/**
 * Aplica el modelo de estilos EXACTO al CSS
 */
function aplicarStyleModel(css, styleModel) {
    let cssResultado = '/* CSS CANÓNICO LEXDIGITALHD */\n';
    cssResultado += '/* Basado en style-model.json */\n\n';
    
    for (const [nombreEstilo, props] of Object.entries(styleModel.estilosParrafo || {})) {
        const clase = '.' + nombreEstilo.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        cssResultado += clase + ' {\n';
        
        // Fuente
        if (props.fuente && props.fuente !== 'Default') {
            cssResultado += '  font-family: "' + props.fuente + '", sans-serif;\n';
        }
        
        // Tamaño (solo si es válido)
        if (props.tamano && props.tamano > 1 && props.tamano < 100) {
            cssResultado += '  font-size: ' + props.tamano + 'pt;\n';
        }
        
        // Peso de fuente
        if (props.estiloFuente && props.estiloFuente.includes('Bold')) {
            cssResultado += '  font-weight: bold;\n';
        }
        
        // Color
        if (props.color && props.color !== 'Black' && props.color !== '[Ninguno]') {
            cssResultado += '  color: "' + props.color + '";\n';
        }
        
        // Alineación
        if (props.alineacion) {
            const alin = String(props.alineacion);
            if (alin.includes('CENTER')) cssResultado += '  text-align: center;\n';
            else if (alin.includes('JUSTIF')) cssResultado += '  text-align: justify;\n';
            else if (alin.includes('LEFT')) cssResultado += '  text-align: left;\n';
            else if (alin.includes('RIGHT')) cssResultado += '  text-align: right;\n';
        }
        
        // Mayúsculas
        if (props.mayusculas && String(props.mayusculas).includes('CAP')) {
            cssResultado += '  text-transform: uppercase;\n';
        }
        
        // Márgenes
        if (props.espacioAntes) cssResultado += '  margin-top: ' + props.espacioAntes + 'mm;\n';
        if (props.espacioDespues) cssResultado += '  margin-bottom: ' + props.espacioDespues + 'mm;\n';
        
        // Sangrías
        if (props.sangriaIzquierda) cssResultado += '  margin-left: ' + props.sangriaIzquierda + 'mm;\n';
        if (props.sangriaPrimeraLinea) cssResultado += '  text-indent: ' + props.sangriaPrimeraLinea + 'mm;\n';
        
        // Filete inferior
        if (props.fileteInferior) {
            cssResultado += '  border-bottom: 2pt dotted;\n';
        }
        
        // Sombreado
        if (props.sombreado) {
            cssResultado += '  background-color: "' + props.sombreado + '";\n';
        }
        
        cssResultado += '}\n\n';
    }
    
    return cssResultado;
}

module.exports = { purgarCSSInDesign, aplicarStyleModel };