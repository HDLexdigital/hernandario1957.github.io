'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-031 Global Timeline HTML Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'global-timeline.html');

    test('Genera public/global-timeline.html', () => {
        execSync('node scripts/build-global-timeline-html.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('global-timeline.json');
        expect(content).toContain('Línea de Tiempo Global');
    });
});
