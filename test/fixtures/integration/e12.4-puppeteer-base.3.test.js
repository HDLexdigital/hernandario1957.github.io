'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.4-E-BASE.3 — Matriz de Trazabilidad Semántica y Cascada CSS (Chromium)', () => {

    let browser;
    let page;

    beforeAll(async () => {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;

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

        // XHTML completo generado por el pipeline de Lexmotor con el CSS de producción
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
            // Ignorar si la API de fuentes no está completa
        }
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('E12.4-E-BASE.3 — Generación de la Matriz de Trazabilidad del Pipeline Real', async () => {
        console.log('\n====================================================================');
        console.log('   E12.4-E-BASE.3 — MATRIZ DE TRAZABILIDAD SEMÁNTICA → CSS EFECTIVO');
        console.log('====================================================================');

        const matrizTrazabilidad = await page.evaluate(() => {
            const selectoresSemanticos = ['.texto_cuerpo', '.articulo', '.paragrafo_normativo', '.titulo_parte'];
            const reporte = [];

            selectoresSemanticos.forEach(sel => {
                // Tomamos una muestra representativa de hasta 3 elementos por cada clase semántica
                const elementos = document.querySelectorAll(sel);
                const muestra = Array.from(elementos).slice(0, 3);

                muestra.forEach((el, index) => {
                    const computed = window.getComputedStyle(el);
                    
                    // Investigamos qué reglas de los stylesheets de la página aplican a este elemento
                    const reglasMatching = [];
                    try {
                        for (const sheet of document.styleSheets) {
                            try {
                                const rules = sheet.cssRules || sheet.rules;
                                if (rules) {
                                    for (const rule of rules) {
                                        if (rule.selectorText && el.matches(rule.selectorText)) {
                                            reglasMatching.push(rule.selectorText);
                                        }
                                    }
                                }
                            } catch (err) {
                                // CORS o restricciones de stylesheets externos
                            }
                        }
                    } catch (e) {
                        // Ignorar errores de inspección de hojas de estilo
                    }

                    reporte.push({
                        claseSemantica: sel,
                        indiceMuestra: index + 1,
                        tag: el.tagName,
                        matchingSelectors: [...new Set(reglasMatching)],
                        computedFontFamily: computed.fontFamily,
                        computedFontSize: computed.fontSize,
                        computedLineHeight: computed.lineHeight,
                        computedTextIndent: computed.textIndent
                    });
                });
            });

            return reporte;
        });

        console.log(`\nTotal de nodos analizados en la muestra del pipeline real: ${matrizTrazabilidad.length}\n`);

        matrizTrazabilidad.forEach(item => {
            console.log(`--------------------------------------------------------------------`);
            console.log(`[CLASE SEMÁNTICA: ${item.claseSemantica} #${item.indiceMuestra}] (Tag: ${item.tag})`);
            console.log(`  Selectores CSS que coinciden (Cascada):`);
            console.log(`    ${item.matchingSelectors.length > 0 ? item.matchingSelectors.join(', ') : '⚠️ Ninguno (Heredado / Default)'}`);
            console.log(`  Estilo Efectivo en Chromium:`);
            console.log(`    font-family: ${item.computedFontFamily}`);
            console.log(`    font-size:   ${item.computedFontSize}`);
            console.log(`    line-height: ${item.computedLineHeight}`);
            console.log(`    text-indent: ${item.computedTextIndent}`);
        });

        console.log('\n====================================================================');
        console.log('   E12.4-E-BASE.3 CONCLUIDO EXITOSAMENTE');
        console.log('====================================================================');

        expect(matrizTrazabilidad.length).toBeGreaterThan(0);
    }, 30000);

});