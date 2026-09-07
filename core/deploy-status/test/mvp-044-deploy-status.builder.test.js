'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-044 Deploy Status Builder', () => {
    const jsonPath = path.join(process.cwd(), 'public', 'deploy-status.json');
    const htmlPath = path.join(process.cwd(), 'public', 'deploy-status.html');
    const navPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/deploy-status.json y public/deploy-status.html', () => {
        execSync('node scripts/build-deploy-status.js');
        expect(fs.existsSync(jsonPath)).toBe(true);
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    test('El JSON contiene commit y rama', () => {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        expect(data.commit).toBeTruthy();
        expect(data.branch).toBeTruthy();
    });

    test('El HTML contiene el título correcto', () => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        expect(html).toContain('Estado del Despliegue');
    });

    test('nav.html incluye enlace a deploy-status.html', () => {
        const nav = fs.readFileSync(navPath, 'utf8');
        expect(nav).toContain('deploy-status.html');
    });
});
