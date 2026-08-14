/**
 * Capa Anticorrupción (E10) - InDesign Adapter
 */

'use strict';

const { resolverTipoBase } = require('./TypeResolver');
const { TIPOS_VALIDOS } = require('../core/constants/tiposValidos');
const { reconciliarFronterasFragmentos } = require('./reconciliadorFronteras');

function adaptarInDesign({ jsonCrudo, semanticMap }) {
    if (!jsonCrudo || typeof jsonCrudo !== 'object') {
        throw new TypeError("jsonCrudo debe ser un objeto válido");
    }

    // 0. Validación defensiva de la clave tokens y prevención de dialecto ambiguo
    if (jsonCrudo.tokens !== undefined && !Array.isArray(jsonCrudo.tokens)) {
        throw new Error('Rechazo E10: "tokens" debe ser un arreglo.');
    }

    if (Array.isArray(jsonCrudo.tokens) && Array.isArray(jsonCrudo.contenido)) {
        throw new Error('Rechazo E10: Dialecto ambiguo. No se permite simultaneidad de "tokens" y "contenido".');
    }

    // 1. Inmutabilidad estricta y normalización de dialecto (tokens -> contenido estructurado)
    let jsonNormalizado = JSON.parse(JSON.stringify(jsonCrudo));

    if (Array.isArray(jsonNormalizado.tokens)) {
        jsonNormalizado.contenido = jsonNormalizado.tokens.map((token, index) => {
            const estilo = token.estilo_indesign || token.estilo || '';
            let tipo = token.tipo;

            // 1.1 Rechazo explícito de tipos transicionales sin soporte
            if (tipo === 'referencia' || tipo === 'transicion') {
                throw new Error(`Rechazo E10: El tipo entrante "${tipo}" en el token [${index}] no está permitido.`);
            }

            // 1.2 Resolución y corrección estricta para títulos y tipos genéricos
            if (tipo === 'titulo') {
                const tipoResuelto = resolverTipoBase(estilo);
                if (tipoResuelto !== 'titulo_parte') {
                    throw new Error(`Rechazo E10: Título en token [${index}] no tiene un estilo compatible con "titulo_parte" (Estilo: ${estilo}).`);
                }
                tipo = tipoResuelto;
            } else if (tipo === 'desconocido' || !tipo) {
                tipo = resolverTipoBase(estilo);
                if (!tipo) {
                    throw new Error(`Rechazo E10: No se pudo resolver un tipo canónico para el estilo "${estilo}" en el token [${index}].`);
                }
            }

            // 1.3 Validación estricta contra el vocabulario controlado compartido
            if (TIPOS_VALIDOS && typeof TIPOS_VALIDOS.has === 'function' && !TIPOS_VALIDOS.has(tipo)) {
                throw new Error(`Rechazo E10: El tipo resultante "${tipo}" (estilo: "${estilo}") no pertenece al vocabulario controlado.`);
            }

            // 1.4 Construcción del nodo AST preservando fragmentos para estilos inline
            const nodoAST = {
                tipo: tipo,
                inDesignStyle: estilo,
                estiloParrafo: estilo,
                tipoNodo: 'paragraph'
            };

            if (token.fragmentos && Array.isArray(token.fragmentos)) {
                nodoAST.fragmentos = JSON.parse(JSON.stringify(token.fragmentos));
            }

            const texto = token.texto_completo ?? token.texto_limpio ?? token.texto;
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

    // 2. Construcción del puente de estilos (Style Bridge)
    if (semMap.styles && Array.isArray(semMap.styles)) {
        semMap.styles.forEach(style => {
            const name = style.originalName;
            const type = style.type;
            
            let className = null;
            if (style.exportTagging && style.exportTagging.epub && style.exportTagging.epub.className) {
                className = style.exportTagging.epub.className;
            }

            if (name) {
                if (className) {
                    styleBridge[name] = className;
                }
                if (type === 'paragraph') mappedParagraphs.add(name);
                if (type === 'character') mappedCharacters.add(name);
            }
        });
    }

    // 3. Normalización estructural y auditoría
    function procesarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        const teniaFragmentos = Array.isArray(nodo.fragmentos);

        // 3.1 Normalización de llaves de InDesign
        if (nodo.estilo && !nodo.estiloParrafo) {
            nodo.estiloParrafo = nodo.estilo;
            delete nodo.estilo;
        }

        // 3.2 Conversión estructural
        if (teniaFragmentos) {
            nodo.contenido = nodo.fragmentos;
            delete nodo.fragmentos;
        }

        // 3.2.5 Asegurar contrato estricto: Extracción segura de texto
        let textoExtraido = nodo.texto ?? nodo.texto_completo ?? nodo.texto_limpio ?? nodo.textContent ?? nodo.text ?? nodo.contents ?? "";
        
        if (typeof textoExtraido === 'string') {
            textoExtraido = textoExtraido.trim();
        }

        // Si el párrafo está vacío, asignamos marcador
        nodo.texto = textoExtraido === "" ? "[VACÍO]" : textoExtraido;

        // 3.2.6 Asegurar contrato estricto: Todo nodo debe tener la propiedad 'tipo'
        if (!nodo.tipo) {
            nodo.tipo = (nodo.estiloCaracter || nodo.tipoNodo === 'character') ? 'texto' : 'parrafo';
        }

        // 3.3 Canonicalización estricta de tipoNodo con prioridad ontológica de carácter
        if (
            nodo.tipoNodo === 'character' ||
            nodo.tipo === 'texto' ||
            nodo.estiloCaracter
        ) {
            nodo.tipoNodo = 'character';
            nodo.tipo = 'texto';

        } else if (
            nodo.tipoNodo === 'paragraph' ||
            nodo.tipo === 'parrafo' ||
            nodo.estiloParrafo
        ) {
            nodo.tipoNodo = 'paragraph';

        } else if (
            teniaFragmentos
        ) {
            nodo.tipoNodo = 'paragraph';

        } else if (!nodo.tipoNodo) {
            nodo.tipoNodo = 'paragraph';
        }

        // 3.4 Asegurar contrato inDesignStyle y registrar para auditoría
        if (nodo.tipoNodo === 'paragraph') {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloParrafo;
            const style = nodo.inDesignStyle;
            
            if (style && style !== '[Ninguno]' && !mappedParagraphs.has(style)) {
                unmappedP.add(style);
            }

            // --- INYECCIÓN ONTOLÓGICA (G3.5-T4) ---
            if (!nodo.tipo) {
                const tipoSemantico = resolverTipoBase(style);
                if (tipoSemantico) {
                    nodo.tipo = tipoSemantico;
                }
            }
            // --------------------------------------

        } else if (nodo.tipoNodo === 'character') {
            nodo.inDesignStyle = nodo.inDesignStyle || nodo.estiloCaracter;
            const style = nodo.inDesignStyle;
            if (style && style !== '[Ninguno]' && !mappedCharacters.has(style)) {
                unmappedC.add(style);
            }
        }

        // Descenso recursivo
        if (Array.isArray(nodo.contenido)) {
            nodo.contenido.forEach(procesarNodo);
        }

        // C.38 — Reconciliación determinista de fronteras (Capa E10)
        const nodoReconciliado = reconciliarFronterasFragmentos(nodo);
        Object.assign(nodo, nodoReconciliado);
    }

    // Manejo de la raíz del documento
    if (Array.isArray(ast.fragmentos)) {
        ast.contenido = ast.fragmentos;
        delete ast.fragmentos;
    }

    if (Array.isArray(ast.contenido)) {
        ast.contenido.forEach(procesarNodo);
    } else {
        procesarNodo(ast);
    }

    // 4. Consolidación de diagnósticos editoriales
    if (unmappedP.size > 0) {
        diagnostics.unmappedParagraphStyles = Array.from(unmappedP);
        diagnostics.unmappedParagraphStyles.forEach(s => 
            diagnostics.warnings.push(`Estilo de párrafo no mapeado: ${s}`)
        );
    }

    if (unmappedC.size > 0) {
        diagnostics.unmappedCharacterStyles = Array.from(unmappedC);
        diagnostics.unmappedCharacterStyles.forEach(s => 
            diagnostics.warnings.push(`Estilo de carácter no mapeado: ${s}`)
        );
    }

    if (diagnostics.unmappedParagraphStyles.length > 0 || diagnostics.unmappedCharacterStyles.length > 0) {
        diagnostics.valid = false;
    }

    return {
        ast,
        semanticMap: semMap,
        styleBridge,
        diagnostics
    };
}

module.exports = { adaptarInDesign };