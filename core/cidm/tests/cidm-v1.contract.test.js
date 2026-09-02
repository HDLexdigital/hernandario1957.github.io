'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const schemaPath = path.join(
    __dirname,
    '..',
    'schemas',
    'cidm-v1.0.schema.json'
);

const fixturePath = path.join(
    __dirname,
    '..',
    'fixtures',
    'indesign-extraction.valid.json'
);

const schema = JSON.parse(
    fs.readFileSync(schemaPath, 'utf8')
);

const fixture = JSON.parse(
    fs.readFileSync(fixturePath, 'utf8')
);

/**
 * Valida las invariantes semánticas que JSON Schema
 * no puede expresar por sí solo.
 */
function validateSemanticIntegrity(cidm) {
    if (!cidm || typeof cidm !== 'object') {
        throw new Error('CIDM debe ser un objeto');
    }

    if (!cidm.styles) {
        throw new Error('CIDM debe contener styles');
    }

    if (!cidm.stories || !Array.isArray(cidm.stories)) {
        throw new Error('CIDM debe contener stories');
    }

    const paragraphStyles = cidm.styles.paragraph || {};
    const characterStyles = cidm.styles.character || {};

    for (const story of cidm.stories) {
        if (!Array.isArray(story.paragraphs)) {
            throw new Error(
                `La story ${story.storyId} debe contener paragraphs`
            );
        }

        for (const paragraph of story.paragraphs) {
            if (!Object.prototype.hasOwnProperty.call(
                paragraphStyles,
                paragraph.styleId
            )) {
                throw new Error(
                    `Estilo de párrafo no declarado: ${paragraph.styleId}`
                );
            }

            if (!Array.isArray(paragraph.fragments)) {
                continue;
            }

            const concatenatedText = paragraph.fragments
                .map(fragment => fragment.text)
                .join('');

            if (concatenatedText !== paragraph.text) {
                throw new Error(
                    `Los fragments no coinciden con el texto del párrafo: ${paragraph.paragraphId}`
                );
            }

            for (const fragment of paragraph.fragments) {
                const characterStyleId =
                    fragment.characterStyleId;

                if (
                    characterStyleId !== null &&
                    !Object.prototype.hasOwnProperty.call(
                        characterStyles,
                        characterStyleId
                    )
                ) {
                    throw new Error(
                        `Estilo de carácter no declarado: ${characterStyleId}`
                    );
                }
            }
        }
    }

    return true;
}

describe('CIDM-1.0-CONTRACT', () => {
    let ajv;
    let validateSchema;

    beforeAll(() => {
        ajv = new Ajv({
            allErrors: true,
            strict: true
        });

        addFormats(ajv);

        validateSchema = ajv.compile(schema);
    });

    test('CIDM-001: acepta una extracción válida según JSON Schema', () => {
        const valid = validateSchema(fixture);

        if (!valid) {
            console.error(validateSchema.errors);
        }

        expect(valid).toBe(true);
        expect(validateSchema.errors).toBeNull();
    });

    test('CIDM-002: acepta una extracción válida según las invariantes semánticas', () => {
        expect(() => {
            validateSemanticIntegrity(fixture);
        }).not.toThrow();
    });

    test('CIDM-003: rechaza un documento sin provenance', () => {
        const invalid = structuredClone(fixture);

        delete invalid.meta.provenance;

        expect(validateSchema(invalid)).toBe(false);
    });

    test('CIDM-004: rechaza una story sin paragraphs', () => {
        const invalid = structuredClone(fixture);

        invalid.stories[0].paragraphs = [];

        expect(validateSchema(invalid)).toBe(false);
    });

    test('CIDM-005: rechaza un styleId de párrafo inexistente', () => {
        const invalid = structuredClone(fixture);

        invalid.stories[0].paragraphs[0].styleId =
            'style-p-DOES-NOT-EXIST';

        expect(validateSchema(invalid)).toBe(true);

        expect(() => {
            validateSemanticIntegrity(invalid);
        }).toThrow(
            'Estilo de párrafo no declarado'
        );
    });

    test('CIDM-006: rechaza un characterStyleId inexistente', () => {
        const invalid = structuredClone(fixture);

        invalid.stories[0]
            .paragraphs[1]
            .fragments[0]
            .characterStyleId = 'style-c-DOES-NOT-EXIST';

        expect(validateSchema(invalid)).toBe(true);

        expect(() => {
            validateSemanticIntegrity(invalid);
        }).toThrow(
            'Estilo de carácter no declarado'
        );
    });

    test('CIDM-007: rechaza fragments que alteran el texto original', () => {
        const invalid = structuredClone(fixture);

        invalid.stories[0]
            .paragraphs[1]
            .fragments[0]
            .text = 'Texto Modificado Silenciosamente.';

        expect(validateSchema(invalid)).toBe(true);

        expect(() => {
            validateSemanticIntegrity(invalid);
        }).toThrow(
            'Los fragments no coinciden con el texto del párrafo'
        );
    });

    test('CIDM-008: preserva la neutralidad semántica del modelo', () => {
        const semanticKeys = new Set([
            'article',
            'amends',
            'develops',
            'referencedBy',
            'legalMeaning',
            'interpretation',
            'ia_summary'
        ]);

        const inspectObject = value => {
            if (!value || typeof value !== 'object') {
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(inspectObject);
                return;
            }

            for (const key of Object.keys(value)) {
                expect(
                    semanticKeys.has(key)
                ).toBe(false);

                inspectObject(value[key]);
            }
        };

        inspectObject(fixture);
    });

    test('CIDM-009: mantiene identidad estable de stories y paragraphs', () => {
        for (const story of fixture.stories) {
            expect(story.storyId).toEqual(
                expect.any(String)
            );

            expect(story.order).toEqual(
                expect.any(Number)
            );

            for (const paragraph of story.paragraphs) {
                expect(paragraph.paragraphId).toEqual(
                    expect.any(String)
                );

                expect(paragraph.order).toEqual(
                    expect.any(Number)
                );
            }
        }
    });

    test('CIDM-010: acepta una extracción OCR simulada', () => {
        const ocrDocument = structuredClone(fixture);

        ocrDocument.meta.source = {
            type: 'OCR',
            id: 'scan-001'
        };

        ocrDocument.meta.provenance = {
            extractor: {
                name: 'OCRAdapter',
                version: '1.0.0'
            }
        };

        // Redefinir estilos para aislarlo del mock de InDesign
        ocrDocument.styles = {
            paragraph: {
                "style-p-ocr": {
                    "nativeName": "OCR_BODY_BASE",
                    "properties": {}
                }
            },
            character: {}
        };

        ocrDocument.stories = [
            {
                storyId: 'ocr-story-001',
                order: 0,
                paragraphs: [
                    {
                        paragraphId: 'ocr-story-001-p001',
                        order: 0,
                        text: 'Texto desde OCR.',
                        styleId: 'style-p-ocr',
                        fragments: [
                            {
                                text: 'Texto desde OCR.',
                                characterStyleId: null
                            }
                        ]
                    }
                ]
            }
        ];

        expect(validateSchema(ocrDocument)).toBe(true);

        expect(() => {
            validateSemanticIntegrity(ocrDocument);
        }).not.toThrow();
    });
});