/**
 * Capa Anticorrupción (E10) - InDesign Adapter
 * Versión corregida para soportar body.stories o body array
 */

'use strict';
const { resolverTipoBase } = require('./TypeResolver');
const { TIPOS_VALIDOS } = require('../core/constants/tiposValidos');
const { reconciliarFronterasFragmentos } = require('./reconciliadorFronteras');
const { resolverPresentation } = require('./PresentationResolver');

// ============================================================================
// LIMPIEZA DE TEXTO CENTRALIZADA
// ============================================================================
function limpiarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/\uFEFF/g, '')                         // BOM
        .replace(/\r?\n/g, ' ')                         // saltos de línea
        .replace(/[ \t]+/g, ' ')                        // múltiples espacios
        .trim();
}

// ============================================================================
// ELIMINACIÓN DE DUPLICADOS COMUNES
// ============================================================================
function eliminarDuplicados(texto) {
    let limpio = texto;

    // X(X)
    limpio = limpio.replace(/^(.+?)\s*\(\s*\1\s*\)\s*(.*)$/, '$1 $2');
    // X. .(X)
    limpio = limpio.replace(/^(.+?)\.\s*\(\s*\1\s*\)\s*(.*)$/, '$1 $2');
    // X()X
    limpio = limpio.replace(/^(.+?)\(\)\s*\1\s*(.*)$/, '$1 $2');

    return limpio.replace(/[ \t]+/g, ' ').trim();
}

