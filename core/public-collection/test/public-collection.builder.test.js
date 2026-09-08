'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-039 Public Collection Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'collection.html');

    test('Genera public/collection.html', () => {
        execSync('node scripts/build-public-collection.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('Colección Completa');
        expect(content).toContain('collection-export.json');
    });
});
