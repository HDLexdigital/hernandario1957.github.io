'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-032 Public Search HTML Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'search.html');

    test('Genera public/search.html', () => {
        execSync('node scripts/build-public-search.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('search-index.json');
        expect(content).toContain('Búsqueda Jurídica');
    });
});
