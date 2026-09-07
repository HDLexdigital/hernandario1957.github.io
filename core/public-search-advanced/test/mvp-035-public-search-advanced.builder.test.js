'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-035 Public Search Advanced Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'search-advanced.html');

    test('Genera public/search-advanced.html', () => {
        execSync('node scripts/build-public-search-advanced.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('search-index.json');
        expect(content).toContain('Búsqueda Avanzada');
        expect(content).toContain('filter-doc');
        expect(content).toContain('filter-version');
        expect(content).toContain('filter-text');
    });
});
