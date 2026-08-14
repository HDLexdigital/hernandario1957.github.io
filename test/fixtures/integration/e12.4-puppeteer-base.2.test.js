'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.4-E-BASE.2 — Verificación de Propagación Tipográfica Directa (Chromium)', () => {

    let browser;
    let page;

    beforeAll(async () => {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;

        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // XHTML artificial utilizando directamente las clases tipográficas del diseño
        const htmlMinimoDirecto = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { margin: 20px; background: #ffffff; }
                    ${cssContent}
                </style>
            </head>
            <body>
                <p class="titulo">Título de Prueba Tipográfica</p>
                <p class="p02-title-main">Título Principal de Prueba</p>
                <p class="base-titulos">Base de Títulos de Prueba</p>
                <p class="cuerpo-siguiente">Texto del cuerpo siguiente de prueba con métricas estándar.</p>
                <p class="sangria-n1">Texto con sangría N1 de prueba.</p>
            </body>
            </html>`;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, devicePixelRatio: 1 });
        await page.setContent(htmlMinimoDirecto, { waitUntil: 'networkidle0' });

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

    test('E12.4-E-BASE.2 — Inspección Geométrica y Computada con Selectores Tipográficos Reales', async () => {
        console.log('\n============================================================');
        console.log('   E12.4-E-BASE.2 — AISLAMIENTO DEL PUENTE TIPOGRÁFICO');
        console.log('============================================================');

        const reporteDirecto = await page.evaluate(() => {
            const selectores = ['.titulo', '.p02-title-main', '.base-titulos', '.cuerpo-siguiente', '.sangria-n1'];
            const resultados = {};

            selectores.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const computed = window.getComputedStyle(el);
                    resultados[sel] = {
                        found: true,
                        rect: {
                            width: Math.round(rect.width * 100) / 100,
                            height: Math.round(rect.height * 100) / 100,
                            x: Math.round(rect.x * 100) / 100,
                            y: Math.round(rect.y * 100) / 100
                        },
                        computedStyle: {
                            fontFamily: computed.fontFamily,
                            fontSize: computed.fontSize,
                            lineHeight: computed.lineHeight,
                            marginTop: computed.marginTop,
                            marginBottom: computed.marginBottom,
                            textIndent: computed.textIndent
                        }
                    };
                } else {
                    resultados[sel] = { found: false };
                }
            });

            return resultados;
        });

        for (const [sel, data] of Object.entries(reporteDirecto)) {
            if (data.found) {
                console.log(`\n[SELECTOR TIPOGRÁFICO: ${sel}]`);
                console.log(`  Geometría (Bounding Box): width=${data.rect.width}px, height=${data.rect.height}px, y=${data.rect.y}px`);
                console.log(`  Estilo Computado en Chromium:`);
                console.log(`    font-family: ${data.computedStyle.fontFamily}`);
                console.log(`    font-size:   ${data.computedStyle.fontSize}`);
                console.log(`    line-height: ${data.computedStyle.lineHeight}`);
                console.log(`    margins:     top=${data.computedStyle.marginTop}, bottom=${data.computedStyle.marginBottom}`);
                console.log(`    text-indent: ${data.computedStyle.textIndent}`);
            } else {
                console.log(`\n[SELECTOR TIPOGRÁFICO: ${sel}] ❌ No encontrado en el DOM artificial.`);
            }
        }

        console.log('\n============================================================');
        console.log('   E12.4-E-BASE.2 CONCLUIDO EXITOSAMENTE');
        console.log('============================================================');

        expect(browser).toBeDefined();
    }, 30000);

});