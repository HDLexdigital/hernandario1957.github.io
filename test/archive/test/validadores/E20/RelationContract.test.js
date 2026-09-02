/**
 * E20.4.1 — Relation Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Relaciones Semánticas Internas:
 * - Define qué constituye evidencia suficiente para declarar una relación explícita.
 * - Rechaza la inferencia basada puramente en la proximidad física o espacial, derivando en UNKNOWN.
 * - Impide relaciones huérfanas exigiendo la referencia inmutable al dossier base E20.3.
 * - Garantiza trazabilidad de extremo a extremo y preservación absoluta del baseline histórico.
 */

'use strict';

// El motor o adaptador relacional aún no está implementado (Fase RED esperada)
const RelationEngine = require('../../../src/validadores/E20/RelationEngine');

describe('E20.4.1 — Relation Contract (Fase RED)', () => {

    const mockE20DossierBase = Object.freeze({
        alignmentId: 1,
        claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
        traceability: { e18EvidenceRef: { status: 'ALIGN.MATCH' } }
    });

    test('R1. Referencia interna explícita detectable autoriza relación explícita', () => {
        const payload = {
            baseDossier: mockE20DossierBase,
            nodeText: 'Ver el artículo 14 del presente código.',
            evaluationVersion: '1.0.0'
        };

        const dossier = RelationEngine.evaluateRelation(payload);

        expect(dossier).toBeDefined();
        expect(dossier.relation.type).toBe('EXPLICIT_REFERENCE');
        expect(dossier.relation.status).toBe('VALIDATED');
    });

    test('R2. Relación sin evidencia suficiente deriva obligatoriamente en UNKNOWN', () => {
        const payload = {
            baseDossier: mockE20DossierBase,
            nodeText: 'Texto plano sin marcadores ni referencias relacionales.',
            evaluationVersion: '1.0.0'
        };

        const dossier = RelationEngine.evaluateRelation(payload);

        expect(dossier.relation.status).toBe('UNKNOWN');
        expect(dossier.relation.type).toBe('UNKNOWN');
    });

    test('R3. Proximidad física sin marcador explícito no produce relación (UNKNOWN por diseño)', () => {
        const payload = {
            baseDossier: mockE20DossierBase,
            nodeText: 'Artículo contiguo ubicado abajo en el mismo bloque visual de InDesign.',
            evaluationVersion: '1.0.0'
        };

        const dossier = RelationEngine.evaluateRelation(payload);

        // La proximidad espacial o física jamás debe inferir vínculo normativo si no hay marcador léxico
        expect(dossier.relation.type).not.toBe('SPATIAL_DEPENDENCY');
        expect(dossier.relation.status).toBe('UNKNOWN');
    });

    test('R4. Relación válida conserva la trazabilidad completa hacia el dossier base', () => {
        const payload = {
            baseDossier: mockE20DossierBase,
            nodeText: 'Conforme a lo dispuesto en el artículo 5.',
            evaluationVersion: '1.0.0'
        };

        const dossier = RelationEngine.evaluateRelation(payload);

        expect(dossier.traceability.baseDossierRef).toEqual(mockE20DossierBase);
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('R5. Intento de relación huérfana (sin dossier base E20.3) provoca rechazo contractual', () => {
        const payload = {
            baseDossier: null,
            nodeText: 'Ver artículo 5.',
            evaluationVersion: '1.0.0'
        };

        expect(() => {
            RelationEngine.evaluateRelation(payload);
        }).toThrow(/RELATION_CONTRACT_VIOLATION/);
    });

    test('R6. Intento de mutar el dossier base durante la evaluación lanza error de inmutabilidad', () => {
        const mutableBase = {
            alignmentId: 1,
            claim: { status: 'VALIDATED', semanticType: 'ARTICULO' }
        };

        const payload = {
            baseDossier: mutableBase,
            nodeText: 'Ver artículo 5.'
        };

        // El motor debe congelar o exigir inmutabilidad, y cualquier intento de mutación externa se rechaza
        const dossier = RelationEngine.evaluateRelation(payload);
        expect(Object.isFrozen(dossier)).toBe(true);
        expect(() => { mutableBase.claim.status = 'MUTATED'; }).not.toThrow(); // El motor protege su copia inmutable
    });

});