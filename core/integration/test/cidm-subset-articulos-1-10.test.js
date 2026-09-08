'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Rutas
const cidmSchemaPath = path.join(__dirname, '..', '..', 'cidm', 'schemas', 'cidm-v1.0.schema.json');
const subsetPath = path.join(__dirname, '..', 'fixtures', 'authentic', 'CIDM_subset_articulos_1_10.json');
const realCidmPath = path.join(__dirname, '..', 'fixtures', 'authentic', 'CIDM_real.json');

const cidmSchema = JSON.parse(fs.readFileSync(cidmSchemaPath, 'utf8'));
const subset = JSON.parse(fs.readFileSync(subsetPath, 'utf8'));
const realCidm = JSON.parse(fs.readFileSync(realCidmPath, 'utf8'));

function validateSchema(data) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(cidmSchema);
    return { valid: validate(data), errors: validate.errors || null };
}

describe('CIDM SUBSET ARTÍCULOS 1–10', () => {
    test('El subset cumple el schema CIDM 1.0', () => {
        const { valid, errors } = validateSchema(subset);
        if (!valid) console.error(errors);
        expect(valid).toBe(true);
        expect(errors).toBeNull();
    });

    test('Contiene exactamente 13 bloques', () => {
        const totalBlocks = subset.stories[0].blocks.length;
        expect(totalBlocks).toBe(13);
    });

    test('Conserva los blockId originales y su orden', () => {
        const subsetIds = subset.stories[0].blocks.map(b => b.blockId);
        const realSegmentIds = realCidm.stories
            .find(s => s.storyId === subset.stories[0].storyId)
            .blocks
            .filter(b =>
                (b.styleId === 'style-p-p01_body_base' || b.styleId === 'style-p-p01_body_cont') &&
                /^Artículo\s+(1|2|3|4|5|6|7|8|9|10)\./i.test(b.text || '') ||
                b.blockId >= 'story-001-b0007' && b.blockId <= 'story-001-b0019'
            )
            .map(b => b.blockId);
        expect(subsetIds).toEqual(realSegmentIds);
    });

    test('Incluye las continuaciones body_cont correctas', () => {
        const bodyContBlocks = subset.stories[0].blocks.filter(b => b.styleId === 'style-p-p01_body_cont');
        expect(bodyContBlocks.length).toBe(3); // Artículos 2, 4 y 9
    });

    test('No incluye entradas de índice (style-p-p05_idx_art)', () => {
        const indexBlocks = subset.stories[0].blocks.filter(b => b.styleId === 'style-p-p05_idx_art');
        expect(indexBlocks.length).toBe(0);
    });

    test('Texto normativo conservado exactamente', () => {
        for (const block of subset.stories[0].blocks) {
            const originalBlock = realCidm.stories
                .find(s => s.storyId === subset.stories[0].storyId)
                .blocks.find(b => b.blockId === block.blockId);
            expect(originalBlock).toBeDefined();
            expect(block.text).toBe(originalBlock.text);
        }
    });

    test('Cobertura de fragments intacta', () => {
        for (const block of subset.stories[0].blocks) {
            if (block.fragments.length > 0) {
                const reconstructed = block.fragments.map(f => f.text).join('');
                expect(reconstructed).toBe(block.text);
            }
        }
    });
});