'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.4-BASE — Inventario Exploratorio de Renderizado y Entorno', () => {

    test('E12.4-BASE-A a E — Inventario del Runtime y Dependencias del Sistema', () => {
        console.log('\n============================================================');
        console.log('       E12.4-BASE — INVENTARIO DE ENTORNO Y RUNTIME');
        console.log('============================================================');
        console.log(`[E12.4-BASE-A] Node.js Version: ${process.version}`);
        console.log(`[E12.4-BASE-A] Platform / Arch: ${process.platform} / ${process.arch}`);
        console.log(`[E12.4-BASE-A] Module System: CommonJS (CJS)`);

        // Helper seguro para verificar la presencia de paquetes en node_modules
        function checkPackage(pkgName) {
            try {
                require.resolve(pkgName);
                const pkg = require(pkgName);
                return { status: 'INSTALADO', version: pkg.version || 'desconocida' };
            } catch (e) {
                return { status: 'AUSENTE', version: null };
            }
        }

        const jsdomCheck = checkPackage('jsdom');
        const happyDomCheck = checkPackage('happy-dom');
        const playwrightCheck = checkPackage('playwright');
        const puppeteerCheck = checkPackage('puppeteer');

        console.log(`[E12.4-BASE-B] jsdom: ${jsdomCheck.status} ${jsdomCheck.version ? `(v${jsdomCheck.version})` : ''}`);
        console.log(`[E12.4-BASE-C] happy-dom: ${happyDomCheck.status} ${happyDomCheck.version ? `(v${happyDomCheck.version})` : ''}`);
        console.log(`[E12.4-BASE-D] Playwright: ${playwrightCheck.status} ${playwrightCheck.version ? `(v${playwrightCheck.version})` : ''}`);
        console.log(`[E12.4-BASE-E] Puppeteer: ${puppeteerCheck.status} ${puppeteerCheck.version ? `(v${puppeteerCheck.version})` : ''}`);

        // Revisión de dependencias declaradas en el package.json del proyecto modular
        const pkgJsonPath = path.join(__dirname, '../../../package.json');
        if (fs.existsSync(pkgJsonPath)) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
            console.log(`[E12.4-BASE] Dependencias declaradas en package.json relacionadas:`);
            ['jsdom', 'happy-dom', 'playwright', 'puppeteer', 'puppeteer-core'].forEach(dep => {
                if (allDeps[dep]) {
                    console.log(`  - ${dep}: ${allDeps[dep]}`);
                }
            });
        }

        console.log('============================================================\n');
        expect(true).toBe(true);
    });

    test('E12.4-BASE-CAP — Microprueba de Computed Styles y Layout (jsdom si disponible)', () => {
        try {
            const { JSDOM } = require('jsdom');
            console.log('[E12.4-BASE] jsdom detectado. Ejecutando microprueba de capacidades...');
            
            const dom = new JSDOM(`<!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .cuerpo-siguiente {
                            font-family: "Liberation Serif", serif;
                            font-size: 14pt;
                            line-height: 1.2;
                            margin-top: 4.25pt;
                            text-indent: 17pt;
                        }
                    </style>
                </head>
                <body>
                    <p class="cuerpo-siguiente" id="test-p">Texto de prueba</p>
                </body>
                </html>`, {
                resources: 'usable',
                runScripts: 'dangerously'
            });

            const window = dom.window;
            const document = window.document;
            const el = document.getElementById('test-p');

            const hasGetComputedStyle = typeof window.getComputedStyle === 'function';
            console.log(`[E12.4-BASE-CAP] window.getComputedStyle disponible: ${hasGetComputedStyle}`);

            if (hasGetComputedStyle) {
                const computed = window.getComputedStyle(el);
                console.log(`[E12.4-BASE-CAP] computed['font-size']: ${computed.fontSize || computed.getPropertyValue('font-size')}`);
                console.log(`[E12.4-BASE-CAP] computed['margin-top']: ${computed.marginTop || computed.getPropertyValue('margin-top')}`);
            }

            const hasGetBoundingClientRect = typeof el.getBoundingClientRect === 'function';
            console.log(`[E12.4-BASE-CAP] el.getBoundingClientRect disponible: ${hasGetBoundingClientRect}`);
            if (hasGetBoundingClientRect) {
                const rect = el.getBoundingClientRect();
                console.log(`[E12.4-BASE-CAP] getBoundingClientRect() métricas geométricas:`, {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }

            expect(hasGetComputedStyle).toBe(true);
        } catch (e) {
            console.log('[E12.4-BASE] jsdom no está instalado o no disponible en este entorno:', e.message);
            // No fallamos la prueba base exploratoria si la dependencia no existe
            expect(true).toBe(true);
        }
    });

});