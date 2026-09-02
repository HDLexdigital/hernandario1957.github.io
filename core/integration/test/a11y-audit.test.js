'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');
const JSZip = require('jszip');

// Importar compilador y extractor de texto
const { compile, extractNodeText } = require('../../compiler/src/semanticCompiler');

// Rutas
const epubPath = path.join(__dirname, '..', '..', '..', 'publication.epub');
const subsetFixturePath = path.join(
    __dirname,
    '..',
    'fixtures',
    'authentic',
    'CIDM_subset_articulos_1_10.json'
);

let xhtmlContents = [];
let ledm = null;

// Función auxiliar para ejecutar axe sobre un HTML
function runAxeOnHtml(html) {
    return new Promise((resolve, reject) => {
        const dom = new JSDOM(html, { url: 'http://localhost/' });
        global.window = dom.window;
        global.document = dom.window.document;

        const root = dom.window.document.documentElement;

        axe.run(root, {
            runOnly: { type: 'tag', values: ['wcag2aa'] }
        }, (error, results) => {
            delete global.window;
            delete global.document;
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Función para obtener texto normativo del LEDM (como referencia)
function extractLedmText(ledmDoc) {
    return ledmDoc.structure.blocks
        .map(block => extractNodeText(block))
        .join('\n');
}

// Función para extraer texto de los XHTML del EPUB
async function extractTextFromEpubBuffer(epubBuffer) {
    const zip = await JSZip.loadAsync(epubBuffer);
    const xhtmlEntries = Object.keys(zip.files).filter(name =>
        name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
    ).sort();

    let allText = '';
    for (const name of xhtmlEntries) {
        const content = await zip.file(name).async('string');
        const dom = new JSDOM(content);
        allText += dom.window.document.body.textContent.replace(/\s+/g, ' ').trim() + '\n';
    }
    return allText.replace(/\n$/, '');
}

describe('MVP-003: Auditoría automatizada de accesibilidad del EPUB', () => {
    beforeAll(async () => {
        // Cargar y compilar LEDM una vez
        const cidm = JSON.parse(fs.readFileSync(subsetFixturePath, 'utf8'));
        ledm = compile(cidm);

        // Extraer XHTML del EPUB una vez para todas las pruebas
        const epubBuffer = fs.readFileSync(epubPath);
        const zip = await JSZip.loadAsync(epubBuffer);
        const entries = Object.keys(zip.files).filter(name =>
            name.startsWith('OEBPS/xhtml/') && name.endsWith('.xhtml')
        ).sort();

        xhtmlContents = [];
        for (const name of entries) {
            const content = await zip.file(name).async('string');
            xhtmlContents.push(content);
        }
    });

    test('A11Y-001: El EPUB existe y puede abrirse como ZIP', async () => {
        expect(fs.existsSync(epubPath)).toBe(true);
        const epubBuffer = fs.readFileSync(epubPath);
        const zip = await JSZip.loadAsync(epubBuffer);
        expect(Object.keys(zip.files).length).toBeGreaterThan(0);
    });

    test('A11Y-002: Se extraen todos los XHTML del EPUB', async () => {
        expect(xhtmlContents.length).toBeGreaterThan(0);
        expect(xhtmlContents.length).toBe(ledm.structure.blocks.length);
    });

    test('A11Y-003: axe-core no reporta violations CRITICAL', async () => {
        const violations = [];
        for (const html of xhtmlContents) {
            const results = await runAxeOnHtml(html);
            violations.push(...results.violations);
        }
        const critical = violations.filter(v => v.impact === 'critical');
        expect(critical.length).toBe(0);
    });

    test('A11Y-004: axe-core no reporta violations SERIOUS', async () => {
        const violations = [];
        for (const html of xhtmlContents) {
            const results = await runAxeOnHtml(html);
            violations.push(...results.violations);
        }
        const serious = violations.filter(v => v.impact === 'serious');
        expect(serious.length).toBe(0);
    });

    test('A11Y-005: Las violations MODERATE/MINOR se registran sin bloquear', async () => {
        const violations = [];
        for (const html of xhtmlContents) {
            const results = await runAxeOnHtml(html);
            violations.push(...results.violations);
        }
        const moderateMinor = violations.filter(v =>
            v.impact === 'moderate' || v.impact === 'minor'
        );
        expect(Array.isArray(moderateMinor)).toBe(true);
        console.log(`Violations moderadas/menores encontradas: ${moderateMinor.length}`);
    });

    test('A11Y-006: Las comprobaciones incomplete se documentan como pendientes', async () => {
        const incomplete = [];
        for (const html of xhtmlContents) {
            const results = await runAxeOnHtml(html);
            incomplete.push(...results.incomplete);
        }
        expect(Array.isArray(incomplete)).toBe(true);
        console.log(`Comprobaciones incompletas: ${incomplete.length}`);
    });

    test('A11Y-007: El texto normativo del EPUB coincide con el LEDM', async () => {
        const textLedm = extractLedmText(ledm).replace(/\s+/g, ' ').trim();
        const epubBuffer = fs.readFileSync(epubPath);
        const textEpub = (await extractTextFromEpubBuffer(epubBuffer)).replace(/\s+/g, ' ').trim();
        expect(textEpub).toBe(textLedm);
    });

    test('A11Y-008: El LEDM de entrada no es mutado durante la auditoría', async () => {
        const snapshot = JSON.stringify(ledm);
        for (const html of xhtmlContents) {
            await runAxeOnHtml(html);
        }
        expect(JSON.stringify(ledm)).toBe(snapshot);
    });

    test('A11Y-009: El informe es reproducible (dos ejecuciones dan el mismo resultado)', async () => {
        async function generateReport() {
            const report = [];
            for (const html of xhtmlContents) {
                const results = await runAxeOnHtml(html);
                report.push({
                    violations: results.violations.map(v => ({
                        id: v.id,
                        impact: v.impact,
                        nodes: v.nodes.length
                    })),
                    incomplete: results.incomplete.map(i => ({
                        id: i.id,
                        impact: i.impact,
                        nodes: i.nodes.length
                    }))
                });
            }
            return JSON.stringify(report);
        }

        const report1 = await generateReport();
        const report2 = await generateReport();
        expect(report1).toBe(report2);
    });
});