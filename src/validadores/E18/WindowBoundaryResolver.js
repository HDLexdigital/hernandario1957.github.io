/**
 * E18.3.2 — WindowBoundaryResolver (Con Contención Estricta Anti-Sobreabsorción)
 * 
 * Delimita las ventanas topológicas entre AST y DOM basándose en anclajes estructurales.
 * Aplica una regla física inquebrantable: un MERGE solo se autoriza si el nodo DOM
 * contiene textualmente la evidencia física de los nodos AST adicionales que pretende absorber.
 */

'use strict';

class WindowBoundaryResolver {
    /**
     * Busca un nodo por su índice lógico (propiedad .index o posición de respaldo).
     */
    static _findNodeByLogicalIndex(nodes, targetIndex) {
        if (!nodes || !Array.isArray(nodes)) return null;
        return nodes.find((n, idx) => {
            const logicalIdx = n.index !== undefined ? n.index : idx;
            return logicalIdx === targetIndex;
        }) || null;
    }

    /**
     * Resuelve las fronteras de ventanas topológicas entre el AST y el DOM.
     * @param {Object} astDoc - ASTCanonicalDocument
     * @param {Object} domDoc - DOMCanonicalDocument
     * @param {Array} astAnchors - Anclajes estructurales del AST
     * @param {Array} domAnchors - Anclajes estructurales del DOM
     * @returns {Object} Mapa de ventanas con rangos validados físicamente
     */
    static resolve(astDoc, domDoc, astAnchors, domAnchors) {
        const astNodes = astDoc.nodes || [];
        const domNodes = domDoc.nodes || [];

        const windows = [];
        let preAnchorRegion = null;
        let postAnchorRegion = null;
        let monotonicityViolated = false;
        let unmatchedDomCount = 0;

        let overAbsorptionDetected = false;
        let mergesCount = 0;
        let splitsCount = 0;

        // Mapeo rápido de anclajes DOM por clave para búsqueda directa
        const domAnchorMap = new Map();
        domAnchors.forEach(da => domAnchorMap.set(da.key, da));

        // 1. Verificación de monotonicidad pasiva
        let lastDomIdx = -1;
        for (const astA of astAnchors) {
            const domA = domAnchorMap.get(astA.key);
            if (domA) {
                const idx = domAnchors.indexOf(domA);
                if (idx < lastDomIdx) {
                    monotonicityViolated = true;
                    break;
                }
                lastDomIdx = idx;
            }
        }

        // 2. Detección de Región Pre-Ancla
        const firstAstAnchor = astAnchors[0];
        const firstDomAnchor = domAnchors[0];
        if ((firstAstAnchor && firstAstAnchor.index > 0) || (firstDomAnchor && firstDomAnchor.index > 0)) {
            preAnchorRegion = {
                astRange: firstAstAnchor && firstAstAnchor.index > 0 ? [0, firstAstAnchor.index - 1] : [],
                domRange: firstDomAnchor && firstDomAnchor.index > 0 ? [0, firstDomAnchor.index - 1] : []
            };
        }

        // 3. Delimitación de Ventanas por Anclajes Consecutivos
        let i = 0;
        let j = 0;

        while (i < astAnchors.length || j < domAnchors.length) {
            const astA = astAnchors[i];
            const domA = domAnchors[j];

            if (!astA && domA) {
                windows.push({
                    status: 'WINDOW.UNMATCHED',
                    anchorKey: domA.key,
                    astRange: [],
                    domRange: [domA.index, domA.index]
                });
                j++;
                unmatchedDomCount++;
                continue;
            }

            if (astA && !domA) {
                windows.push({
                    status: 'WINDOW.UNMATCHED',
                    anchorKey: astA.key,
                    astRange: [astA.index, astA.index],
                    domRange: []
                });
                i++;
                continue;
            }

            if (astA.key === domA.key && astA.type === domA.type) {
                const nextAstAnchor = astAnchors[i + 1];
                const nextDomAnchor = domAnchors[j + 1];

                // Búsqueda robusta del nodo DOM mediante índice lógico
                const targetDomNode = WindowBoundaryResolver._findNodeByLogicalIndex(domNodes, domA.index);
                const domText = targetDomNode ? (targetDomNode.normalizedText || '') : '';

                // Detección robusta de MERGE físico con validación de contenido
                const isMerge = nextAstAnchor && (
                    domText.includes(nextAstAnchor.rawText) ||
                    domText.includes(`Artículo ${nextAstAnchor.key}`) || 
                    domText.includes(`Art. ${nextAstAnchor.key}`) ||
                    domText.includes(`Art ${nextAstAnchor.key}`) ||
                    domText.includes(`ARTÍCULO ${nextAstAnchor.key}`)
                );

                const astMax = isMerge && nextAstAnchor 
                    ? nextAstAnchor.index 
                    : (nextAstAnchor ? nextAstAnchor.index - 1 : astNodes.length - 1);

                const domMax = nextDomAnchor ? nextDomAnchor.index - 1 : domNodes.length - 1;

                if (isMerge) {
                    mergesCount++;
                }

                windows.push({
                    status: 'WINDOW.MATCH',
                    anchorKey: astA.key,
                    astRange: [astA.index, astMax],
                    domRange: [domA.index, domMax]
                });

                if (isMerge) {
                    i += 2;
                } else {
                    i++;
                }
                j++;
            } else if (astA.key < domA.key) {
                windows.push({
                    status: 'WINDOW.UNMATCHED',
                    anchorKey: astA.key,
                    astRange: [astA.index, astA.index],
                    domRange: []
                });
                i++;
            } else {
                windows.push({
                    status: 'WINDOW.UNMATCHED',
                    anchorKey: domA.key,
                    astRange: [],
                    domRange: [domA.index, domA.index]
                });
                j++;
                unmatchedDomCount++;
            }
        }

        // 4. Detección de Región Post-Ancla
        const lastAstAnchor = astAnchors[astAnchors.length - 1];
        const lastDomAnchor = domAnchors[domAnchors.length - 1];
        if ((lastAstAnchor && lastAstAnchor.index < astNodes.length - 1) || (lastDomAnchor && lastDomAnchor.index < domNodes.length - 1)) {
            postAnchorRegion = {
                astRange: lastAstAnchor && lastAstAnchor.index < astNodes.length - 1 ? [lastAstAnchor.index + 1, astNodes.length - 1] : [],
                domRange: lastDomAnchor && lastDomAnchor.index < domNodes.length - 1 ? [lastDomAnchor.index + 1, domNodes.length - 1] : []
            };
        }

        return {
            version: '1.0.0',
            strategy: 'WINDOW.ANCHOR_BASED',
            windows,
            preAnchorRegion,
            postAnchorRegion,
            monotonicityViolated,
            overAbsorptionDetected,
            summary: {
                merges: mergesCount,
                splits: splitsCount,
                unmatchedDom: unmatchedDomCount
            }
        };
    }
}

module.exports = WindowBoundaryResolver;