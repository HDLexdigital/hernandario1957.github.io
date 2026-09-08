'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-050 Public Audit Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'audit.html');
    const navPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/audit.html', () => {
        execSync('node scripts/build-public-audit.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    test('El dashboard contiene el título correcto', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toContain('Auditoría Consolidada');
    });

    test('El dashboard muestra estado OK o ERROR', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toMatch(/Estado: (OK|ERROR|SIN DATOS)/);
    });

    test('nav.html incluye enlace a audit.html', () => {
        const nav = fs.readFileSync(navPath, 'utf8');
        expect(nav).toContain('audit.html');
    });
});
