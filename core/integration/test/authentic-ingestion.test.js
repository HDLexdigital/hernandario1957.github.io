'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const cidmSchema = JSON.parse(
    fs.readFileSync(
        path.join(
            __dirname,
            '..',
            '..',
            'cidm',
            'schemas',
            'cidm-v1.0.schema.json'
        ),
        'utf8'
    )
);

const ledmSchema = JSON.parse(
    fs.readFileSync(
        path.join(
            __dirname,
            '..',
            '..',
            'ledm',
            'schemas',
            'ledm-v2.0.schema.json'
        ),
        'utf8'
    )
);

const authenticFixturePath = path.join(
    __dirname,
    '..',
    'fixtures',
    'authentic',
    'CIDM_real.json'
);

const {
    compile: compileCIDMToLEDM,
    extractNodeText
} = require('../../compiler/src/semanticCompiler');

const {
    renderLedmToHtml
} = require('../../accessibility/src/engine');

describe('AUTHENTIC INGESTION (CIDM real → LEDM → HTML)', () => {
    let ajv;
    let validateCidm;
    let validateLedm;
    let cidmReal;

    beforeAll(() => {
        ajv = new Ajv({ allErrors: true });
        addFormats(ajv);

        validateCidm = ajv.compile(cidmSchema);
        validateLedm = ajv.compile(ledmSchema);

        cidmReal = JSON.parse(
            fs.readFileSync(authenticFixturePath, 'utf8')
        );
    });

    test('AUTH-001: el archivo CIDM_real.json existe y carga', () => {
        expect(fs.existsSync(authenticFixturePath)).toBe(true);
        expect(cidmReal).toBeDefined();
        expect(cidmReal.meta.model).toBe('CIDM-1.0');
    });

    test('AUTH-002: CIDM real válido contra schema', () => {
        const isValid = validateCidm(cidmReal);

        if (!isValid) {
            console.error(
                '\n🔥 ERRORES SCHEMA CIDM:\n',
                JSON.stringify(validateCidm.errors, null, 2)
            );
        }

        expect(isValid).toBe(true);
    });

    test('AUTH-003: CIDM real → LEDM válido', () => {
        const ledm = compileCIDMToLEDM(cidmReal);
        const isValid = validateLedm(ledm);

        if (!isValid) {
            console.error(
                '\n🔥 ERRORES SCHEMA LEDM:\n',
                JSON.stringify(validateLedm.errors, null, 2)
            );
        }

        expect(isValid).toBe(true);
    });

    test('AUTH-004: fidelidad textual CIDM → LEDM', () => {
        const ledm = compileCIDMToLEDM(cidmReal);

        // ================================================================
        // SONDA FORENSE
        // ================================================================

        console.error('\n🔎 FORENSIA AUTH-004');

        console.error(
            'CIDM stories:',
            cidmReal.stories.length
        );

        console.error(
            'CIDM blocks:',
            cidmReal.stories.reduce(
                (total, story) => total + story.blocks.length,
                0
            )
        );

        console.error(
            'LEDM structure.blocks:',
            ledm.structure.blocks.length
        );

        // ================================================================
        // EXTRACCIÓN TEXTUAL
        // ================================================================

        const textosOriginales = cidmReal.stories.flatMap(
            story =>
                story.blocks.map(
                    block => block.text
                )
        );

        const textosLedm = ledm.structure.blocks.map(
            block => extractNodeText(block)
        );

        // ================================================================
        // DIAGNÓSTICO DE CANTIDAD
        // ================================================================

        if (textosOriginales.length !== textosLedm.length) {
            console.error(
                '\n🔥 MISMATCH DE CANTIDAD: CIDM tiene ' +
                textosOriginales.length +
                ' bloques, pero LEDM compiló ' +
                textosLedm.length +
                ' bloques.'
            );
        }

        // ================================================================
        // DIAGNÓSTICO DE PRIMERA DESVIACIÓN
        // ================================================================

        for (
            let i = 0;
            i < Math.max(
                textosOriginales.length,
                textosLedm.length
            );
            i++
        ) {
            if (textosOriginales[i] !== textosLedm[i]) {
                console.error(
                    '\n🔥 DESVIACIÓN TEXTUAL EN ÍNDICE ' +
                    i +
                    ':'
                );

                console.error(
                    '   ESPERADO (CIDM): ' +
                    JSON.stringify(textosOriginales[i])
                );

                console.error(
                    '   RECIBIDO (LEDM): ' +
                    JSON.stringify(textosLedm[i])
                );

                // Solo mostramos la primera desviación.
                break;
            }
        }

        expect(textosLedm).toEqual(textosOriginales);
    });

    test(
        'AUTH-005: LEDM → HTML sin pérdida textual (fidelidad de publicación)',
        () => {
            const ledm = compileCIDMToLEDM(cidmReal);
            const html = renderLedmToHtml(ledm);
            const $ = cheerio.load(html);

            const textoHtml = $('main')
                .text()
                .replace(/\s+/g, ' ')
                .trim();

            const textoLedm = ledm.structure.blocks
                .map(block => extractNodeText(block))
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            expect(textoHtml).toBe(textoLedm);
        }
    );

    test('AUTH-006: HTML determinista', () => {
        const ledm = compileCIDMToLEDM(cidmReal);

        const html1 = renderLedmToHtml(ledm);
        const html2 = renderLedmToHtml(ledm);

        expect(html1).toBe(html2);
    });

    test('AUTH-007: LEDM no mutado durante render', () => {
        const ledm = compileCIDMToLEDM(cidmReal);
        const snapshot = JSON.stringify(ledm);

        renderLedmToHtml(ledm);

        expect(JSON.stringify(ledm)).toBe(snapshot);
    });

    test(
        'AUTH-008: cobertura de fragments (reconstrucción exacta por bloque)',
        () => {
            for (const story of cidmReal.stories) {
                for (const block of story.blocks) {
                    const reconstructed = (block.fragments || [])
                        .map(fragment => fragment.text)
                        .join('');

                    expect(reconstructed).toBe(block.text);
                }
            }
        }
    );
});
