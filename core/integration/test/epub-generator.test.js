'use strict';

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const cheerio = require('cheerio');

// Rutas
const subsetFixturePath = path.join(__dirname, '..', 'fixtures', 'authentic', 'CIDM_subset_articulos_1_10.json');

// Importar compilador y generador (async)
const { compile } = require('../../compiler/src/semanticCompiler');
const { generateEpub } = require('../../epub/EpubGenerator');
const { extractNodeText } = require('../../compiler/src/semanticCompiler');

// Cargar fixture una vez y compilar a LEDM
const cidm = JSON.parse(fs.readFileSync(subsetFixturePath, 'utf8'));
const ledm = compile(cidm);

// Función para extraer texto de todos los XHTML del EPUB
async function extractTextFromEpubBuffer(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const xhtmlEntries = Object.keys(zip.files).filter(name =>
        name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
    ).sort();
    let allText = '';
    for (const name of xhtmlEntries) {
        const content = await zip.file(name).async('string');
        const $ = cheerio.load(content);
        allText += $('body').text().replace(/\s+/g, ' ').trim() + '\n';
    }
    return allText.replace(/\n$/, '');
}

function extractLedmText(ledm) {
    return ledm.structure.blocks.map(block => extractNodeText(block)).join('\n');
}

describe('EPUB GENERATOR (MVP-002)', () => {
    let epubBuffer;

    beforeAll(async () => {
        epubBuffer = await generateEpub(ledm);
    });

    test('EPUB-001: El archivo generado es un ZIP válido', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        expect(Object.keys(zip.files).length).toBeGreaterThan(0);
    });

    test('EPUB-002: mimetype existe, es correcto y es la primera entrada', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const entries = Object.keys(zip.files);
        expect(entries[0]).toBe('mimetype');
        const content = await zip.file('mimetype').async('string');
        expect(content.trim()).toBe('application/epub+zip');
    });

    test('EPUB-003: META-INF/container.xml apunta a content.opf', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const containerEntry = zip.file('META-INF/container.xml');
        expect(containerEntry).toBeDefined();
        const containerContent = await containerEntry.async('string');
        const $ = cheerio.load(containerContent);
        const rootfile = $('rootfile').first();
        expect(rootfile.attr('full-path')).toBe('OEBPS/content.opf');
    });

    test('EPUB-004: content.opf contiene metadata, manifest y spine requeridos', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const opfEntry = zip.file('OEBPS/content.opf');
        expect(opfEntry).toBeDefined();
        const opfContent = await opfEntry.async('string');
        const $ = cheerio.load(opfContent, { xmlMode: true });

        expect($('metadata').length).toBeGreaterThan(0);
        expect($('dc\\:title').length).toBeGreaterThan(0);
        expect($('dc\\:language').length).toBeGreaterThan(0);

        const manifest = $('manifest');
        expect(manifest.length).toBeGreaterThan(0);
        expect(manifest.find('item').length).toBeGreaterThan(0);

        const spine = $('spine');
        expect(spine.length).toBeGreaterThan(0);
        expect(spine.find('itemref').length).toBeGreaterThan(0);
    });

    test('EPUB-005: nav.xhtml contiene navegación válida hacia el contenido', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const navEntry = zip.file('OEBPS/nav.xhtml');
        expect(navEntry).toBeDefined();
        const navContent = await navEntry.async('string');
        const $ = cheerio.load(navContent);
        const nav = $('nav[aria-label="Tabla de contenido"]');
        expect(nav.length).toBeGreaterThan(0);
        expect(nav.find('a').length).toBeGreaterThan(0);
    });

    test('EPUB-006: Texto normativo LEDM = texto normativo EPUB', async () => {
        const textLedm = extractLedmText(ledm).replace(/\s+/g, ' ').trim();
        const textEpub = (await extractTextFromEpubBuffer(epubBuffer)).replace(/\s+/g, ' ').trim();
        expect(textEpub).toBe(textLedm);
    });

    test('EPUB-007: Dos ejecuciones producen resultado determinista', async () => {
        const buffer2 = await generateEpub(ledm);
        expect(buffer2.equals(epubBuffer)).toBe(true);
    });

    test('EPUB-008: El LEDM de entrada no es mutado', async () => {
        const snapshot = JSON.stringify(ledm);
        await generateEpub(ledm);
        expect(JSON.stringify(ledm)).toBe(snapshot);
    });

    test('EPUB-009: La estructura semántica LEDM se refleja en XHTML', async () => {
        const zip = await JSZip.loadAsync(epubBuffer);
        const xhtmlEntries = Object.keys(zip.files).filter(name =>
            name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
        ).sort();

        expect(xhtmlEntries.length).toBe(ledm.structure.blocks.length);

        ledm.structure.blocks.forEach(async (block, index) => {
            const filename = xhtmlEntries[index];
            const content = await zip.file(filename).async('string');
            const $ = cheerio.load(content);

            if (block.type === 'article') {
                expect($('article').length).toBeGreaterThan(0);
            } else if (block.type === 'title') {
                expect($('h1, h2, h3').length).toBeGreaterThan(0);
            } else if (block.type === 'paragraph') {
                expect($('p').length).toBeGreaterThan(0);
            }

            if (block.children && block.children.some(c => c.type === 'strong')) {
                expect($('strong').length).toBeGreaterThan(0);
            }
        });
    });
});