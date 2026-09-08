/**
 * E18.2.x — Suite de Pruebas Contractuales Completa (13 Pruebas)
 * Valida la matriz estricta normativo-funcional de SemanticRuleRegistry y SemanticTypeResolver.
 */

'use strict';

const SemanticRuleRegistry = require('../../../src/validadores/E18/SemanticRuleRegistry');
const SemanticTypeResolver = require('../../../src/validadores/E18/SemanticTypeResolver');

describe('E18.2.x — SemanticRuleRegistry & SemanticTypeResolver (Contrato Normativo Completo)', () => {

    // --- PRUEBAS DE AST (1 a 4) ---
    test('Matriz #1: AST con P02_TITLE_PART produce titulo_parte / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'P02_TITLE_PART' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('titulo_parte');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-AST-001');
        expect(result.evidence.sourceType).toBe('AST');
        expect(result.evidence.field).toBe('estiloParrafo');
        expect(result.evidence.matchedToken).toBe('P02_TITLE_PART');
    });

    test('Matriz #2: AST con P02_TITLE_MAIN produce titulo_principal / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'P02_TITLE_MAIN' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('titulo_principal');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-AST-002');
    });

    test('Matriz #3: AST con P03_CENTER_BOLD produce parrafo_destacado / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'P03_CENTER_BOLD' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('parrafo_destacado');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-AST-003');
    });

    test('Matriz #4: AST con P01_BODY_CONT produce parrafo / text / DEMONSTRATED', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'P01_BODY_CONT' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('parrafo');
        expect(result.nodeKind).toBe('text');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-AST-004');
    });

    // --- PRUEBAS DE XHTML (5 a 8) ---
    test('Matriz #5: XHTML con clase p02_title_part produce titulo_parte / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'XHTML', classes: ['p02_title_part', 'parrafo'] };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('titulo_parte');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-DOM-101');
        expect(result.evidence.sourceType).toBe('XHTML');
        expect(result.evidence.field).toBe('class');
        expect(result.evidence.matchedToken).toBe('p02_title_part');
    });

    test('Matriz #6: XHTML con clase p02_title_main produce titulo_principal / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'XHTML', classes: ['p02_title_main'] };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('titulo_principal');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-DOM-102');
    });

    test('Matriz #7: XHTML con clase p03_center_bold produce parrafo_destacado / semantic / DEMONSTRATED', () => {
        const evidence = { sourceType: 'XHTML', classes: ['p03_center_bold'] };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('parrafo_destacado');
        expect(result.nodeKind).toBe('semantic');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-DOM-103');
    });

    test('Matriz #8: XHTML con clase p01_body_cont produce parrafo / text / DEMONSTRATED', () => {
        const evidence = { sourceType: 'XHTML', classes: ['p01_body_cont'] };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('parrafo');
        expect(result.nodeKind).toBe('text');
        expect(result.confidence).toBe('DEMONSTRATED');
        expect(result.evidence.ruleId).toBe('SEM-DOM-104');
    });

    // --- PRUEBAS DE FALLBACK Y EXCLUSIÓN (9 a 11) ---
    test('Matriz #9: Token inexistente produce NOT_DEMONSTRATED', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'ESTILO_DESCONOCIDO_999' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBeNull();
        expect(result.nodeKind).toBe('text');
        expect(result.confidence).toBe('NOT_DEMONSTRATED');
        expect(result.evidence.ruleId).toBeNull();
    });

    test('Matriz #10: Evidencia inválida o null produce NOT_DEMONSTRATED', () => {
        expect(SemanticTypeResolver.resolve(null).confidence).toBe('NOT_DEMONSTRATED');
        expect(SemanticTypeResolver.resolve({ sourceType: 'UNKNOWN' }).confidence).toBe('NOT_DEMONSTRATED');
        expect(SemanticTypeResolver.resolve({}).confidence).toBe('NOT_DEMONSTRATED');
    });

    test('Matriz #11 (Control): P02_TITLE_PART_EXTRA debe rechazarse estrictamente (NOT_DEMONSTRATED)', () => {
        const evidence = { sourceType: 'AST', estiloParrafo: 'P02_TITLE_PART_EXTRA' };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBeNull();
        expect(result.nodeKind).toBe('text');
        expect(result.confidence).toBe('NOT_DEMONSTRATED');
        expect(result.evidence.ruleId).toBeNull();
    });

    // --- PRUEBA CONTRACTUAL DE PRECEDENCIA (12) ---
    test('Matriz #12: Precedencia estricta (estiloParrafo prevalece sobre campos secundarios)', () => {
        const evidence = {
            sourceType: 'AST',
            estiloParrafo: 'P02_TITLE_PART', // Debe ganar esta regla (SEM-AST-001)
            tipo: 'VALOR_QUE_NO_DEBE_USARSE'
        };
        const result = SemanticTypeResolver.resolve(evidence);

        expect(result.semanticType).toBe('titulo_parte');
        expect(result.evidence.ruleId).toBe('SEM-AST-001');
        expect(result.evidence.field).toBe('estiloParrafo');
    });

    // --- INVARIANTE DE INMUTABILIDAD DEL REGISTRO (13) ---
    test('Matriz #13 (Invariante): SemanticRuleRegistry retorna objetos inmutables', () => {
        const rules = SemanticRuleRegistry.getAllRules();
        expect(rules.length).toBeGreaterThan(0);

        const firstRule = rules[0];
        expect(() => {
            firstRule.semanticType = 'mutated_type';
        }).toThrow();
    });
});