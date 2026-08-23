/**
 * E18.2.4.2 — Suite Contractual Sintética para CanonicalReconciler (18 Pruebas)
 * Valida el contrato de comparación forense, inmutabilidad y reporte pasivo
 * entre ASTCanonicalDocument y DOMCanonicalDocument.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen en verde (Fase RED)
const CanonicalReconciler = require('../../../src/validadores/E18/CanonicalReconciler');

describe('E18.2.4.2 — CanonicalReconciler (Contrato Sintético - Fase RED)', () => {

    // Helper para generar nodos base válidos sin verbosidad excesiva
    const createNode = (overrides = {}) => ({
        canonicalId: null,
        parentCanonicalId: null,
        semanticType: 'parrafo',
        nodeKind: 'text',
        normalizedText: 'Texto base',
        contentFingerprint: 'sha256:12345',
        ...overrides
    });

    const createDoc = (nodes) => ({ version: '1.0.0', nodes });

    test('1. Documentos vacíos retornan reporte de reconciliación vacío pero estructurado', () => {
        const result = CanonicalReconciler.reconcile(createDoc([]), createDoc([]));
        expect(result.matching.strategy).toBe('MATCHING.POSITIONAL');
        expect(result.matching.matchedNodes).toBe(0);
        expect(result.nodes).toHaveLength(0);
    });

    test('2. Correspondencia estrictamente posicional (MATCHING.POSITIONAL)', () => {
        const ast = createDoc([createNode({ normalizedText: 'A' }), createNode({ normalizedText: 'B' })]);
        const dom = createDoc([createNode({ normalizedText: 'A' }), createNode({ normalizedText: 'B' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        
        expect(result.nodes[0].index).toBe(0);
        expect(result.nodes[1].index).toBe(1);
        expect(result.matching.matchedNodes).toBe(2);
    });

    test('3. semanticType: MATCH', () => {
        const ast = createDoc([createNode({ semanticType: 'titulo_parte' })]);
        const dom = createDoc([createNode({ semanticType: 'titulo_parte' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.semanticType).toBe('MATCH');
        expect(result.summary.semanticMatches).toBe(1);
    });

    test('4. semanticType: MISMATCH (sin inferencia ni corrección)', () => {
        const ast = createDoc([createNode({ semanticType: 'titulo_parte' })]);
        const dom = createDoc([createNode({ semanticType: 'parrafo' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.semanticType).toBe('MISMATCH');
        expect(result.summary.semanticMismatches).toBe(1);
    });

    test('5. nodeKind: MATCH y MISMATCH', () => {
        const ast = createDoc([createNode({ nodeKind: 'semantic' })]);
        const dom = createDoc([createNode({ nodeKind: 'text' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.nodeKind).toBe('MISMATCH');
    });

    test('6. normalizedText: MATCH y MISMATCH', () => {
        const ast = createDoc([createNode({ normalizedText: 'Texto A' })]);
        const dom = createDoc([createNode({ normalizedText: 'Texto B' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.text).toBe('MISMATCH');
    });

    test('7. contentFingerprint: evaluado de forma independiente al texto', () => {
        const ast = createDoc([createNode({ normalizedText: 'Igual', contentFingerprint: 'sha256:AAA' })]);
        const dom = createDoc([createNode({ normalizedText: 'Igual', contentFingerprint: 'sha256:BBB' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.text).toBe('MATCH');
        expect(result.nodes[0].comparison.fingerprint).toBe('MISMATCH');
    });

    test('8. IDENTITY.BOTH_ABSENT: Ambos nodos carecen de canonicalId', () => {
        const ast = createDoc([createNode({ canonicalId: null })]);
        const dom = createDoc([createNode({ canonicalId: null })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.identity).toBe('BOTH_ABSENT');
    });

    test('9. IDENTITY.MATCH: Ambos nodos poseen el mismo canonicalId', () => {
        const ast = createDoc([createNode({ canonicalId: 'doc.art_1' })]);
        const dom = createDoc([createNode({ canonicalId: 'doc.art_1' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.identity).toBe('MATCH');
    });

    test('10. IDENTITY.DOM_ABSENT: Estado esperado (Evidencia E18.2.3.4)', () => {
        const ast = createDoc([createNode({ canonicalId: 'doc.art_1' })]);
        const dom = createDoc([createNode({ canonicalId: null })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.identity).toBe('DOM_ABSENT');
        expect(result.summary.identityAbsent).toBe(1);
    });

    test('11. IDENTITY.AST_ABSENT: Anomalía estructural', () => {
        const ast = createDoc([createNode({ canonicalId: null })]);
        const dom = createDoc([createNode({ canonicalId: 'doc.art_1' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.identity).toBe('AST_ABSENT');
    });

    test('12. IDENTITY.MISMATCH: Ambos existen pero difieren', () => {
        const ast = createDoc([createNode({ canonicalId: 'doc.art_1' })]);
        const dom = createDoc([createNode({ canonicalId: 'doc.art_2' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.identity).toBe('MISMATCH');
    });

    test('13. Estructura (parentCanonicalId) evaluada sin convertirse en identidad de nodo', () => {
        const ast = createDoc([createNode({ parentCanonicalId: 'doc.sec_1' })]);
        const dom = createDoc([createNode({ parentCanonicalId: null })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.nodes[0].comparison.structure).toBe('DOM_IDENTITY_ABSENT');
    });

    test('14. Nodos AST huérfanos sin contraparte secuencial', () => {
        const ast = createDoc([createNode(), createNode()]);
        const dom = createDoc([createNode()]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.matching.matchedNodes).toBe(1);
        expect(result.matching.unmatchedAstNodes).toBe(1);
    });

    test('15. Nodos DOM huérfanos sin contraparte secuencial', () => {
        const ast = createDoc([createNode()]);
        const dom = createDoc([createNode(), createNode()]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        expect(result.matching.unmatchedDomNodes).toBe(1);
    });

    test('16. Inmutabilidad absoluta de ambos documentos fuente', () => {
        const ast = createDoc([createNode({ semanticType: 'A' })]);
        const dom = createDoc([createNode({ semanticType: 'B' })]);
        
        const astClone = JSON.parse(JSON.stringify(ast));
        const domClone = JSON.parse(JSON.stringify(dom));
        
        CanonicalReconciler.reconcile(ast, dom);
        
        expect(ast).toEqual(astClone);
        expect(dom).toEqual(domClone);
    });

    test('17. Ausencia total de mutación semántica en discrepancias', () => {
        const astNode = createNode({ semanticType: 'titulo_parte' });
        const domNode = createNode({ semanticType: 'parrafo' });
        const result = CanonicalReconciler.reconcile(createDoc([astNode]), createDoc([domNode]));
        
        // Verifica el output inmutable, no una corrección subrepticia
        expect(result.nodes[0].ast.semanticType).toBe('titulo_parte');
        expect(result.nodes[0].dom.semanticType).toBe('parrafo');
    });

    test('18. Especial: Diferencia de identidad DOM_ABSENT NO contamina la coincidencia semántica', () => {
        const ast = createDoc([createNode({ canonicalId: 'doc.art_1', semanticType: 'articulo' })]);
        const dom = createDoc([createNode({ canonicalId: null, semanticType: 'articulo' })]);
        const result = CanonicalReconciler.reconcile(ast, dom);
        
        expect(result.nodes[0].comparison.semanticType).toBe('MATCH');
        expect(result.nodes[0].comparison.identity).toBe('DOM_ABSENT');
    });
});