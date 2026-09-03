'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');
const cheerio = require('cheerio');

const subsetFixturePath = path.join(__dirname, '..', 'fixtures', 'authentic', 'CIDM_subset_articulos_1_10.json');
const { compile, extractNodeText } = require('../../compiler/src/semanticCompiler');
const { generateEpub } = require('../../epub/EpubGenerator');

const cidm = JSON.parse(fs.readFileSync(subsetFixturePath, 'utf8'));
const ledm = compile(cidm);

async function extractTextFromEpubBuffer(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const entries = Object.keys(zip.files).filter(n => n.startsWith('OEBPS/xhtml/') && n.endsWith('.xhtml')).sort();
    let all = '';
    for (const name of entries) {
        const content = await zip.file(name).async('string');
        const $ = cheerio.load(content);
        all += $('body').text().replace(/\s+/g, ' ').trim() + '\n';
    }
    return all.replace(/\n$/, '');
}

function extractLedmText(ledm) {
    return ledm.structure.blocks.map(b => extractNodeText(b)).join('\n');
}

async function hashEpubContents(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const entries = Object.keys(zip.files)
        .filter(name => !zip.files[name].dir)   // solo archivos, no carpetas
        .sort();
    const hashes = [];
    for (const name of entries) {
        const content = await zip.file(name).async('nodebuffer');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        hashes.push(`${name}:${hash}`);
    }
    return hashes.join('\n');
}

describe('EPUB GENERATOR (MVP-002, chunking)', () => {
    let epubBuffer;
    beforeAll(async () => {
        epubBuffer = await generateEpub(ledm);
    });

    test('EPUB-001: ZIP válido', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        expect(Object.keys(zip.files).length).toBeGreaterThan(0);
    });

    test('EPUB-002: mimetype primero', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const entries = Object.keys(zip.files);
        expect(entries[0]).toBe('mimetype');
        expect(await zip.file('mimetype').async('string')).toBe('application/epub+zip');
    });

    test('EPUB-003: container apunta a OPF', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const container = await zip.file('META-INF/container.xml').async('string');
        expect(container).toContain('OEBPS/content.opf');
    });

    test('EPUB-004: OPF contiene metadata, manifest, spine', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const opf = await zip.file('OEBPS/content.opf').async('string');
        expect(opf).toContain('<metadata');
        expect(opf).toContain('<manifest');
        expect(opf).toContain('<spine');
    });

    test('EPUB-005: nav.xhtml contiene navegación', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const nav = await zip.file('OEBPS/nav.xhtml').async('string');
        expect(nav).toContain('nav');
    });

    test('EPUB-006: fidelidad textual', async () => {
        const textLedm = extractLedmText(ledm).replace(/\s+/g, ' ').trim();
        const textEpub = (await extractTextFromEpubBuffer(epubBuffer)).replace(/\s+/g, ' ').trim();
        expect(textEpub).toBe(textLedm);
    });

    test('EPUB-007: determinismo del contenido', async () => {
        const buffer2 = await generateEpub(ledm);
        const hash1 = await hashEpubContents(epubBuffer);
        const hash2 = await hashEpubContents(buffer2);
        expect(hash1).toBe(hash2);
    });

    test('EPUB-008: LEDM no mutado', async () => {
        const snapshot = JSON.stringify(ledm);
        await generateEpub(ledm);
        expect(JSON.stringify(ledm)).toBe(snapshot);
    });

    test('EPUB-009: estructura semántica presente', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const entries = Object.keys(zip.files).filter(n => n.startsWith('OEBPS/xhtml/') && n.endsWith('.xhtml'));
        let hasBlockElement = false;
        for (const name of entries) {
            const content = await zip.file(name).async('string');
            const $ = cheerio.load(content);
            if ($('article').length > 0 || $('p').length > 0 || $('h1').length > 0) {
                hasBlockElement = true;
                break;
            }
        }
        expect(hasBlockElement).toBe(true);
    });
});