'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-038 Public Exports Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'exports.html');

    test('Genera public/exports.html', () => {
        execSync('node scripts/build-public-exports.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('Exportaciones Públicas');
        expect(content).toContain('collection-export.json');
        expect(content).toContain('collection-export.csv');
        expect(content).toContain('collection-export.ndjson');
        expect(content).toContain('feed.xml');
        expect(content).toContain('sitemap.xml');
        expect(content).toContain('build-metrics.json');
    });
});
