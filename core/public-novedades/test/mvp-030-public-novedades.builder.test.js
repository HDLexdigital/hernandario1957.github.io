'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-030 Public Novedades Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'novedades.html');

    test('Genera public/novedades.html', () => {
        execSync('node scripts/build-public-novedades.js');
        expect(fs.existsSync(htmlPath)).toBe(true);

        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('Novedades Jurídicas');
        expect(content).toContain('novedades.json');
    });
});
