/**
 * E18.2.5.3 — TopologyAligner
 * Motor de mapeo relacional de correspondencia editorial.
 */

'use strict';

class TopologyAligner {
    static align(astDoc, domDoc) {
        const astNodes = astDoc.nodes || [];
        const domNodes = domDoc.nodes || [];
        
        const alignments = [];
        const summary = { matches: 0, merges: 0, splits: 0, unmatchedAst: 0, unmatchedDom: 0, ambiguous: 0 };
        
        let i = 0;
        let j = 0;

        while (i < astNodes.length && j < domNodes.length) {
            const ast = astNodes[i];
            const dom = domNodes[j];
            const textA = ast.normalizedText;
            const textD = dom.normalizedText;

            // Frecuencia del texto en los documentos para detectar ambigüedad
            const astCount = astNodes.filter(n => n.normalizedText === textA).length;
            const domCount = domNodes.filter(n => n.normalizedText === textD).length;

            // 1. Ambigüedad (Múltiples correspondencias viables en CUALQUIERA de las fuentes)
            if (textA === textD && (astCount > 1 || domCount > 1)) {
                alignments.push({ 
                    status: 'ALIGN.AMBIGUOUS', 
                    astRange: [i, i], domRange: [j, j], 
                    evidence: { anchorType: 'AMBIGUOUS', confidence: 'LOW' } 
                });
                summary.ambiguous++;
                i++; j++;
                continue;
            }

            // 2. Exact Match (1:1)
            if (textA === textD) {
                alignments.push({ 
                    status: 'ALIGN.MATCH', 
                    astRange: [i, i], domRange: [j, j], 
                    evidence: { anchorType: 'TEXT_EXACT', confidence: 'HIGH' } 
                });
                summary.matches++;
                i++; j++;
                continue;
            }

            // 3. Merge (N:1) - AST múltiple encapsulado en un solo DOM
            if (i + 1 < astNodes.length) {
                const textA2 = astNodes[i + 1].normalizedText;
                if (textD.includes(textA) && textD.includes(textA2)) {
                    alignments.push({ 
                        status: 'ALIGN.MERGE', 
                        astRange: [i, i + 1], domRange: [j, j], 
                        evidence: { anchorType: 'TEXT_CONTAINMENT', confidence: 'HIGH' } 
                    });
                    summary.merges++;
                    i += 2; j++;
                    continue;
                }
            }

            // 4. Split (1:N) - Un AST fragmentado en múltiples DOM
            if (j + 1 < domNodes.length) {
                const textD2 = domNodes[j + 1].normalizedText;
                if (textA.includes(textD) && textA.includes(textD2)) {
                    alignments.push({ 
                        status: 'ALIGN.SPLIT', 
                        astRange: [i, i], domRange: [j, j + 1], 
                        evidence: { anchorType: 'TEXT_CONTAINMENT', confidence: 'HIGH' } 
                    });
                    summary.splits++;
                    i++; j += 2;
                    continue;
                }
            }

            // 5. Overlap (Solapamiento tipográfico/escape detectado pasivamente)
            if (textA.replace(/\\/g, '') === textD.replace(/\\/g, '')) {
                alignments.push({ 
                    status: 'ALIGN.MATCH', 
                    astRange: [i, i], domRange: [j, j], 
                    evidence: { anchorType: 'TEXT_OVERLAP', confidence: 'HIGH' } 
                });
                summary.matches++;
                i++; j++;
                continue;
            }

            // 6. Structural Sequence (Efecto Pinza)
            if (i > 0 && j > 0 && i + 1 < astNodes.length && j + 1 < domNodes.length) {
                const prevMatch = astNodes[i - 1].normalizedText === domNodes[j - 1].normalizedText;
                const nextMatch = astNodes[i + 1].normalizedText === domNodes[j + 1].normalizedText;
                if (prevMatch && nextMatch) {
                    alignments.push({ 
                        status: 'ALIGN.MATCH', 
                        astRange: [i, i], domRange: [j, j], 
                        evidence: { anchorType: 'STRUCTURAL_SEQUENCE', confidence: 'MEDIUM' } 
                    });
                    summary.matches++;
                    i++; j++;
                    continue;
                }
            }

            // 7. Mismatch absoluto (Ausencia de anclajes / Previene cruces monotónicos)
            alignments.push({ status: 'ALIGN.AST_UNMATCHED', astRange: [i, i], domRange: [], evidence: { anchorType: 'NONE' } });
            summary.unmatchedAst++;
            alignments.push({ status: 'ALIGN.DOM_UNMATCHED', astRange: [], domRange: [j, j], evidence: { anchorType: 'NONE' } });
            summary.unmatchedDom++;
            i++; j++;
        }

        // 8. Manejo de orfandad en colas desiguales
        while (i < astNodes.length) {
            alignments.push({ status: 'ALIGN.AST_UNMATCHED', astRange: [i, i], domRange: [], evidence: { anchorType: 'NONE' } });
            summary.unmatchedAst++;
            i++;
        }
        while (j < domNodes.length) {
            alignments.push({ status: 'ALIGN.DOM_UNMATCHED', astRange: [], domRange: [j, j], evidence: { anchorType: 'NONE' } });
            summary.unmatchedDom++;
            j++;
        }

        return {
            version: '1.0.0',
            strategy: 'ALIGNMENT.CONTENT_ANCHORED',
            summary,
            alignments
        };
    }
}

module.exports = TopologyAligner;