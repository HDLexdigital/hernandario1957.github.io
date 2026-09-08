'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-048 Public Anchors Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'anchors.html');
    const navPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/anchors.html', () => {
        execSync('node scripts/build-public-anchors.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    test('El dashboard contiene el título correcto', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toContain('Anclas Internas');
    });

    test('El dashboard muestra estado OK o ERROR', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toMatch(/Estado: (OK|ERROR|SIN DATOS)/);
    });

    test('nav.html incluye enlace a anchors.html', () => {
        const nav = fs.readFileSync(navPath, 'utf8');
        expect(nav).toContain('anchors.html');
    });
});
