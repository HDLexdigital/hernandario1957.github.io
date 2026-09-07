'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-040 Public Nav Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'nav.html');

    test('Genera public/nav.html', () => {
        execSync('node scripts/build-public-nav.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('Navegación Pública');
        expect(content).toContain('search.html');
        expect(content).toContain('search-advanced.html');
        expect(content).toContain('search-relevance.html');
        expect(content).toContain('novedades.html');
        expect(content).toContain('global-timeline.html');
        expect(content).toContain('metrics.html');
        expect(content).toContain('exports.html');
        expect(content).toContain('collection.html');
    });
});
