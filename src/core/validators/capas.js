'use strict';

// Validadores por capas E18-E26
// Cada validador recibe un nodo o documento y devuelve { ok, errores }

function E18_documentoValido(doc) {
    const errores = [];
    if (!doc || typeof doc !== 'object') errores.push('Documento no es objeto');
    if (!doc.meta) errores.push('Falta meta');
    if (!doc.styleDictionary) errores.push('Falta styleDictionary');
    return { ok: errores.length === 0, errores };
}

function E19_sinBOM(doc) {
    const errores = [];
    const texto = JSON.stringify(doc);
    if (texto.charCodeAt(0) === 0xFEFF) errores.push('Documento contiene BOM');
    return { ok: errores.length === 0, errores };
}

function E20_metaCompleta(doc) {
    const errores = [];
    const meta = doc.meta || {};
    if (!meta.model) errores.push('meta.model ausente');
    if (!meta.source) errores.push('meta.source ausente');
    return { ok: errores.length === 0, errores };
}

function E21_estilosUnicos(doc) {
    const errores = [];
    const estilos = doc.styleDictionary || {};
    const nombres = new Set();
    for (const key of Object.keys(estilos)) {
        const nombre = estilos[key].name;
        if (nombres.has(nombre)) errores.push('Estilo duplicado: ' + nombre);
        nombres.add(nombre);
    }
    return { ok: errores.length === 0, errores };
}

function E22_nodosConTipo(doc) {
    const errores = [];
    const nodos = doc.content || doc.nodes || [];
    nodos.forEach((n, i) => {
        if (!n.type) errores.push('Nodo ' + i + ' sin type');
    });
    return { ok: errores.length === 0, errores };
}

function E23_clasesCSSValidas(doc) {
    const errores = [];
    const nodos = doc.content || doc.nodes || [];
    nodos.forEach((n, i) => {
        if (n.class && /[A-Z_\s]/.test(n.class)) {
            errores.push('Nodo ' + i + ' clase no kebab-case: ' + n.class);
        }
    });
    return { ok: errores.length === 0, errores };
}

function E24_parrafosCerrados(doc) {
    const errores = [];
    const nodos = doc.content || doc.nodes || [];
    nodos.forEach((n, i) => {
        if (n.html && n.html.includes('<p') && !n.html.includes('</p>')) {
            errores.push('Nodo ' + i + ' tiene <p> sin cerrar');
        }
    });
    return { ok: errores.length === 0, errores };
}

function E25_sinAnidamientoP(doc) {
    const errores = [];
    const nodos = doc.content || doc.nodes || [];
    nodos.forEach((n, i) => {
        if (n.html && /<p[^>]*>\s*<p/.test(n.html)) {
            errores.push('Nodo ' + i + ' tiene <p> anidado');
        }
    });
    return { ok: errores.length === 0, errores };
}

function E26_utf8Puro(doc) {
    const errores = [];
    const texto = JSON.stringify(doc);
    if (texto.includes('\\u0000')) errores.push('Documento contiene caracteres nulos');
    return { ok: errores.length === 0, errores };
}

const VALIDADORES = {
    E18: E18_documentoValido,
    E19: E19_sinBOM,
    E20: E20_metaCompleta,
    E21: E21_estilosUnicos,
    E22: E22_nodosConTipo,
    E23: E23_clasesCSSValidas,
    E24: E24_parrafosCerrados,
    E25: E25_sinAnidamientoP,
    E26: E26_utf8Puro
};

function validarTodo(doc) {
    const resultados = {};
    let ok = true;
    for (const [id, fn] of Object.entries(VALIDADORES)) {
        const r = fn(doc);
        resultados[id] = r;
        if (!r.ok) ok = false;
    }
    return { ok, resultados };
}

module.exports = { VALIDADORES, validarTodo };
