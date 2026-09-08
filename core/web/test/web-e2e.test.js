'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const { compile, extractNodeText } = require('../../compiler/src/semanticCompiler');
const { renderHtml } = require('../WebRenderer');

const RAIZ = path.join(__dirname, '..', '..', '..');
const RUTA_CIDM = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');

describe('MVP-006 E2E: CIDM → LEDM → HTML5', () => {
    test('El pipeline completo produce HTML para la Constitución real', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html = renderHtml(ledm);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<main>');
        expect(html).toContain('<nav');
        expect(html).toContain('<article');
    });

    test('La fidelidad textual se conserva en el HTML', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html = renderHtml(ledm);
        const $ = cheerio.load(html);

        const textHtml = $('main').text().replace(/\s+/g, '').trim();
		const textLedm = ledm.structure.blocks
			.map(block => extractNodeText(block))
			.join('')
			.replace(/\s+/g, '')
			.trim();
		expect(textHtml).toBe(textLedm);
    });

    test('Los nodeId son únicos y válidos', () => {
    const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
    const ledm = compile(cidm);
    const html = renderHtml(ledm);
    const $ = cheerio.load(html);
    const ids = [];

    $('[id]').each((_, el) => {
        const id = $(el).attr('id');
        if (id !== 'static-index') {   // excluir ID interno del script JSON
            ids.push(id);
        }
    });

    const regex = /^[A-Z][A-Z0-9_-]*$/;
    const unique = new Set(ids);
    expect(ids.length).toBeGreaterThan(0);
    expect(unique.size).toBe(ids.length);
    ids.forEach(id => {
        expect(regex.test(id)).toBe(true);
    });
});

    test('Los enlaces internos apuntan a IDs existentes', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html = renderHtml(ledm);
        const $ = cheerio.load(html);
        const ids = new Set();

        $('[id]').each((_, el) => {
            ids.add($(el).attr('id'));
        });

        $('a[href^="#"]').each((_, el) => {
            const href = $(el).attr('href').slice(1);
            expect(ids.has(href)).toBe(true);
        });
    });

    test('La estructura main → section → article → p es correcta', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html = renderHtml(ledm);
        const $ = cheerio.load(html);

        expect($('main > section').length).toBeGreaterThan(0);
		expect($('main article').length).toBeGreaterThan(0);
		expect($('main p').length).toBeGreaterThan(0);
    });

    test('Los headings no saltan niveles', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html = renderHtml(ledm);
        const $ = cheerio.load(html);
        const niveles = [];

        $('main h1, main h2, main h3, main h4, main h5, main h6').each((_, el) => {
            niveles.push(parseInt(el.name.slice(1)));
        });

        for (let i = 1; i < niveles.length; i++) {
            const diff = niveles[i] - niveles[i - 1];
            expect(diff).toBeGreaterThanOrEqual(0);
            expect(diff).toBeLessThanOrEqual(1);
        }
    });

    test('El renderizado es determinista', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const html1 = renderHtml(ledm);
        const html2 = renderHtml(ledm);
        expect(html1).toBe(html2);
    });

    test('El LEDM original no es mutado', () => {
        const cidm = JSON.parse(fs.readFileSync(RUTA_CIDM, 'utf8'));
        const ledm = compile(cidm);
        const antes = JSON.stringify(ledm);
        renderHtml(ledm);
        const despues = JSON.stringify(ledm);
        expect(despues).toBe(antes);
    });
});