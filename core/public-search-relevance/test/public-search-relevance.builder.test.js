'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-037 Public Search Relevance Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'search-relevance.html');

    test('Genera public/search-relevance.html', () => {
        execSync('node scripts/build-public-search-relevance.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('search-index.json');
        expect(content).toContain('Búsqueda con Relevancia');
        expect(content).toContain('score');
    });
});
