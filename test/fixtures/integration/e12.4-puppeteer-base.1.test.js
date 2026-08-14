'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.4-E-BASE.1 — Inventario Exhaustivo de Clases y Geometría Efectiva (Chromium)', () => {

    let browser;
    let page;
    let puppeteer;

    beforeAll(async () => {
        const puppeteerModule = await import('puppeteer');
        puppeteer = puppeteerModule.default || puppeteerModule;

        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css');

        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
        const resultado = await compilarLexmotor(adaptacion.ast, 'fragmento-211', cssPath);
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        const htmlCompleto = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { margin: 20px; background: #ffffff; }
                    ${cssContent}
                </style>
            </head>
            <body>
                ${resultado.xhtml}
            </body>
            </html>`;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, devicePixelRatio: 1 });
        await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });

        try {
            await page.evaluate(async () => {
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
            });
        } catch (e) {
            // Ignorar si el entorno no implementa la API completa
        }
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('E12.4-E-BASE.1 — Inventario Dinámico [class] y Rangos Geométricos', async () => {
        console.log('\n============================================================');
        console.log('   E12.4-E-BASE.1 — INVENTARIO DINÁMICO DE CLASES Y GEOMETRÍA');
        console.log('============================================================');

        const inventarioClases = await page.evaluate(() => {
            const elementos = document.querySelectorAll('[class]');
            const mapaClases = {};

            elementos.forEach(el => {
                // Un elemento puede tener múltiples clases
                const clases = el.className.trim().split(/\s+/);
                clases.forEach(cls => {
                    if (!cls) return;
                    if (!mapaClases[cls]) {
                        mapaClases[cls] = {
                            count: 0,
                            widths: [],
                            heights: [],
                            ys: [],
                            clientRectsCounts: [],
                            computedSample: null
                        };
                    }
                    const record = mapaClases[cls];
                    record.count++;
                    const rect = el.getBoundingClientRect();
                    record.widths.push(rect.width);
                    record.heights.push(rect.height);
                    record.ys.push(rect.y);
                    record.clientRectsCounts.push(el.getClientRects().length);

                    if (!record.computedSample) {
                        const computed = window.getComputedStyle(el);
                        record.computedSample = {
                            fontFamily: computed.fontFamily,
                            fontSize: computed.fontSize,
                            lineHeight: computed.lineHeight,
                            marginTop: computed.marginTop,
                            marginBottom: computed.marginBottom,
                            textIndent: computed.textIndent,
                            textAlign: computed.textAlign
                        };
                    }
                });
            });

            const resultadoFinal = {};
            for (const [cls, data] of Object.entries(mapaClases)) {
                resultadoFinal[cls] = {
                    count: data.count,
                    minWidth: Math.min(...data.widths),
                    maxWidth: Math.max(...data.widths),
                    minHeight: Math.min(...data.heights),
                    maxHeight: Math.max(...data.heights),
                    minY: Math.min(...data.ys),
                    maxY: Math.max(...data.ys),
                    avgClientRects: (data.clientRectsCounts.reduce((a, b) => a + b, 0) / data.count).toFixed(2),
                    computedSample: data.computedSample
                };
            }
            return resultadoFinal;
        });

        console.log(`\nTotal de clases únicas detectadas en el DOM: ${Object.keys(inventarioClases).length}\n`);

        for (const [cls, data] of Object.entries(inventarioClases)) {
            console.log(`------------------------------------------------------------`);
            console.log(`[CLASE: .${cls}] (Cardinalidad: ${data.count} elementos)`);
            console.log(`  Geometría (Bounding Box ranges):`);
            console.log(`    width: [${data.minWidth}px — ${data.maxWidth}px]`);
            console.log(`    height: [${data.minHeight}px — ${data.maxHeight}px]`);
            console.log(`    pos y: [${data.minY}px — ${data.maxY}px]`);
            console.log(`  Fragmentación promedio (clientRects): ${data.avgClientRects}`);
            console.log(`  Estilo efectivo (muestra):`);
            console.log(`    font: ${data.computedSample.fontFamily} (${data.computedSample.fontSize}, line-height: ${data.computedSample.lineHeight})`);
            console.log(`    margins: top=${data.computedSample.marginTop}, bottom=${data.computedSample.marginBottom}`);
            console.log(`    indent/align: text-indent=${data.computedSample.textIndent}, align=${data.computedSample.textAlign}`);
        }

        console.log('\n============================================================');
        console.log('   INVENTARIO E12.4-E-BASE.1 CONCLUIDO EXITOSAMENTE');
        console.log('============================================================');

        expect(Object.keys(inventarioClases).length).toBeGreaterThan(0);
    }, 30000);

});