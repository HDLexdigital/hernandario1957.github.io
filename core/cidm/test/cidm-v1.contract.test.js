'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const cidmSchemaPath = path.join(__dirname, '..', 'schemas', 'cidm-v1.0.schema.json');
const fixturePath = path.join(__dirname, '..', 'fixtures', 'indesign-extraction.valid.json');

const cidmSchema = JSON.parse(fs.readFileSync(cidmSchemaPath, 'utf8'));
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function validateSchema(data) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(cidmSchema);
    const valid = validate(data);
    return {
        valid,
        errors: validate.errors || null
    };
}

function validateSemanticIntegrity(cidm) {
    for (const story of cidm.stories) {
        for (const block of story.blocks) {
            if (!cidm.styleDictionary[block.styleId]) {
                throw new Error('Estilo de párrafo no declarado');
            }

            // Verificar estilos de carácter en fragmentos (acepta ambas variantes)
            for (const frag of block.fragments || []) {
                const fragStyleId = frag.styleId || frag.characterStyleId;
                if (fragStyleId && !cidm.styleDictionary[fragStyleId]) {
                    throw new Error('Estilo de carácter no declarado');
                }
            }

            // Solo comprobar coincidencia si hay fragmentos; si no los hay,
            // se asume que el texto del bloque no está fragmentado.
            if (block.fragments && block.fragments.length > 0) {
                const reconstructed = block.fragments.map(f => f.text).join('');
                if (reconstructed !== block.text) {
                    throw new Error('Los fragments no coinciden con el texto del párrafo');
                }
            }
        }
    }
}

describe('CIDM-1.0-CONTRACT', () => {
    test('CIDM-001: acepta una extracción válida según JSON Schema', () => {
        const { valid, errors } = validateSchema(fixture);
        if (!valid) console.error(errors);
        expect(valid).toBe(true);
        expect(errors).toBeNull();
    });

    test('CIDM-002: acepta una extracción válida según las invariantes semánticas', () => {
        expect(() => validateSemanticIntegrity(fixture)).not.toThrow();
    });

    test('CIDM-003: rechaza un documento sin provenance', () => {
        const invalid = structuredClone(fixture);
        delete invalid.meta.provenance;
        expect(validateSchema(invalid).valid).toBe(false);
    });

    test('CIDM-004: rechaza una story sin blocks', () => {
        const invalid = structuredClone(fixture);
        invalid.stories[0].blocks = [];
        expect(validateSchema(invalid).valid).toBe(false);
    });

    test('CIDM-005: rechaza un styleId de párrafo inexistente', () => {
        const invalid = structuredClone(fixture);
        invalid.stories[0].blocks[0].styleId = 'style-p-DOES-NOT-EXIST';
        expect(validateSchema(invalid).valid).toBe(true);
        expect(() => validateSemanticIntegrity(invalid)).toThrow('Estilo de párrafo no declarado');
    });

    test('CIDM-006: rechaza un styleId de carácter inexistente', () => {
        const invalid = structuredClone(fixture);
        // El bloque 1 es el que tiene fragmentos y usa styleId (contrato actual)
        invalid.stories[0].blocks[1].fragments[0].styleId = 'style-c-DOES-NOT-EXIST';
        expect(validateSchema(invalid).valid).toBe(true);
        expect(() => validateSemanticIntegrity(invalid)).toThrow('Estilo de carácter no declarado');
    });

    test('CIDM-007: rechaza fragments que alteran el texto original', () => {
        const invalid = structuredClone(fixture);
        invalid.stories[0].blocks[1].fragments[0].text = 'Texto Modificado Silenciosamente.';
        expect(validateSchema(invalid).valid).toBe(true);
        expect(() => validateSemanticIntegrity(invalid)).toThrow('Los fragments no coinciden con el texto del párrafo');
    });

    test('CIDM-008: preserva la neutralidad semántica del modelo', () => {
        const invalid = structuredClone(fixture);
        invalid.stories[0].blocks[0].interpretation = 'fake';
        expect(validateSchema(invalid).valid).toBe(false);
    });

    test('CIDM-009: mantiene identidad estable de stories y blocks', () => {
        const firstStoryId = fixture.stories[0].storyId;
        const firstBlockId = fixture.stories[0].blocks[0].blockId;
        expect(typeof firstStoryId).toBe('string');
        expect(typeof firstBlockId).toBe('string');
        expect(firstStoryId.length).toBeGreaterThan(0);
        expect(firstBlockId.length).toBeGreaterThan(0);
    });

    test('CIDM-010: acepta una extracción OCR simulada', () => {
        const ocrDocument = structuredClone(fixture);
        ocrDocument.meta.source.type = 'OCR';
        ocrDocument.meta.source.id = 'ocr-output.txt';
        ocrDocument.stories[0].blocks[0].fragments = [];
        ocrDocument.stories[0].blocks[0].text = 'Texto OCR';
        const { valid } = validateSchema(ocrDocument);
        expect(valid).toBe(true);
        expect(() => validateSemanticIntegrity(ocrDocument)).not.toThrow();
    });
});