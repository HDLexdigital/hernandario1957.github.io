/**
 * E18.2.5.5.5 — Suite Contractual Sintética para Range Comparison & Resolution
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Compara físicamente rangos alineados utilizando RangeTextCollator.
 * - Soporta MATCH (1:1), MERGE (N:1 colacionando AST) y SPLIT (1:N colacionando DOM).
 * - Los estados UNMATCHED y AMBIGUOUS permanecen con text.status = 'NOT_EVALUATED'.
 * - Cero inferencia editorial: define editorialEquivalence como 'NOT_DEMONSTRATED'.
 * - Fingerprint independiente y trazabilidad completa de rangos.
 * - Inmutabilidad absoluta de documentos y mapas de entrada.
 */

'use strict';

// El componente con capacidad extendida de comparación de rangos está bloqueado (Fase RED)
const RangeAwareReconciler = require('../../../src/validadores/E18/RangeAwareReconciler');

describe('E18.2.5.5.5 — Range Comparison & Resolution (Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:mock-${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. ALIGN.MATCH exacto compara AST[i] ↔ DOM[j] produciendo TEXT.MATCH_EXACT', () => {
        const astDoc = createDoc([createNode(0, 'Texto idéntico')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto idéntico')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MATCH');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
        expect(result.reconciliations[0].editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('2. ALIGN.MATCH con discrepancia produce TEXT.MISMATCH', () => {
        const astDoc = createDoc([createNode(0, 'Texto original')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto modificado')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
        expect(result.reconciliations[0].editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('3. ALIGN.MERGE colaciona el rango AST y lo compara con el nodo DOM (match exacto)', () => {
        const astDoc = createDoc([createNode(0, 'Parte A. '), createNode(1, 'Parte B.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Parte A. Parte B.')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MERGE');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
        expect(result.reconciliations[0].collation.astCollatedText).toBe('Parte A. Parte B.');
    });

    test('4. ALIGN.MERGE con discrepancia entre la colación AST y el DOM produce TEXT.MISMATCH', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'C')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('5. ALIGN.SPLIT colaciona el rango DOM y lo compara con el nodo AST (match exacto)', () => {
        const astDoc = createDoc([createNode(0, 'Texto completo unificado.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto completo '), createNode(1, 'unificado.')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.SPLIT', astRange: [0, 0], domRange: [0, 1], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.SPLIT');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
        expect(result.reconciliations[0].collation.domCollatedText).toBe('Texto completo unificado.');
    });

    test('6. ALIGN.SPLIT con discrepancia produce TEXT.MISMATCH', () => {
        const astDoc = createDoc([createNode(0, 'Original')], 'AST');
        const domDoc = createDoc([createNode(0, 'Mod'), createNode(1, 'ificado')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.SPLIT', astRange: [0, 0], domRange: [0, 1], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('7. ALIGN.AST_UNMATCHED permanece sin evaluación textual', () => {
        const astDoc = createDoc([createNode(0, 'Huerfano AST')], 'AST');
        const domDoc = createDoc([createNode(0, 'Otro')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.AST_UNMATCHED', astRange: [0, 0], domRange: [], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('NOT_EVALUATED');
    });

    test('8. ALIGN.DOM_UNMATCHED permanece sin evaluación textual', () => {
        const astDoc = createDoc([createNode(0, 'Otro')], 'AST');
        const domDoc = createDoc([createNode(0, 'Huerfano DOM')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.DOM_UNMATCHED', astRange: [], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('NOT_EVALUATED');
    });

    test('9. ALIGN.AMBIGUOUS no asume equivalencia y permanece NOT_EVALUATED', () => {
        const astDoc = createDoc([createNode(0, 'A')], 'AST');
        const domDoc = createDoc([createNode(0, 'A')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.AMBIGUOUS', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('NOT_EVALUATED');
    });

    test('10. Evaluación independiente del contentFingerprint colacionado', () => {
        const astDoc = createDoc([createNode(0, 'Alpha')], 'AST');
        const domDoc = createDoc([createNode(0, 'Alpha')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0]).toHaveProperty('fingerprintMatch');
        expect(typeof result.reconciliations[0].fingerprintMatch).toBe('boolean');
    });

    test('11. Inmutabilidad absoluta: los documentos y el mapa original no se modifican', () => {
        const astDoc = createDoc([createNode(0, 'X')], 'AST');
        const domDoc = createDoc([createNode(0, 'X')], 'DOM');
        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const cloneAst = JSON.parse(JSON.stringify(astDoc));
        const cloneDom = JSON.parse(JSON.stringify(domDoc));
        const cloneMap = JSON.parse(JSON.stringify(alignmentMap));

        RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(astDoc).toEqual(cloneAst);
        expect(domDoc).toEqual(cloneDom);
        expect(alignmentMap).toEqual(cloneMap);
    });

    test('12. Preservación estricta de la trazabilidad (astRange y domRange intactos)', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'AB')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].astRange).toEqual([0, 1]);
        expect(result.reconciliations[0].domRange).toEqual([0, 0]);
    });

});