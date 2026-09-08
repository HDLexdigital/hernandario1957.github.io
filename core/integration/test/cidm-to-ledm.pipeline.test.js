'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const cidmSchemaPath = path.join(__dirname, '..', '..', 'cidm', 'schemas', 'cidm-v1.0.schema.json');
const ledmSchemaPath = path.join(__dirname, '..', '..', 'ledm', 'schemas', 'ledm-v2.0.schema.json');
const fixturePath = path.join(__dirname, '..', 'fixtures', 'cidm-integration.valid.json');

const { compile: compileCIDMToLEDM, extractNodeText } = require('../../compiler/src/semanticCompiler');

const cidmSchema = JSON.parse(fs.readFileSync(cidmSchemaPath, 'utf8'));
const ledmSchema = JSON.parse(fs.readFileSync(ledmSchemaPath, 'utf8'));
const cidmFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

describe('CIDM-TO-LEDM-PIPELINE', () => {
    let ajv;
    let validateCidm;
    let validateLedm;

    beforeAll(() => {
        ajv = new Ajv({ allErrors: true });
        addFormats(ajv);
        validateCidm = ajv.compile(cidmSchema);
        validateLedm = ajv.compile(ledmSchema);
    });

    test('INT-001: CIDM válido → LEDM válido', () => {
        expect(validateCidm(cidmFixture)).toBe(true);
        const ledm = compileCIDMToLEDM(cidmFixture);
        const ledmValid = validateLedm(ledm);
        if (!ledmValid) console.error('ERROR DE VALIDACIÓN LEDM:', validateLedm.errors);
        expect(ledmValid).toBe(true);
    });

    test('INT-002: identidad y orden documental conservados', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        const idsOriginales = cidmFixture.stories
            .flatMap(story => story.blocks.map(b => b.blockId));
        const idsLedm = ledm.structure.blocks.map(b => b.nodeId);
        expect(idsLedm).toEqual(idsOriginales.map(id => id.toUpperCase()));
    });

    test('INT-003: texto normativo conservado exactamente', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        const textosOriginales = cidmFixture.stories
            .flatMap(story => story.blocks.map(b => b.text));
        const textosLedm = ledm.structure.blocks.map(block => extractNodeText(block));
        expect(textosLedm).toEqual(textosOriginales);
    });

    test('INT-004: mapeo semántico determinado por la ontología', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        expect(ledm.structure.blocks[0].type).toBe('title');
        expect(ledm.structure.blocks[1].type).toBe('paragraph');
        const children = ledm.structure.blocks[1].children;
        expect(children.some(child => child.type === 'strong')).toBe(true);
    });

    test('INT-005: datos de presentación nativos no contaminan el dominio', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        const clavesProhibidas = ['styleId', 'fontSize', 'fontFamily', 'alignment', 'nativeName'];
        const revisar = obj => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(key => {
                expect(clavesProhibidas).not.toContain(key);
                revisar(obj[key]);
            });
        };
        revisar(ledm);
    });

    test('INT-006: datos generativos/IA no contaminan la fuente normativa', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        const iaKeys = ['interpretation', 'summary', 'confidence', 'legalMeaning', 'ia_summary'];
        const revisar = obj => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(key => {
                expect(iaKeys).not.toContain(key);
                revisar(obj[key]);
            });
        };
        revisar(ledm);
    });

    test('INT-007: provenance conservada', () => {
        const ledm = compileCIDMToLEDM(cidmFixture);
        expect(ledm.provenance.sourceType).toBe(cidmFixture.meta.source.type);
        expect(ledm.provenance.sourceId).toBe(cidmFixture.meta.source.id);
        expect(ledm.provenance.retrievedAt).toBe(cidmFixture.meta.createdAt);
    });

    test('INT-008: compilación determinista', () => {
        const ledm1 = compileCIDMToLEDM(cidmFixture);
        const ledm2 = compileCIDMToLEDM(cidmFixture);
        expect(JSON.stringify(ledm1)).toBe(JSON.stringify(ledm2));
    });

    test('INT-009: CIDM de entrada no mutado', () => {
        const snapshot = JSON.stringify(cidmFixture);
        compileCIDMToLEDM(cidmFixture);
        expect(JSON.stringify(cidmFixture)).toBe(snapshot);
    });
});