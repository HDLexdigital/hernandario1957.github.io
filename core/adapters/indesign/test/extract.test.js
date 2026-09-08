'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const cidmSchema = require('../../../cidm/schemas/cidm-v1.0.schema.json');
const cidmFixture = require('../fixtures/constitucion_CIDM.json');

describe('LDX-2.0-MVP-001-A: Auténtica Ingestión (Validación Forense)', () => {
    test('1. El JSON extraído es estructuralmente válido según CIDM 1.0', () => {
        const ajv = new Ajv({ allErrors: true });
        const validate = ajv.compile(cidmSchema);
        const isValid = validate(cidmFixture);
        
        if (!isValid) console.error('Errores de esquema:', validate.errors);
        expect(isValid).toBe(true);
    });

    test('2. Fidelidad Fragmentaria: block.text es exactamente igual a la concatenación de fragments[].text', () => {
        let totalBlocks = 0;
        
        cidmFixture.stories.forEach(story => {
            story.blocks.forEach(block => {
                const reconstructedText = block.fragments.map(f => f.text).join('');
                
                // La prueba de oro de tu extractor
                expect(reconstructedText).toBe(block.text);
                totalBlocks++;
            });
        });
        
        // Verificamos que efectivamente testeamos bloques (evita falsos positivos por arrays vacíos)
        expect(totalBlocks).toBeGreaterThan(0);
    });
});