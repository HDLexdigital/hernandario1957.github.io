/**
 * E18.2.5.5 — RangeAwareReconciler
 * 
 * Reconciliador forense de rangos y comparación topológica.
 * Utiliza RangeTextCollator para colacionar rangos complejos (MERGE/SPLIT)
 * y evalúa la evidencia física de igualdad o discrepancia sin inferencias editoriales.
 */

'use strict';

const RangeTextCollator = require('./RangeTextCollator');

class RangeAwareReconciler {
    /**
     * Busca un nodo por su índice lógico (propiedad .index o posición de respaldo).
     * @param {Array} nodes - Lista de nodos canónicos
     * @param {number} targetIndex - Índice lógico a buscar
     * @returns {Object|null} El nodo encontrado o null
     */
    static _findNodeByLogicalIndex(nodes, targetIndex) {
        if (!nodes || !Array.isArray(nodes)) return null;
        return nodes.find((n, idx) => {
            const logicalIdx = n.index !== undefined ? n.index : idx;
            return logicalIdx === targetIndex;
        }) || null;
    }

    /**
     * Evalúa la evidencia textual dentro de las ventanas topológicas delimitadas.
     * @param {Object} astDoc - ASTCanonicalDocument
     * @param {Object} domDoc - DOMCanonicalDocument
     * @param {Object} alignmentMap - Mapa de alineación topológica previo
     * @returns {Object} Informe de reconciliación inmutable
     */
    static reconcile(astDoc, domDoc, alignmentMap) {
        const astNodes = astDoc.nodes || [];
        const domNodes = domDoc.nodes || [];
        
        const reconciliations = alignmentMap.alignments.map(alignment => {
            const rec = {
                ...alignment,
                text: { status: 'NOT_EVALUATED' },
                collation: null,
                fingerprintMatch: false,
                editorialEquivalence: 'NOT_DEMONSTRATED',
                evidence: { ...alignment.evidence }
            };

            const astRange = alignment.astRange || [];
            const domRange = alignment.domRange || [];

            // 1. Caso ALIGN.MATCH (1:1)
            if (alignment.status === 'ALIGN.MATCH' && astRange.length === 2 && domRange.length === 2) {
                const astNode = RangeAwareReconciler._findNodeByLogicalIndex(astNodes, astRange[0]);
                const domNode = RangeAwareReconciler._findNodeByLogicalIndex(domNodes, domRange[0]);

                if (astNode && domNode) {
                    const match = astNode.normalizedText === domNode.normalizedText;
                    rec.text.status = match ? 'TEXT.MATCH_EXACT' : 'TEXT.MISMATCH';
                    rec.fingerprintMatch = astNode.contentFingerprint === domNode.contentFingerprint;
                    rec.evidence.fingerprintMatch = rec.fingerprintMatch;
                }
            }
            // 2. Caso ALIGN.MERGE (N:1) -> Colacionar rango AST completo y comparar con nodo DOM único
            else if (alignment.status === 'ALIGN.MERGE' && astRange.length === 2 && domRange.length === 2) {
                const astCollation = RangeTextCollator.collate(astDoc, astRange);
                const domNode = RangeAwareReconciler._findNodeByLogicalIndex(domNodes, domRange[0]);

                if (domNode) {
                    const match = astCollation.collatedText === (domNode.normalizedText || '');
                    rec.text.status = match ? 'TEXT.MATCH_EXACT' : 'TEXT.MISMATCH';
                    rec.fingerprintMatch = astCollation.contentFingerprint === domNode.contentFingerprint;
                    rec.evidence.fingerprintMatch = rec.fingerprintMatch;
                    rec.collation = {
                        astCollatedText: astCollation.collatedText,
                        nodeCount: astCollation.nodeCount
                    };
                }
            }
            // 3. Caso ALIGN.SPLIT (1:N) -> Colacionar rango DOM completo y comparar con nodo AST único
            else if (alignment.status === 'ALIGN.SPLIT' && astRange.length === 2 && domRange.length === 2) {
                const astNode = RangeAwareReconciler._findNodeByLogicalIndex(astNodes, astRange[0]);
                const domCollation = RangeTextCollator.collate(domDoc, domRange);

                if (astNode) {
                    const match = (astNode.normalizedText || '') === domCollation.collatedText;
                    rec.text.status = match ? 'TEXT.MATCH_EXACT' : 'TEXT.MISMATCH';
                    rec.fingerprintMatch = astNode.contentFingerprint === domCollation.contentFingerprint;
                    rec.evidence.fingerprintMatch = rec.fingerprintMatch;
                    rec.collation = {
                        domCollatedText: domCollation.collatedText,
                        nodeCount: domCollation.nodeCount
                    };
                }
            }

            return rec;
        });

        // Verificación de integridad: Monotonicidad y solapamientos
        let monotonicityPreserved = true;
        let hasOverlaps = false;
        let lastAstEnd = -1;
        let lastDomEnd = -1;

        for (const rec of reconciliations) {
            const astStart = rec.astRange && rec.astRange.length > 0 ? rec.astRange[0] : -1;
            const astEnd = rec.astRange && rec.astRange.length > 0 ? rec.astRange[1] : -1;
            const domStart = rec.domRange && rec.domRange.length > 0 ? rec.domRange[0] : -1;
            const domEnd = rec.domRange && rec.domRange.length > 0 ? rec.domRange[1] : -1;

            if (astStart !== -1 && domStart !== -1) {
                if (astStart < lastAstEnd || domStart < lastDomEnd) {
                    monotonicityPreserved = false;
                }
                if (astStart <= lastAstEnd || domStart <= lastDomEnd) {
                    if (astStart === lastAstEnd && astStart !== -1) hasOverlaps = true;
                }
                lastAstEnd = astEnd;
                lastDomEnd = domEnd;
            }
        }

        return {
            version: '1.0.0',
            reconciliations,
            monotonicityPreserved,
            hasOverlaps
        };
    }
}

module.exports = RangeAwareReconciler;