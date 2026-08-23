/**
 * E18.2.4.3 — CanonicalReconciler
 * Compara dos documentos canónicos (AST y DOM) de forma estrictamente posicional.
 * Genera un informe forense inmutable sin resolver semántica ni mutar los orígenes.
 */

'use strict';

class CanonicalReconciler {
    /**
     * Reconcilia un CanonicalDocument derivado de InDesign (AST) con uno de Lexmotor (XHTML).
     * @param {Object} astDoc - Documento canónico fuente (AST)
     * @param {Object} domDoc - Documento canónico fuente (XHTML/DOM)
     * @returns {Object} Informe de reconciliación
     */
    static reconcile(astDoc, domDoc) {
        const astNodes = (astDoc && astDoc.nodes) ? astDoc.nodes : [];
        const domNodes = (domDoc && domDoc.nodes) ? domDoc.nodes : [];

        const maxLen = Math.max(astNodes.length, domNodes.length);
        let matchedNodes = 0;
        let unmatchedAstNodes = 0;
        let unmatchedDomNodes = 0;

        const summary = {
            semanticMatches: 0, semanticMismatches: 0,
            nodeKindMatches: 0, nodeKindMismatches: 0,
            textMatches: 0, textMismatches: 0,
            fingerprintMatches: 0, fingerprintMismatches: 0,
            identityMatches: 0, identityAbsent: 0, identityMismatches: 0,
            structuralMatches: 0, structuralMismatches: 0
        };

        const resultNodes = [];

        for (let i = 0; i < maxLen; i++) {
            const ast = astNodes[i];
            const dom = domNodes[i];

            // Detección de orfandad posicional
            if (ast && !dom) {
                unmatchedAstNodes++;
                continue;
            }
            if (!ast && dom) {
                unmatchedDomNodes++;
                continue;
            }

            matchedNodes++;

            // 1. Vectores Semánticos
            const compSemantic = (ast.semanticType === dom.semanticType) ? 'MATCH' : 'MISMATCH';
            if (compSemantic === 'MATCH') summary.semanticMatches++; else summary.semanticMismatches++;

            const compNodeKind = (ast.nodeKind === dom.nodeKind) ? 'MATCH' : 'MISMATCH';
            if (compNodeKind === 'MATCH') summary.nodeKindMatches++; else summary.nodeKindMismatches++;

            // 2. Vectores de Texto y Huella
            const compText = (ast.normalizedText === dom.normalizedText) ? 'MATCH' : 'MISMATCH';
            if (compText === 'MATCH') summary.textMatches++; else summary.textMismatches++;

            const compFingerprint = (ast.contentFingerprint === dom.contentFingerprint) ? 'MATCH' : 'MISMATCH';
            if (compFingerprint === 'MATCH') summary.fingerprintMatches++; else summary.fingerprintMismatches++;

            // 3. Vector de Identidad Institucional
            let compIdentity;
            if (ast.canonicalId === dom.canonicalId) {
                compIdentity = (ast.canonicalId === null) ? 'BOTH_ABSENT' : 'MATCH';
                if (compIdentity === 'MATCH') summary.identityMatches++;
            } else if (ast.canonicalId && !dom.canonicalId) {
                compIdentity = 'DOM_ABSENT';
                summary.identityAbsent++; // Estado validado empíricamente
            } else if (!ast.canonicalId && dom.canonicalId) {
                compIdentity = 'AST_ABSENT'; // Anomalía
            } else {
                compIdentity = 'MISMATCH';
                summary.identityMismatches++;
            }

            // 4. Vector de Estructura Jerárquica (parentCanonicalId)
            let compStructure;
            if (ast.parentCanonicalId === dom.parentCanonicalId) {
                compStructure = (ast.parentCanonicalId === null) ? 'BOTH_ABSENT' : 'MATCH';
                if (compStructure === 'MATCH') summary.structuralMatches++;
            } else if (ast.parentCanonicalId && !dom.parentCanonicalId) {
                compStructure = 'DOM_IDENTITY_ABSENT'; // Respetando la nomenclatura de la prueba #13
            } else if (!ast.parentCanonicalId && dom.parentCanonicalId) {
                compStructure = 'AST_IDENTITY_ABSENT';
            } else {
                compStructure = 'MISMATCH';
                summary.structuralMismatches++;
            }

            // 5. Construcción inmutable del par comparado
            resultNodes.push({
                index: i,
                ast: Object.assign({}, ast), // Clon somero para inmutabilidad contractual
                dom: Object.assign({}, dom),
                comparison: {
                    semanticType: compSemantic,
                    nodeKind: compNodeKind,
                    text: compText,
                    fingerprint: compFingerprint,
                    identity: compIdentity,
                    structure: compStructure
                }
            });
        }

        return {
            version: '1.0.0',
            source: {
                ast: 'AST',
                dom: 'XHTML'
            },
            matching: {
                strategy: 'MATCHING.POSITIONAL',
                astNodes: astNodes.length,
                domNodes: domNodes.length,
                matchedNodes,
                unmatchedAstNodes,
                unmatchedDomNodes
            },
            summary,
            nodes: resultNodes
        };
    }
}

module.exports = CanonicalReconciler;