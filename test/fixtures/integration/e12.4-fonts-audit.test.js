'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.4-A — Auditoría y Resolución Real de Fuentes en Chromium', () => {

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
            // Ignorar si el entorno no soporta la API completa
        }
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('E12.4-A — Auditoría Estricta de document.fonts y Fallbacks en Chromium', async () => {
        console.log('\n============================================================');
        console.log('   E12.4-A — AUDITORÍA DE RESOLUCIÓN TIPOGRÁFICA (CHROMIUM)');
        console.log('============================================================');

        const auditoriaFuentes = await page.evaluate(() => {
            const report = {
                fontApiAvailable: !!(document.fonts),
                status: document.fonts ? document.fonts.status : 'N/A',
                size: document.fonts ? document.fonts.size : 0,
                checks: {},
                elementFonts: []
            };

            // 1. Comprobación mediante document.fonts.check para las familias del proyecto
            if (document.fonts && typeof document.fonts.check === 'function') {
                report.checks['Liberation Serif (14pt)'] = document.fonts.check('14pt "Liberation Serif"');
                report.checks['Minion Pro (14pt)'] = document.fonts.check('14pt "Minion Pro"');
                report.checks['Georgia Pro (24pt)'] = document.fonts.check('24pt "Georgia Pro"');
                report.checks['Times New Roman (16px)'] = document.fonts.check('16px "Times New Roman"');
            }

            // 2. Muestreo de elementos reales en el DOM y sus fuentes computed vs solicitadas
            const selectores = ['.texto_cuerpo', '.articulo', '.titulo_parte', '.paragrafo_normativo'];
            selectores.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    const computed = window.getComputedStyle(el);
                    report.elementFonts.push({
                        selector: sel,
                        fontFamilyRequested: computed.fontFamily,
                        fontSizeComputed: computed.fontSize,
                        lineHeightComputed: computed.lineHeight,
                        colorComputed: computed.color
                    });
                }
            });

            return report;
        });

        console.log(`[E12.4-A] API document.fonts disponible: ${auditoriaFuentes.fontApiAvailable}`);
        console.log(`[E12.4-A] document.fonts.status:          ${auditoriaFuentes.status}`);
        console.log(`[E12.4-A] Fuentes registradas en motor:   ${auditoriaFuentes.size}`);
        
        console.log('\n--- VERIFICACIÓN DE DISPONIBILIDAD (document.fonts.check) ---');
        for (const [fontQuery, isAvailable] of Object.entries(auditoriaFuentes.checks)) {
            console.log(`  ${fontQuery}: ${isAvailable ? '✅ SÍ (Disponible)' : '❌ NO (Ausente / Fallback)'}`);
        }

        console.log('\n--- MUESTREO DE ESTILOS COMPUTADOS EN ELEMENTOS REALES ---');
        auditoriaFuentes.elementFonts.forEach(item => {
            console.log(`[${item.selector}]`);
            console.log(`  font-family solicitada: ${item.fontFamilyRequested}`);
            console.log(`  font-size computado:    ${item.fontSizeComputed}`);
            console.log(`  line-height computado:  ${item.lineHeightComputed}`);
        });

        console.log('\n============================================================');
        console.log('   INFORME E12.4-A CONCLUIDO. LISTO PARA CLASIFICAR ESTADO');
        console.log('============================================================');

        expect(auditoriaFuentes.fontApiAvailable).toBe(true);
    }, 30000);

});