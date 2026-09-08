/**
 * E18.2.5.5.1 — Suite Contractual Sintética para RangeAwareReconciler (15 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - El alignment map delimita rangos; el reconciliador evalúa evidencia dentro de ellos.
 * - Tratamiento seguro de MATCH (1:1), MERGE (N:1), SPLIT (1:N) y AMBIGUOUS.
 * - Cero invención de equivalencias textuales en fusiones o fragmentaciones (status NOT_EVALUATED).
 * - Uso exclusivo de huellas físicas (contentFingerprint / texto exacto) sin semántica externa.
 * - Inmutabilidad absoluta y preservación de monotonicidad.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const RangeAwareReconciler = require('../../../src/validadores/E18/RangeAwareReconciler');

describe('E18.2.5.5.1 — RangeAwareReconciler (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text, fingerprint = `sha256:${text}`) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: fingerprint
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. MATCH puro: comparación directa 1:1 entre rangos unitarios', () => {
        const astDoc = createDoc([createNode(0, 'Texto idéntico')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto idéntico')], 'DOM');
        
        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: { anchorType: 'ANCHOR_EXACT' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations).toHaveLength(1);
        expect(result.reconciliations[0].status).toBe('ALIGN.MATCH');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
    });

    test('2. MERGE: preserva explícitamente el rango AST y DOM recibido', () => {
        const astDoc = createDoc([createNode(0, 'Part A'), createNode(1, 'Part B')], 'AST');
        const domDoc = createDoc([createNode(0, 'Part A. Part B.')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: { anchorType: 'ANCHOR_CONTAINMENT' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MERGE');
        expect(result.reconciliations[0].astRange).toEqual([0, 1]);
        expect(result.reconciliations[0].domRange).toEqual([0, 0]);
    });

    test('3. SPLIT: preserva explícitamente el rango AST y DOM recibido', () => {
        const astDoc = createDoc([createNode(0, 'Completo AST')], 'AST');
        const domDoc = createDoc([createNode(0, 'Parte 1'), createNode(1, 'Parte 2')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.SPLIT', astRange: [0, 0], domRange: [0, 1], evidence: { anchorType: 'ANCHOR_CONTAINMENT' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.SPLIT');
        expect(result.reconciliations[0].astRange).toEqual([0, 0]);
        expect(result.reconciliations[0].domRange).toEqual([0, 1]);
    });

    test('4. MERGE no debe producir falsos DOM_UNMATCHED en el reporte de reconciliación', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'AB')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: { anchorType: 'CONTAINMENT' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        const unmatchedDom = result.reconciliations.filter(r => r.status === 'ALIGN.DOM_UNMATCHED');
        expect(unmatchedDom).toHaveLength(0);
    });

    test('5. SPLIT no debe producir falsos AST_UNMATCHED en el reporte', () => {
        const astDoc = createDoc([createNode(0, 'AB')], 'AST');
        const domDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.SPLIT', astRange: [0, 0], domRange: [0, 1], evidence: { anchorType: 'CONTAINMENT' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        const unmatchedAst = result.reconciliations.filter(r => r.status === 'ALIGN.AST_UNMATCHED');
        expect(unmatchedAst).toHaveLength(0);
    });

    test('6. AMBIGUOUS: respeta el estado y no elige un ganador arbitrario', () => {
        const astDoc = createDoc([createNode(0, 'Duplicado')], 'AST');
        const domDoc = createDoc([createNode(0, 'Duplicado'), createNode(1, 'Duplicado')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.AMBIGUOUS', astRange: [0, 0], domRange: [0, 1], evidence: { anchorType: 'AMBIGUOUS' } }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.AMBIGUOUS');
        expect(result.reconciliations[0].text.status).toBe('NOT_EVALUATED');
    });

    test('7. Los rangos evaluados conservan estrictamente la monotonicidad', () => {
        const astDoc = createDoc([createNode(0, 'X'), createNode(1, 'Y')], 'AST');
        const domDoc = createDoc([createNode(0, 'X'), createNode(1, 'Y')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [
                { status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} },
                { status: 'ALIGN.MATCH', astRange: [1, 1], domRange: [1, 1], evidence: {} }
            ]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.monotonicityPreserved).toBe(true);
    });

    test('8. Los rangos evaluados no deben solaparse indebidamente', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [
                { status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} },
                { status: 'ALIGN.MATCH', astRange: [1, 1], domRange: [1, 1], evidence: {} }
            ]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.hasOverlaps).toBe(false);
    });

    test('9. Inmutabilidad absoluta: documentos y alignment map original permanecen intactos', () => {
        const astDoc = createDoc([createNode(0, 'Test')], 'AST');
        const domDoc = createDoc([createNode(0, 'Test')], 'DOM');
        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const astClone = JSON.parse(JSON.stringify(astDoc));
        const domClone = JSON.parse(JSON.stringify(domDoc));
        const mapClone = JSON.parse(JSON.stringify(alignmentMap));

        RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(astDoc).toEqual(astClone);
        expect(domDoc).toEqual(domClone);
        expect(alignmentMap).toEqual(mapClone);
    });

    test('10. No utilización de semanticType como criterio suficiente de identidad', () => {
        const astDoc = createDoc([createNode(0, 'Texto AST')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto DOM DIFERENTE')], 'DOM');
        astDoc.nodes[0].semanticType = 'articulo';
        domDoc.nodes[0].semanticType = 'articulo';

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        // Al diferir el texto, no debe asumir MATCH ciego por el semanticType
        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('11. Propiedades como canonicalId quedan totalmente fuera de la jurisdicción de reconciliación', () => {
        const astDoc = createDoc([createNode(0, 'A')], 'AST');
        const domDoc = createDoc([createNode(0, 'A')], 'DOM');
        astDoc.nodes[0].canonicalId = 'AST-ID-999';

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        // El resultado no debe falsificar identidad basándose en IDs arbitrarios
        expect(result.reconciliations[0]).not.toHaveProperty('canonicalId');
    });

    test('12. contentFingerprint es tratado exclusivamente como evidencia física de soporte', () => {
        const astDoc = createDoc([createNode(0, 'Texto', 'sha256:abc')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto', 'sha256:abc')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].evidence.fingerprintMatch).toBe(true);
    });

    test('13. MATCH exacto produce explícitamente evidencia TEXT.MATCH_EXACT', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1.')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
    });

    test('14. Discrepancia o mismatch dentro de un rango produce TEXT.MISMATCH', () => {
        const astDoc = createDoc([createNode(0, 'Texto original AST')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto alterado DOM')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MATCH', astRange: [0, 0], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('15. MERGE y SPLIT no inventan equivalencia textual interna; reportan estado protegido', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'AB')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: {} }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MERGE');
        // No asume equivalencia automática en rangos complejos antes de E19
        expect(result.reconciliations[0].text.status).toBe('NOT_EVALUATED');
    });

});