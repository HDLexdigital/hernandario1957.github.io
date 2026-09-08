'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ledmSchemaPath = path.join(__dirname, '..', 'schemas', 'ledm-v2.0.schema.json');
const ledmSchema = JSON.parse(fs.readFileSync(ledmSchemaPath, 'utf8'));

function validateLedm(data) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(ledmSchema);
    return { valid: validate(data), errors: validate.errors || null };
}

describe('LEDM-2.0-CONTRACT-001: Validación de Dominio Jurídico Canónico', () => {
    // Fixture válido mínimo, alineado con la salida real del Semantic Compiler
    const validFixture = {
        meta: {
            model: 'LEDM-2.0',
            jurisdiction: 'CO',
            corpusId: 'CP-1991',
            documentId: 'CP-1991',
            version: {
                id: 'v1.0',
                number: 1,
                status: 'CURRENT'
            }
        },
        provenance: {
            sourceType: 'INDESIGN',
            sourceId: 'Constitucion_CO.indd',
            retrievedAt: '2026-09-01T10:00:00Z',
            transformationsApplied: [
                { id: 'LexCore_Extract.jsx', version: '1.0.0' },
                { id: 'SemanticCompiler', version: '2.0.0' }
            ]
        },
        integrity: {
            sourceHash: { algorithm: 'SHA-256', value: 'a'.repeat(64) },
            contentHash: { algorithm: 'SHA-256', value: 'b'.repeat(64) },
            ledmHash: { algorithm: 'SHA-256', value: 'c'.repeat(64) }
        },
        structure: {
            type: 'constitution',
            title: 'Constitución Política de Colombia',
            blocks: [
                {
                    nodeId: 'story-001-b0001',
                    type: 'title',
                    children: [
                        { type: 'text', text: 'TÍTULO I' }
                    ]
                },
                {
                    nodeId: 'story-001-b0002',
                    type: 'article',
                    children: [
                        {
                            type: 'strong',
                            children: [
                                { type: 'text', text: 'Artículo 1. ' }
                            ]
                        },
                        {
                            type: 'text',
                            text: 'Colombia es un Estado social de derecho...'
                        }
                    ]
                }
            ]
        }
    };

    test('Debe aceptar un documento constitucional válido (Fixture Art. 1)', () => {
        const { valid, errors } = validateLedm(validFixture);
        if (!valid) console.error(errors);
        expect(valid).toBe(true);
        expect(validFixture.structure.type).toBe('constitution');
        expect(validFixture.integrity.contentHash.value).toBeDefined();
    });

    test('Debe rechazar el documento si falta el bloque maestro "meta"', () => {
        const invalid = structuredClone(validFixture);
        delete invalid.meta;
        expect(validateLedm(invalid).valid).toBe(false);
    });

    test('Debe rechazar relaciones jurídicas fuera del vocabulario controlado', () => {
        const invalid = structuredClone(validFixture);
        invalid.structure.blocks[0].relations = ['fakeRelation'];
        // El schema actual no permite 'relations' en blocks (additionalProperties: false)
        expect(validateLedm(invalid).valid).toBe(false);
    });

    test('El contrato restringe la interpretación IA (No hay campo "interpretation" en el esquema)', () => {
    const invalid = structuredClone(validFixture);
    // Añadir una propiedad no permitida en un bloque
    invalid.structure.blocks[0].interpretation = 'esta es una interpretación IA';
    const { valid } = validateLedm(invalid);
    expect(valid).toBe(false);
	});
});