function adaptarInDesign({ jsonCrudo, semanticMap }) {
    if (!jsonCrudo || typeof jsonCrudo !== 'object') {
        throw new TypeError("jsonCrudo debe ser un objeto válido");
    }

    // =========================================================================
    // 1. DETECCIÓN DE DIALECTO Y NORMALIZACIÓN DE ESTRUCTURA
    // =========================================================================
    let ast = JSON.parse(JSON.stringify(jsonCrudo));

    // Si el AST tiene 'body' como array de historias (estructura real), aplanar
    if (Array.isArray(ast.body)) {
        let parrafos = [];
        ast.body.forEach(story => {
            if (story && Array.isArray(story.children)) {
                parrafos = parrafos.concat(story.children);
            }
        });
        ast.contenido = parrafos;
    }

    // Si hay 'stories' en el raíz (otro dialecto)
    if (ast.stories && Array.isArray(ast.stories)) {
        let parrafos = [];
        ast.stories.forEach(story => {
            if (story.children && Array.isArray(story.children)) {
                parrafos = parrafos.concat(story.children);
            }
        });
        ast.contenido = parrafos;
    }

    // Normalización de tokens si existen
    if (Array.isArray(ast.tokens)) {
        ast.contenido = ast.tokens.map((token) => {
            // Mapeo básico de tokens a párrafos
            const nodo = {
                tipo: token.tipo || 'parrafo',
                inDesignStyle: token.estilo_indesign || token.estilo || '',
                estiloParrafo: token.estilo_indesign || token.estilo || '',
                tipoNodo: 'paragraph',
                texto: token.texto_completo || token.texto_limpio || token.texto || ''
            };
            return nodo;
        });
        delete ast.tokens;
    }

    // =========================================================================
    // 2. CONSTRUCCIÓN DE PUENTE DE ESTILOS (Style Bridge)
    // =========================================================================
    const semMap = semanticMap ? JSON.parse(JSON.stringify(semanticMap)) : { styles: [] };
    const styleBridge = {};
    const diagnostics = {
        valid: true,
        warnings: [],
        unmappedParagraphStyles: [],
        unmappedCharacterStyles: []
    };

    const mappedParagraphs = new Set();
    const mappedCharacters = new Set();

    if (semMap.styles && Array.isArray(semMap.styles)) {
        semMap.styles.forEach(style => {
            const name = style.originalName;
            const type = style.type;
            if (name && style.exportTagging && style.exportTagging.epub) {
                styleBridge[name] = {
                    className: style.exportTagging.epub.className || null,
                    tag: style.exportTagging.epub.tag || null,
                    presentation: style.presentation || null
                };
                if (type === 'paragraph') mappedParagraphs.add(name);
                if (type === 'character') mappedCharacters.add(name);
            }
        });
    }

    // =========================================================================
    // 3. PROCESAMIENTO RECURSIVO DE NODOS
    // =========================================================================
    function procesarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        // --- Determinar si es carácter ---
        const esCharacter = nodo.tipoNodo === 'character' || nodo.tipo === 'texto' || nodo.estiloCaracter;

        // --- Extracción de texto desde children (si los hay) ---
        if (Array.isArray(nodo.children) && nodo.children.length > 0) {
            const textos = nodo.children
                .filter(child => child.type === 'text' || child.text !== undefined)
                .map(child => limpiarTexto(child.text || ''))
                .filter(text => text !== '');

            if (textos.length > 0) {
                nodo.texto = textos.join(' ');
            } else {
                nodo.texto = '';
            }
        }

        // Si no hay texto definido todavía, buscar en propiedades directas
        if (!nodo.texto) {
            const textoCrudo = nodo.texto_completo ?? nodo.texto_limpio ?? nodo.textContent ?? nodo.contents ?? '';
            nodo.texto = limpiarTexto(textoCrudo);
        }

        // --- Limpieza adicional y eliminación de duplicados ---
        nodo.texto = eliminarDuplicados(nodo.texto);

        // Si tras limpiar queda vacío, marcar como VACÍO para filtrar después
        if (nodo.texto === '') {
            nodo.texto = '[VACÍO]';
        }

        // --- Tipo de nodo ---
        if (!nodo.tipo) {
            nodo.tipo = esCharacter ? 'texto' : 'parrafo';
        }
        nodo.tipoNodo = esCharacter ? 'character' : 'paragraph';

        // --- Descenso recursivo sobre contenido ---
        if (Array.isArray(nodo.contenido)) {
            nodo.contenido.forEach(procesarNodo);
        }

        // --- Reconciliación de fragmentos (si existe) ---
        const nodoReconciliado = reconciliarFronterasFragmentos(nodo);
        Object.assign(nodo, nodoReconciliado);

        // --- Identificación de estilo ---
        if (nodo.tipoNodo === 'paragraph') {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloParrafo || nodo.style || '[Ninguno]';
            const estiloParaPuente = nodo.inDesignStyle;
            if (estiloParaPuente && estiloParaPuente !== '[Ninguno]' && !mappedParagraphs.has(estiloParaPuente)) {
                diagnostics.unmappedParagraphStyles.push(estiloParaPuente);
            }
            if (!nodo.tipo || nodo.tipo === 'parrafo') {
                const tipoSemantico = resolverTipoBase(estiloParaPuente);
                if (tipoSemantico) nodo.tipo = tipoSemantico;
            }
        } else {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloCaracter || '[Ninguno]';
            const estiloParaPuente = nodo.inDesignStyle;
            if (estiloParaPuente && estiloParaPuente !== '[Ninguno]' && !mappedCharacters.has(estiloParaPuente)) {
                diagnostics.unmappedCharacterStyles.push(estiloParaPuente);
            }
        }

        // --- Inyección de clase y tag desde puente ---
        const estiloFinal = nodo.inDesignStyle;
        if (estiloFinal && styleBridge[estiloFinal]) {
            const puente = styleBridge[estiloFinal];
            if (puente.className) nodo.resolvedClass = puente.className;
            if (puente.tag) nodo.resolvedTag = puente.tag;
            const resolvedPresentation = resolverPresentation(puente.presentation);
            if (Object.keys(resolvedPresentation).length > 0) {
                nodo.resolvedPresentation = resolvedPresentation;
            }
        }

        if (!nodo.resolvedTag) {
            nodo.resolvedTag = nodo.tipoNodo === 'paragraph' ? 'p' : 'span';
        }
    }

    // =========================================================================
    // 4. PROCESAR RAÍCES
    // =========================================================================
    let raizIterar = [];
    if (Array.isArray(ast.contenido)) {
        raizIterar = ast.contenido;
    } else if (Array.isArray(ast.body)) {
        raizIterar = ast.contenido || [];
    } else {
        raizIterar = [ast];
    }

    let nodosLimpios = [];
    raizIterar.forEach(nodoBase => {
        procesarNodo(nodoBase);
        // Filtrar párrafos vacíos
        if (nodoBase.tipoNodo === 'paragraph' && nodoBase.texto === '[VACÍO]') {
            return;
        }
        nodosLimpios.push(nodoBase);
    });

    ast.contenido = nodosLimpios;

    // Actualizar diagnostics
    diagnostics.unmappedParagraphStyles = Array.from(new Set(diagnostics.unmappedParagraphStyles));
    diagnostics.unmappedCharacterStyles = Array.from(new Set(diagnostics.unmappedCharacterStyles));
    diagnostics.warnings = [
        ...diagnostics.unmappedParagraphStyles.map(s => `Estilo de párrafo no mapeado: ${s}`),
        ...diagnostics.unmappedCharacterStyles.map(s => `Estilo de carácter no mapeado: ${s}`)
    ];

    console.log('[FRONTERA 1: ADAPTADOR OUT]', {
        nodosRaiz: ast.contenido ? ast.contenido.length : 0,
        primerNodoTieneFragmentos: ast.contenido && ast.contenido[0] ? Array.isArray(ast.contenido[0].fragmentos) : false,
        muestraPrimerNodo: JSON.stringify(ast.contenido ? ast.contenido[0] : null, null, 2).slice(0, 400)
    });

    return {
        ast,
        semanticMap: semMap,
        styleBridge,
        diagnostics
    };
}

module.exports = { adaptarInDesign };