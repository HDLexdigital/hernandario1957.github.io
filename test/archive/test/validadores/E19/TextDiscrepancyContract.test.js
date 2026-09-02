/**
 * E19.1.1 — Suite de Pruebas Contractuales para TextDiscrepancyContract
 * 
 * Certifica:
 * - Aceptación de expedientes válidos.
 * - Rechazo defensivo ante entradas malformadas o inválidas.
 * - Inmutabilidad y congelamiento de taxonomías y niveles de confianza.
 * - Cumplimiento estricto de la regla de seguridad sobre editorialEquivalence.
 */

'use strict';

const TextDiscrepancyContract = require('../../../src/validadores/E19/TextDiscrepancyContract');

describe('E19.1.1 — TextDiscrepancyContract Test Suite', () => {

    const createValidDossier = () => ({
        mismatchIndex: 0,
        astRange: [0, 0],
        domRange: [0, 0],
        classification: {
            type: 'CHARACTER_SUBSTITUTION',
            confidence: 'HIGH'
        },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Aceptación de un expediente completamente válido', () => {
        const dossier = createValidDossier();
        const result = TextDiscrepancyContract.validateDossier(dossier);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    test('2. Rechazo defensivo ante entradas nulas, indefinidas o primitivos', () => {
        expect(TextDiscrepancyContract.validateDossier(null).valid).toBe(false);
        expect(TextDiscrepancyContract.validateDossier(undefined).valid).toBe(false);
        expect(TextDiscrepancyContract.validateDossier('invalid').valid).toBe(false);
        expect(TextDiscrepancyContract.validateDossier(123).valid).toBe(false);
    });

    test('3. Rechazo defensivo si falta o es inválido el mismatchIndex', () => {
        const dossier = createValidDossier();
        delete dossier.mismatchIndex;
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);

        dossier.mismatchIndex = 'not-a-number';
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);
    });

    test('4. Rechazo defensivo si los rangos astRange o domRange no son arrays', () => {
        const dossier = createValidDossier();
        dossier.astRange = 'not-an-array';
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);

        dossier.astRange = [0, 0];
        dossier.domRange = null;
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);
    });

    test('5. Rechazo defensivo ante un tipo de clasificación desconocido o inválido', () => {
        const dossier = createValidDossier();
        dossier.classification.type = 'INVALID_TYPE';
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);
    });

    test('6. Rechazo defensivo ante un nivel de confianza desconocido o inválido', () => {
        const dossier = createValidDossier();
        dossier.classification.confidence = 'ABSOLUTE';
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);
    });

    test('7. Regla crítica: Rechazo si editorialEquivalence intenta afirmar algo distinto a NOT_DEMONSTRATED', () => {
        const dossier = createValidDossier();
        dossier.editorialEquivalence = 'EQUIVALENT';
        expect(TextDiscrepancyContract.validateDossier(dossier).valid).toBe(false);
    });

    test('8. Inmutabilidad y protección de taxonomías y niveles de confianza', () => {
        expect(() => {
            TextDiscrepancyContract.TAXONOMY.NEW_TYPE = 'NEW_TYPE';
        }).toThrow();

        expect(() => {
            TextDiscrepancyContract.CONFIDENCE_LEVELS.HIGH = 'MODIFIED';
        }).toThrow();
    });

    test('9. No mutación del expediente de entrada durante la validación', () => {
        const dossier = createValidDossier();
        const clone = JSON.parse(JSON.stringify(dossier));
        TextDiscrepancyContract.validateDossier(dossier);
        expect(dossier).toEqual(clone);
    });

});