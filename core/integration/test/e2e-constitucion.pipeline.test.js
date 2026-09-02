'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const cidmSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'cidm', 'schemas', 'cidm-v1.0.schema.json'), 'utf8')
);
const ledmSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'ledm', 'schemas', 'ledm-v2.0.schema.json'), 'utf8')
);
const cidmFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'adapters', 'indesign', 'fixtures', 'constitucion_CIDM.json'), 'utf8')
);

const { compile: compileCIDMToLEDM, extractNodeText } = require('../../compiler/src/semanticCompiler');
const { renderLedmToHtml } = require('../../accessibility/src/engine');

describe('E2E CONSTITUCIÓN → CIDM → LEDM → HTML', () => {
  let ajv, validateCidm, validateLedm;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validateCidm = ajv.compile(cidmSchema);
    validateLedm = ajv.compile(ledmSchema);
  });

  test('E2E-001: CIDM realista válido', () => {
    expect(validateCidm(cidmFixture)).toBe(true);
  });

  test('E2E-002: CIDM → LEDM válido', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    expect(validateLedm(ledm)).toBe(true);
  });

  test('E2E-003: fidelidad textual CIDM → LEDM', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    const textosOriginales = cidmFixture.stories
      .flatMap(story => story.paragraphs.map(p => p.text));
    const textosLedm = ledm.structure.blocks.map(block => extractNodeText(block));
    expect(textosLedm).toEqual(textosOriginales);
  });

  test('E2E-004: LEDM → HTML sin pérdida textual (fidelidad de publicación)', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    const html = renderLedmToHtml(ledm);
    const $ = cheerio.load(html);

    // Extraer SOLO el contenido principal (excluye header y nav)
    const textoHtml = $('main').text().replace(/\s+/g, ' ').trim();
    
    const textoLedm = ledm.structure.blocks
      .map(block => extractNodeText(block))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    expect(textoHtml).toBe(textoLedm);
  });

  test('E2E-005: HTML determinista', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    const html1 = renderLedmToHtml(ledm);
    const html2 = renderLedmToHtml(ledm);
    expect(html1).toBe(html2);
  });

  test('E2E-006: LEDM no mutado durante render', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    const snapshot = JSON.stringify(ledm);
    renderLedmToHtml(ledm);
    expect(JSON.stringify(ledm)).toBe(snapshot);
  });

  test('E2E-007: HTML contiene landmarks y navegación', () => {
    const ledm = compileCIDMToLEDM(cidmFixture);
    const html = renderLedmToHtml(ledm);
    const $ = cheerio.load(html);

    expect($('header').length).toBeGreaterThan(0);
    expect($('nav[aria-label="Navegación del documento"]').length).toBe(1);
    expect($('main').length).toBe(1);
    expect($('article').length).toBeGreaterThan(0);
  });
});