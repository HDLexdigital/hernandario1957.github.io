'use strict';

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');
const cheerio = require('cheerio');

const { compile, extractNodeText } = require('../../compiler/src/semanticCompiler');
const { generateEpub } = require('../../epub/EpubGenerator');

const cidmFullPath = path.join(__dirname, '..', 'fixtures', 'authentic', 'CIDM_real.json');
const epubFullPath = path.join(__dirname, '..', '..', '..', 'publication_full.epub');

let ledmFull;
let epubBuffer;

async function extractTextFromEpubBuffer(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const entries = Object.keys(zip.files).filter(name =>
        name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
    ).sort();
    let allText = '';
    for (const name of entries) {
        const content = await zip.file(name).async('string');
        const $ = cheerio.load(content);
        allText += $('body').text().replace(/\s+/g, ' ').trim() + '\n';
    }
    return allText.replace(/\n$/, '');
}

async function hashEpubContents(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const entries = Object.keys(zip.files)
        .filter(name => !zip.files[name].dir)
        .sort();
    const hashes = [];
    for (const name of entries) {
        const content = await zip.file(name).async('nodebuffer');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        hashes.push(`${name}:${hash}`);
    }
    return hashes.join('\n');
}

function runAxeOnHtml(html) {
    return new Promise((resolve, reject) => {
        const dom = new JSDOM(html, { url: 'http://localhost/' });
        global.window = dom.window;
        global.document = dom.window.document;
        const root = dom.window.document.documentElement;
        axe.run(root, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, (err, results) => {
            delete global.window;
            delete global.document;
            if (err) reject(err);
            else resolve(results);
        });
    });
}

describe('LDX-2.0-MVP-004: Escalamiento a la Constitución Completa', () => {
    beforeAll(async () => {
        const cidmFull = JSON.parse(fs.readFileSync(cidmFullPath, 'utf8'));
        ledmFull = compile(cidmFull);
        epubBuffer = await generateEpub(ledmFull);
        fs.writeFileSync(epubFullPath, epubBuffer);
    }, 30000);

    test('MVP004-001: Rendimiento aceptable (< 30s)', async () => {
        // Ya medido en beforeAll, pero verificamos que se generó
        expect(epubBuffer).toBeDefined();
    });

    test('MVP004-002: EPUB existe y es ZIP válido', async () => {
        expect(Buffer.isBuffer(epubBuffer)).toBe(true);
        const zip = await JSZip.loadAsync(epubBuffer);
        expect(Object.keys(zip.files).length).toBeGreaterThan(0);
    });

    test('MVP004-003: Agrupación estructural (XHTML << 4223)', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const xhtmlEntries = Object.keys(zip.files).filter(name =>
            name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
        );
        expect(xhtmlEntries.length).toBeGreaterThan(0);
        expect(xhtmlEntries.length).toBeLessThan(4000);
        console.log(`XHTML generados: ${xhtmlEntries.length}`);
    });

    test('MVP004-004: Determinismo del contenido', async () => {
    const buffer2 = await generateEpub(ledmFull);
    const hash1 = await hashEpubContents(epubBuffer);
    const hash2 = await hashEpubContents(buffer2);
    expect(hash1).toBe(hash2);
});

    test('MVP004-005: Accesibilidad secuencial sin memory leaks (axe-core)', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const entries = Object.keys(zip.files).filter(name =>
            name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
        );
        const violations = [];
        for (const name of entries) {
            const content = await zip.file(name).async('string');
            const results = await runAxeOnHtml(content);
            violations.push(...results.violations);
        }
        const critical = violations.filter(v => v.impact === 'critical');
        const serious = violations.filter(v => v.impact === 'serious');
        expect(critical.length).toBe(0);
        expect(serious.length).toBe(0);
    }, 30000); // Tiempo extendido para la auditoría secuencial

    test('MVP004-006: Fidelidad textual completa', async () => {
        const textLedm = ledmFull.structure.blocks
            .map(block => extractNodeText(block))
            .join('\n')
            .replace(/\s+/g, ' ')
            .trim();
        const textEpub = (await extractTextFromEpubBuffer(epubBuffer)).replace(/\s+/g, ' ').trim();
        expect(textEpub).toBe(textLedm);
    });
});