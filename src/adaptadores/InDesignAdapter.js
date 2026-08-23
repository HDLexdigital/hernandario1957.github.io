/**
 * Capa Anticorrupción (E10) - InDesign Adapter
 */

'use strict';
const { resolverTipoBase } = require('./TypeResolver');
const { TIPOS_VALIDOS } = require('../core/constants/tiposValidos');
const { reconciliarFronterasFragmentos } = require('./reconciliadorFronteras');
const { resolverPresentation } = require('./PresentationResolver');

function adaptarInDesign({ jsonCrudo, semanticMap }) {
    if (!jsonCrudo || typeof jsonCrudo !== 'object') {
        throw new TypeError("jsonCrudo debe ser un objeto válido");
    }

    if (jsonCrudo.tokens !== undefined && !Array.isArray(jsonCrudo.tokens)) {
        throw new Error('Rechazo E10: "tokens" debe ser un arreglo.');
    }

    if (Array.isArray(jsonCrudo.tokens) && Array.isArray(jsonCrudo.contenido)) {
        throw new Error('Rechazo E10: Dialecto ambiguo. No se permite simultaneidad de "tokens" y "contenido".');
    }

    let jsonNormalizado = JSON.parse(JSON.stringify(jsonCrudo));

    if (Array.isArray(jsonNormalizado.tokens)) {
        jsonNormalizado.contenido = jsonNormalizado.tokens.map((token, index) => {
            const estilo = token.estilo_indesign || token.estilo || '';
            let tipo = token.tipo;

            if (tipo === 'referencia' || tipo === 'transicion') {
                throw new Error(`Rechazo E10: El tipo entrante "${tipo}" en el token [${index}] no está permitido.`);
            }

            if (tipo === 'titulo') {
                const tipoResuelto = resolverTipoBase(estilo);
                if (tipoResuelto !== 'titulo_parte') {
                    throw new Error(`Rechazo E10: Título en token [${index}] no tiene un estilo compatible con "titulo_parte" (Estilo: ${estilo}).`);
                }
                tipo = tipoResuelto;
            } else if (tipo === 'desconocido' || !tipo) {
                tipo = resolverTipoBase(estilo);
                if (!tipo) {
                    tipo = 'parrafo'; // Fallback seguro en lugar de romper el flujo
                }
            }

            const nodoAST = {
                tipo: tipo,
                inDesignStyle: estilo,
                estiloParrafo: estilo,
                tipoNodo: 'paragraph'
            };

            if (token.fragmentos && Array.isArray(token.fragmentos)) {
                nodoAST.fragmentos = JSON.parse(JSON.stringify(token.fragmentos));
            }

            const texto = token.texto_completo ?? token.texto_limpio ?? token.texto ?? token.content ?? token.contents ?? "";
            if (texto !== undefined) {
                nodoAST.texto = texto;
            }

            return nodoAST;
        });
        delete jsonNormalizado.tokens;
    }

    const ast = jsonNormalizado;
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
    const unmappedP = new Set();
    const unmappedC = new Set();

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

    // 3. Normalización estructural, Reconciliación e Inyección (Orden Post-Order Seguro)
    function procesarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        // --- 3.1 Normalización Básica ---
        const teniaFragmentos = Array.isArray(nodo.fragmentos);

        if (nodo.estilo && !nodo.estiloParrafo) {
            nodo.estiloParrafo = nodo.estilo;
            delete nodo.estilo;
        }

        if (teniaFragmentos) {
            nodo.contenido = nodo.fragmentos;
            delete nodo.fragmentos;
        }

        let textoExtraido = nodo.texto ?? nodo.texto_completo ?? nodo.texto_limpio ?? nodo.textContent ?? nodo.text ?? nodo.contents ?? "";
        const esCharacter = nodo.tipoNodo === 'character' || nodo.tipo === 'texto' || nodo.estiloCaracter;

        if (typeof textoExtraido === 'string' && !esCharacter) {
            textoExtraido = textoExtraido.trim();
        }

        // Blindaje: si hay texto real, nunca lo marcamos como [VACÍO]
        nodo.texto = (textoExtraido === "" && !esCharacter) ? "[VACÍO]" : textoExtraido;

        if (!nodo.tipo) {
            nodo.tipo = esCharacter ? 'texto' : 'parrafo';
        }

        if (esCharacter) {
            nodo.tipoNodo = 'character';
            nodo.tipo = 'texto';
        } else {
            nodo.tipoNodo = 'paragraph';
        }

        // --- 3.2 Descenso Recursivo (Procesar hijos primero) ---
        if (Array.isArray(nodo.contenido)) {
            nodo.contenido.forEach(procesarNodo);
        }

        // --- 3.3 Reconciliación de Fronteras Segura ---
        const nodoReconciliado = reconciliarFronterasFragmentos(nodo);
        Object.assign(nodo, nodoReconciliado);

        // --- 3.4 Identificación de Estilos de InDesign ---
        let estiloParaPuente = null;

        if (nodo.tipoNodo === 'paragraph') {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloParrafo;
            estiloParaPuente = nodo.inDesignStyle;

            if (estiloParaPuente && estiloParaPuente !== '[Ninguno]' && !mappedParagraphs.has(estiloParaPuente)) {
                unmappedP.add(estiloParaPuente);
            }

            if (!nodo.tipo || nodo.tipo === 'parrafo') {
                const tipoSemantico = resolverTipoBase(estiloParaPuente);
                if (tipoSemantico) nodo.tipo = tipoSemantico;
            }
        } else if (nodo.tipoNodo === 'character') {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloCaracter;
            estiloParaPuente = nodo.inDesignStyle;
            
            if (estiloParaPuente && estiloParaPuente !== '[Ninguno]' && !mappedCharacters.has(estiloParaPuente)) {
                unmappedC.add(estiloParaPuente);
            }
        }

        // --- 3.5 Inyección Directa y Resolución de Presentation ---
        if (estiloParaPuente && styleBridge[estiloParaPuente]) {
            const puente = styleBridge[estiloParaPuente];
            
            if (puente.className) nodo.resolvedClass = puente.className;
            if (puente.tag) nodo.resolvedTag = puente.tag;

            const resolvedPresentation = resolverPresentation(puente.presentation);
            if (Object.keys(resolvedPresentation).length > 0) {
                nodo.resolvedPresentation = resolvedPresentation;
            }
        }

        // --- 3.6 Fallback final ---
        if (!nodo.resolvedTag) {
            nodo.resolvedTag = nodo.tipoNodo === 'paragraph' ? 'p' : 'span';
        }
    }

    // Filtrado seguro: Conservamos todos los nodos que contengan texto real
    let nodosLimpios = [];
    let raizIterar = Array.isArray(ast.fragmentos) ? ast.fragmentos : (Array.isArray(ast.contenido) ? ast.contenido : [ast]);

    raizIterar.forEach(nodoBase => {
        procesarNodo(nodoBase);
        
        // Blindaje de filtrado: Solo descartamos si realmente está vacío y no tiene texto alternativo
        if (nodoBase.tipoNodo === 'paragraph' && nodoBase.texto === '[VACÍO]' && (!nodoBase.contenido || nodoBase.contenido.length === 0)) {
            return; // Se descarta únicamente si está completamente vacío
        }
        
        nodosLimpios.push(nodoBase);
    });

    ast.contenido = nodosLimpios;
    delete ast.fragmentos;

    if (unmappedP.size > 0) {
        diagnostics.unmappedParagraphStyles = Array.from(unmappedP);
        diagnostics.unmappedParagraphStyles.forEach(s => diagnostics.warnings.push(`Estilo de párrafo no mapeado: ${s}`));
    }

    if (unmappedC.size > 0) {
        diagnostics.unmappedCharacterStyles = Array.from(unmappedC);
        diagnostics.unmappedCharacterStyles.forEach(s => diagnostics.warnings.push(`Estilo de carácter no mapeado: ${s}`));
    }

    return {
        ast,
        semanticMap: semMap,
        styleBridge,
        diagnostics
    };
}

module.exports = { adaptarInDesign };