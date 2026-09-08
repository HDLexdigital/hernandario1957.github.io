'use strict';

function _sanitizeSelector(styleName) {
    if (!styleName) return '';

    let sanitized = styleName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    sanitized = sanitized.toLowerCase();
    sanitized = sanitized.replace(/[\[\]()]/g, '');
    sanitized = sanitized.replace(/\s+/g, '-');
    sanitized = sanitized.replace(/[^a-z0-9-_]/g, '');

    if (/^\d/.test(sanitized)) {
        sanitized = 'estilo-' + sanitized;
    }

    return sanitized;
}

function indexSemanticMap(semanticMap) {
    const index = {};
    if (!semanticMap) return index;

    if (semanticMap.paragraphStyles) {
        for (const style of Object.values(semanticMap.paragraphStyles)) {
            const name = style?.metadata?.originalName;
            if (name) index[name] = style;
        }
    }
    if (semanticMap.characterStyles) {
        for (const style of Object.values(semanticMap.characterStyles)) {
            const name = style?.metadata?.originalName;
            if (name) index[name] = style;
        }
    }

    if (Array.isArray(semanticMap.styles)) {
        for (const style of semanticMap.styles) {
            const name = style?.originalName || style?.metadata?.originalName || style?.name;
            if (name) index[name] = style;
        }
    }

    if (!semanticMap.paragraphStyles && !semanticMap.characterStyles && !Array.isArray(semanticMap.styles)) {
        for (const [key, value] of Object.entries(semanticMap)) {
            if (key !== 'document' && key !== 'documentName' && key !== 'exportDate') {
                index[key] = value;
            }
        }
    }

    return index;
}

// Resolver ontológico requerido por compilarLexmotor
function resolveStyleName(styleName, strict = false, options = {}, context = {}) {
    const sanitized = _sanitizeSelector(styleName);
    return {
        tag: 'p',
        class: sanitized,
        resolvedTag: 'p',
        resolvedClass: sanitized
    };
}

module.exports = {
    _sanitizeSelector,
    indexSemanticMap,
    resolveStyleName
};