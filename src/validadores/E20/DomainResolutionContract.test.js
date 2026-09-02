/**
 * E20.3.5 — Domain Resolution Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Resolución Taxonómica y Granularidad:
 * - Exige granularidad fina: distingue explícitamente ARTICULO, PARRAFO, NUMERAL y LITERAL.
 * - Prohíbe la absorción por contenedor: un texto interno sin cabecera de artículo no debe ser clasificado
 *   automáticamente como ARTICULO solo por estar dentro del rango topológico de un artículo.
 * - Deriva en UNKNOWN ante evidencia ambigua o insuficiente.
 * - Garantiza inmutabilidad profunda, trazabilidad inquebrantable y preservación del baseline E20.2.4.
 */

'use strict';

// El motor de resolución refinada aún no está implementado (Fase RED esperada)
const DomainResolutionEngine = require('../../../src/validadores/E20/DomainResolutionEngine');

describe('E20.3.5 — Domain Resolution Contract (Fase RED)', () => {

    const validE18 = Object.freeze({
        astRange: [0, 0],
        domRange: [0, 0],
        status: 'ALIGN.MATCH'
    });

    const validE19 = Object.freeze({
        classification: { type: 'EXACT_MATCH', confidence: 'HIGH' },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Detección explícita de entidades de alta granularidad (ARTICULO, PARRAFO, NUMERAL, LITERAL)', () => {
        const testCases = [
            { text: 'Artículo 13. Todas las personas nacen...', expected: 'ARTICULO' },
            { text: 'Parágrafo 1. El Gobierno reglamentará...', expected: 'PARRAFO' },
            { text: '1. La defensa de los derechos...', expected: 'NUMERAL' },
            { text: 'a) Los ciudadanos podrán...', expected: 'LITERAL' }
        ];

        testCases.forEach(tc => {
            const dossier = DomainResolutionEngine.resolve({
                e18: validE18,
                e19: validE19,
                nodeText: tc.text,
                ruleVersion: '2.0.0'
            });

            expect(dossier.claim.semanticType).toBe(tc.expected);
            expect(dossier.claim.status).toBe('VALIDATED');
        });
    });

    test('2. No absorción por contenedor: texto interno sin cabecera no se clasifica como ARTICULO automáticamente', () => {
        const innerBodyText = 'Texto secundario interno que pertenece a la estructura pero carece de cabecera normativa formal.';

        const dossier = DomainResolutionEngine.resolve({
            e18: validE18,
            e19: validE19,
            nodeText: innerBodyText,
            ruleVersion: '2.0.0'
        });

        // No debe ser ARTICULO por defecto solo por estar en el contenedor; debe tipificarse como UNKNOWN o sub-unidad
        expect(dossier.claim.semanticType).not.toBe('ARTICULO');
        expect(dossier.claim.status).toBe('UNKNOWN');
    });

    test('3. Evidencia ambigua o insuficiente deriva obligatoriamente en UNKNOWN', () => {
        const dossier = DomainResolutionEngine.resolve({
            e18: validE18,
            e19: validE19,
            nodeText: 'Fragmento suelto sin sentido semántico reconocido.',
            ruleVersion: '2.0.0'
        });

        expect(dossier.claim.status).toBe('UNKNOWN');
        expect(dossier.claim.semanticType).toBe('UNKNOWN');
    });

    test('4. Inmutabilidad profunda y preservación de metadatos de evidencia inferiores', () => {
        const dossier = DomainResolutionEngine.resolve({
            e18: validE18,
            e19: validE19,
            nodeText: 'Artículo 1. Del Estado.',
            ruleVersion: '2.0.0'
        });

        expect(dossier.traceability.e18EvidenceRef).toEqual(validE18);
        expect(dossier.traceability.e19EvidenceRef).toEqual(validE19);
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
        expect(Object.isFrozen(dossier)).toBe(true);
    });

});