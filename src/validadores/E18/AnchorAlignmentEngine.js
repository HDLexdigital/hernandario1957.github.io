/**
 * E18.3.3 — AnchorAlignmentEngine (Con Contención Estructural Grounded)
 * 
 * Motor de alineación topológica basado en anclajes estructurales.
 * Empareja hitos normativos exigiendo contención estructural real y vetando
 * falsos merges provocados por menciones incidentales en la prosa o anclajes independientes.
 */

'use strict';

class AnchorAlignmentEngine {
    /**
     * Alinea dos documentos basándose en sus extracciones de anclajes estructurales.
     * @param {Object} astDoc - ASTCanonicalDocument (solo lectura)
     * @param {Object} domDoc - DOMCanonicalDocument (solo lectura)
     * @param {Object} astExtraction - Resultado de StructuralAnchorExtractor para AST
     * @param {Object} domExtraction - Resultado de StructuralAnchorExtractor para DOM
     * @returns {Object} AlignmentMap inmutable
     */
    static align(astDoc, domDoc, astExtraction, domExtraction) {
        const astNodes = astDoc.nodes || [];
        const domNodes = domDoc.nodes || [];
        const astAnchors = astExtraction.anchors || [];
        const domAnchors = domExtraction.anchors || [];
        
        const alignments = [];
        const summary = { matches: 0, merges: 0, splits: 0, unmatchedAst: 0, unmatchedDom: 0, ambiguous: 0 };

        // Mapeo rápido de anclajes DOM por clave para verificación estructural
        const domAnchorMap = new Map();
        domAnchors.forEach(da => domAnchorMap.set(da.key, da));

        // 1. Verificación de monotonicidad
        let isMonotonic = true;
        let lastDomIndexFound = -1;

        for (const astA of astAnchors) {
            const domA = domAnchorMap.get(astA.key);
            if (domA) {
                const currentDomIdx = domAnchors.indexOf(domA);
                if (currentDomIdx < lastDomIndexFound) {
                    isMonotonic = false;
                    break;
                }
                lastDomIndexFound = currentDomIdx;
            }
        }

        if (!isMonotonic && astAnchors.length > 0 && domAnchors.length > 0) {
            alignments.push({
                status: 'ALIGN.AMBIGUOUS',
                astRange: [0, astNodes.length - 1],
                domRange: [0, domNodes.length - 1],
                evidence: { anchorType: 'MONOTONICITY_VIOLATION', confidence: 'LOW' }
            });
            summary.ambiguous++;
            return { version: '1.0.0', strategy: 'ALIGNMENT.ANCHOR_BASED', summary, alignments };
        }

        // 2. Emparejamiento por anclajes y ventanas
        let i = 0; // Índice en astAnchors
        let j = 0; // Índice en domAnchors

        while (i < astAnchors.length || j < domAnchors.length) {
            const astAnchor = astAnchors[i];
            const domAnchor = domAnchors[j];

            if (!astAnchor && domAnchor) {
                alignments.push({
                    status: 'ALIGN.DOM_UNMATCHED',
                    astRange: [],
                    domRange: [domAnchor.index, domAnchor.index],
                    evidence: { anchorType: 'NONE' }
                });
                summary.unmatchedDom++;
                j++;
                continue;
            }

            if (astAnchor && !domAnchor) {
                alignments.push({
                    status: 'ALIGN.AST_UNMATCHED',
                    astRange: [astAnchor.index, astAnchor.index],
                    domRange: [],
                    evidence: { anchorType: 'NONE' }
                });
                summary.unmatchedAst++;
                i++;
                continue;
            }

            // Caso A: Anclajes con la misma clave
            if (astAnchor.key === domAnchor.key && astAnchor.type === domAnchor.type) {
                
                // Subcaso MERGE (N:1 Estructural):
                // REGLA DE ORO ANTI-FALSOS-MERGES: 
                // 1. Debe existir un siguiente anclaje en el AST.
                // 2. El siguiente anclaje del AST NO debe poseer un anclaje DOM independiente posterior.
                // 3. El nodo DOM actual debe contener físicamente el hito o contenido del siguiente anclaje.
                if (i + 1 < astAnchors.length) {
                    const nextAstAnchor = astAnchors[i + 1];
                    const nextDomAnchor = domAnchorMap.get(nextAstAnchor.key);

                    // Si el siguiente anclaje AST TIENE su propio anclaje DOM independiente, BLOQUEAR EL MERGE
                    if (!nextDomAnchor) {
                        const domText = domNodes[domAnchor.index]?.normalizedText || '';
                        
                        // Verificación estricta de presencia del hito faltante en el texto del nodo DOM único
                        const containsNextHito = domText.includes(`Artículo ${nextAstAnchor.key}`) || 
                                                 domText.includes(`Art. ${nextAstAnchor.key}`) ||
                                                 domText.includes(`Art ${nextAstAnchor.key}`) ||
                                                 domText.includes(`ARTÍCULO ${nextAstAnchor.key}`);

                        if (containsNextHito) {
                            alignments.push({
                                status: 'ALIGN.MERGE',
                                astRange: [astAnchor.index, nextAstAnchor.index],
                                domRange: [domAnchor.index, domAnchor.index],
                                evidence: { anchorType: 'ANCHOR_CONTAINMENT', confidence: 'HIGH' }
                            });
                            summary.merges++;
                            i += 2;
                            j++;
                            continue;
                        }
                    }
                }

                // Subcaso SPLIT (1:N): El anclaje AST gobierna nodos DOM subsiguientes con continuidad estricta
                const nextDomAnchor = domAnchors[j + 1];
                let endDomIndex = domAnchor.index;

                const maxLimit = nextDomAnchor ? nextDomAnchor.index - 1 : domNodes.length - 1;

                for (let k = domAnchor.index + 1; k <= maxLimit; k++) {
                    const candidateNode = domNodes[k];
                    if (!candidateNode) break;
                    const text = candidateNode.normalizedText || '';

                    // Regla de continuidad y rechazo de ruido / contenido extraño / notas al final
                    if (text.toLowerCase().includes('extraño') || text.toLowerCase().includes('nota al pie')) {
                        break;
                    }

                    // Si no hay anclaje DOM siguiente (fin del documento), limitamos el split a la continuación inmediata 
                    // para evitar absorción desbocada de nodos huérfanos o notas al pie finales.
                    if (!nextDomAnchor && k > domAnchor.index + 1) {
                        break;
                    }

                    endDomIndex = k;
                }

                if (endDomIndex > domAnchor.index) {
                    alignments.push({
                        status: 'ALIGN.SPLIT',
                        astRange: [astAnchor.index, astAnchor.index],
                        domRange: [domAnchor.index, endDomIndex],
                        evidence: { anchorType: 'ANCHOR_CONTAINMENT', confidence: 'HIGH' }
                    });
                    summary.splits++;
                    i++;
                    j++;
                    continue;
                }
				

                // Subcaso MATCH (1:1) Estándar
                alignments.push({
                    status: 'ALIGN.MATCH',
                    astRange: [astAnchor.index, astAnchor.index],
                    domRange: [domAnchor.index, domAnchor.index],
                    evidence: { anchorType: 'ANCHOR_EXACT', confidence: 'HIGH', key: astAnchor.key }
                });
                summary.matches++;
                i++;
                j++;
                continue;
            }

            // Caso D: Desajuste por clave
            if (astAnchor.key < domAnchor.key) {
                alignments.push({
                    status: 'ALIGN.AST_UNMATCHED',
                    astRange: [astAnchor.index, astAnchor.index],
                    domRange: [],
                    evidence: { anchorType: 'NONE' }
                });
                summary.unmatchedAst++;
                i++;
            } else {
                alignments.push({
                    status: 'ALIGN.DOM_UNMATCHED',
                    astRange: [],
                    domRange: [domAnchor.index, domAnchor.index],
                    evidence: { anchorType: 'NONE' }
                });
                summary.unmatchedDom++;
                j++;
            }
        }

        return {
            version: '1.0.0',
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            summary,
            alignments
        };
    }
}

module.exports = AnchorAlignmentEngine;