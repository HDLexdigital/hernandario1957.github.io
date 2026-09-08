'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.4-E-BASE — Inventario Exploratorio Físico (Chromium + Puppeteer)', () => {

    let browser;
    let page;
    let puppeteer;
    let exploracionResultados = {};

    beforeAll(async () => {
        // Importación dinámica limpia (requiere --experimental-vm-modules en Node)
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

        const tStartStartup = performance.now();
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const tEndStartup = performance.now();
        exploracionResultados.startupMs = (tEndStartup - tStartStartup).toFixed(2);

        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, devicePixelRatio: 1 });

        const tStartLoad = performance.now();
        await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });
        const tEndLoad = performance.now();
        exploracionResultados.loadMs = (tEndLoad - tStartLoad).toFixed(2);

        const tStartFonts = performance.now();
        try {
            await page.evaluate(async () => {
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
            });
        } catch (e) {
            // Ignoramos si el entorno no implementa la API completa
        }
        const tEndFonts = performance.now();
        exploracionResultados.fontsReadyMs = (tEndFonts - tStartFonts).toFixed(2);
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('E12.4-E-BASE — Extracción de Métricas Físicas y Resolución de Fuentes en Chromium', async () => {
        console.log('\n============================================================');
        console.log('   E12.4-E-BASE — INVENTARIO FÍSICO Y GEOMÉTRICO (CHROMIUM)');
        console.log('============================================================');
        console.log(`[E12.4-E-BASE] Chromium startup:       ${exploracionResultados.startupMs} ms`);
        console.log(`[E12.4-E-BASE] XHTML load:             ${exploracionResultados.loadMs} ms`);
        console.log(`[E12.4-E-BASE] Fonts ready:            ${exploracionResultados.fontsReadyMs} ms`);

        const metricasElementos = await page.evaluate(() => {
            const selectoresClave = ['.sangria-n1', '.cuerpo-siguiente', '.p02-title-main', '.titulo', '.base-titulos'];
            const reporte = {};

            selectoresClave.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const computed = window.getComputedStyle(el);
                    const rects = el.getClientRects();

                    let fuenteResuelta = 'desconocida';
                    try {
                        if (document.fonts && document.fonts.check) {
                            fuenteResuelta = document.fonts.check(`${computed.fontSize} ${computed.fontFamily}`) ? 'SÍ (Disponible)' : 'NO (Fallback)';
                        }
                    } catch (err) {
                        fuenteResuelta = 'no verificable';
                    }

                    reporte[sel] = {
                        found: true,
                        rect: {
                            x: Math.round(rect.x * 100) / 100,
                            y: Math.round(rect.y * 100) / 100,
                            width: Math.round(rect.width * 100) / 100,
                            height: Math.round(rect.height * 100) / 100
                        },
                        clientRectsCount: rects.length,
                        computedFontFamily: computed.fontFamily,
                        computedFontSize: computed.fontSize,
                        computedLineHeight: computed.lineHeight,
                        fuenteResueltaEnChromium: fuenteResuelta
                    };
                } else {
                    reporte[sel] = { found: false };
                }
            });

            const bodyEl = document.body;
            reporte.documento = {
                scrollWidth: bodyEl.scrollWidth,
                scrollHeight: bodyEl.scrollHeight,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            };

            return reporte;
        });

        console.log('\n--- REPORTE GEOMÉTRICO Y TIPOGRÁFICO POR SELECTOR ---');
        for (const [key, val] of Object.entries(metricasElementos)) {
            if (key === 'documento') {
                console.log(`\n[DOCUMENTO / VIEWPORT]`);
                console.log(`  scrollWidth: ${val.scrollWidth}px, scrollHeight: ${val.scrollHeight}px`);
                console.log(`  viewport: ${val.viewportWidth}x${val.viewportHeight} (DPR: ${val.devicePixelRatio})`);
            } else if (val.found) {
                console.log(`\n[SELECTOR: ${key}]`);
                console.log(`  rect: x=${val.rect.x}, y=${val.rect.y}, width=${val.rect.width}, height=${val.rect.height}`);
                console.log(`  clientRects (fragmentos/líneas aprox): ${val.clientRectsCount}`);
                console.log(`  font solicitada: ${val.computedFontFamily} (${val.computedFontSize})`);
                console.log(`  line-height: ${val.computedLineHeight}`);
                console.log(`  fuente resuelta en Chromium: ${val.fuenteResueltaEnChromium}`);
            } else {
                console.log(`\n[SELECTOR: ${key}] ❌ No presente en este fixture.`);
            }
        }

        console.log('\n============================================================');
        console.log('   INVENTARIO E12.4-E-BASE CONCLUIDO EXITOSAMENTE');
        console.log('============================================================');

        expect(browser).toBeDefined();
    }, 30000);

});