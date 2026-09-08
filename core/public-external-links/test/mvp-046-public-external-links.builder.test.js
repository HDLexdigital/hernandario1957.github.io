'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-046 Public External Links Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'external-links.html');
    const navPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/external-links.html', () => {
        execSync('node scripts/build-public-external-links.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    test('El dashboard contiene el título correcto', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toContain('Enlaces Externos');
    });

    test('El dashboard muestra estado OK o ERROR', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toMatch(/Estado: (OK|ERROR|SIN DATOS)/);
    });

    test('nav.html incluye enlace a external-links.html', () => {
        const nav = fs.readFileSync(navPath, 'utf8');
        expect(nav).toContain('external-links.html');
    });
});
