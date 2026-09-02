'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const cidmSchemaPath = path.join(__dirname, '..', '..', 'cidm', 'schemas', 'cidm-v1.0.schema.json');
const ledmSchemaPath = path.join(__dirname, '..', '..', 'ledm', 'schemas', 'ledm-v2.0.schema.json');
const cidmFixturePath = path.join(__dirname, '..', 'fixtures', 'cidm-valid.json');

const { compile, extractNodeText } = require('../src/semanticCompiler');

const cidmSchema = JSON.parse(fs.readFileSync(cidmSchemaPath, 'utf8'));
const ledmSchema = JSON.parse(fs.readFileSync(ledmSchemaPath, 'utf8'));
const cidmFixture = JSON.parse(fs.readFileSync(cidmFixturePath, 'utf8'));

function validateAgainst(schema, data) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    return { valid: validate(data), errors: validate.errors || null };
}

describe('SEMANTIC-COMPILER-001', () => {
    test('CIDM válido → LEDM válido', () => {
        const ledm = compile(cidmFixture);
        expect(ledm).toBeDefined();
        expect(ledm.structure.blocks).toHaveLength(2);
    });

    test('título CIDM → title LEDM', () => {
        const ledm = compile(cidmFixture);
        expect(ledm.structure.blocks[0].type).toBe('title');
    });

    test('cuerpo CIDM → paragraph LEDM', () => {
        const ledm = compile(cidmFixture);
        expect(ledm.structure.blocks[1].type).toBe('paragraph');
    });

    test('characterStyle → inline semantic node', () => {
        const ledm = compile(cidmFixture);
        const block1 = ledm.structure.blocks[1];
        expect(block1.children.some(child => child.type === 'strong')).toBe(true);
    });

    test('texto preservado byte/Unicode-equivalent', () => {
        const ledm = compile(cidmFixture);
        const text0 = extractNodeText(ledm.structure.blocks[0]);
        const text1 = extractNodeText(ledm.structure.blocks[1]);
        expect(text0).toBe(cidmFixture.stories[0].blocks[0].text);
        expect(text1).toBe(cidmFixture.stories[0].blocks[1].text);
    });

    test('orden preservado', () => {
        const ledm = compile(cidmFixture);
        const ids = ledm.structure.blocks.map(b => b.nodeId);
        expect(ids).toEqual(['story-001-b0001', 'story-001-b0002']);
    });

    test('identidad/provenance preservada', () => {
        const ledm = compile(cidmFixture);
        expect(ledm.provenance.sourceType).toBe('INDESIGN');
        expect(ledm.provenance.sourceId).toBe(cidmFixture.meta.source.id);
    });

    test('estilos nativos NO contaminan LEDM', () => {
        const ledm = compile(cidmFixture);
        expect(ledm.structure.blocks[0]).not.toHaveProperty('styleId');
        expect(ledm.structure.blocks[0]).not.toHaveProperty('fontSize');
        expect(ledm.structure.blocks[0]).not.toHaveProperty('P01_BODY_BASE');
    });

    test('propiedades IA NO aparecen', () => {
        const ledm = compile(cidmFixture);
        const json = JSON.stringify(ledm);
        expect(json).not.toContain('interpretation');
        expect(json).not.toContain('summary');
        expect(json).not.toContain('confidence');
    });

    test('resultado valida contra LEDM 2.0', () => {
        const ledm = compile(cidmFixture);
        const { valid, errors } = validateAgainst(ledmSchema, ledm);
        if (!valid) console.error(errors);
        expect(valid).toBe(true);
    });

    test('estilo desconocido → comportamiento explícito', () => {
        const invalid = structuredClone(cidmFixture);
        invalid.stories[0].blocks[0].styleId = 'style-p-UNKNOWN';
        expect(() => compile(invalid)).toThrow('Estilo de párrafo no soportado');
    });

    test('compilación determinista', () => {
        const ledm1 = compile(cidmFixture);
        const ledm2 = compile(cidmFixture);
        expect(JSON.stringify(ledm1)).toBe(JSON.stringify(ledm2));
    });
});