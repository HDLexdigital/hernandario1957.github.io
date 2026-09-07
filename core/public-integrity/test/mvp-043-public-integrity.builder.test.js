'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-043 Public Integrity Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'integrity.html');
    const navPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/integrity.html', () => {
        execSync('node scripts/build-public-integrity.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    test('El dashboard contiene el título correcto', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toContain('Integridad y Auditoría');
    });

    test('El dashboard muestra estado OK o ERROR', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toMatch(/Estado: (OK|ERROR)/);
    });

    test('nav.html incluye enlace a integrity.html', () => {
        const nav = fs.readFileSync(navPath, 'utf8');
        expect(nav).toContain('integrity.html');
    });
});
