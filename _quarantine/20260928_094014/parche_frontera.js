const fs = require('fs');
const path = require('path');

const basePath = '/home/donache/hernandario1957.github.io';
const adapterPath = path.join(basePath, 'src/adaptadores/InDesignAdapter.js');
const semanticPath = path.join(basePath, 'src/adaptadores/SemanticResolver.js');

function replaceFunction(code, funcName, newFunc) {
    const startIdx = code.indexOf(`function ${funcName}(`);
    if (startIdx === -1) return code;
    let openBraces = 0, endIdx = -1, started = false;
    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') { openBraces++; started = true; }
        if (code[i] === '}') { openBraces--; }
        if (started && openBraces === 0) { endIdx = i + 1; break; }
    }
    return endIdx !== -1 ? code.substring(0, startIdx) + newFunc + code.substring(endIdx) : code;
}

try {
    let adapterCode = fs.readFileSync(adapterPath, 'utf8');
    
    const limpiarNew = `function limpiarTexto(texto) {
    if (!texto) return '';
    return texto.replace(/\\uFEFF/g, '');
}`;

    const duplicadosNew = `function eliminarDuplicados(texto) {
    return texto;
}`;

    adapterCode = replaceFunction(adapterCode, 'limpiarTexto', limpiarNew);
    adapterCode = replaceFunction(adapterCode, 'eliminarDuplicados', duplicadosNew);
    fs.writeFileSync(adapterPath, adapterCode);
    console.log('✅ InDesignAdapter.js: Mutación de texto neutralizada.');

    let semanticCode = fs.readFileSync(semanticPath, 'utf8');
    if (!semanticCode.includes("require('./TypeResolver')")) {
        semanticCode = semanticCode.replace("'use strict';", "'use strict';\nconst { resolverTipoBase, tipoAEtiqueta } = require('./TypeResolver');");
    }
    
    const resolveNew = `function resolveStyleName(styleName, strict = false, options = {}, context = {}) {
    const sanitized = _sanitizeSelector(styleName);
    const tipoSemantico = resolverTipoBase(styleName);
    const tagFinal = tipoSemantico ? tipoAEtiqueta(tipoSemantico) : 'p';
    return {
        tag: tagFinal,
        class: sanitized,
        resolvedTag: tagFinal,
        resolvedClass: sanitized
    };
}`;

    semanticCode = replaceFunction(semanticCode, 'resolveStyleName', resolveNew);
    fs.writeFileSync(semanticPath, semanticCode);
    console.log('✅ SemanticResolver.js: Puente semántico conectado.');
} catch (error) {
    console.error('❌ Error aplicando el parche:', error.message);
}
