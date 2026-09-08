'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const DASHBOARD_PATH = path.join(RAIZ, 'public', 'metrics.html');

describe('MVP-029 Public Metrics Dashboard', () => {
    test('El dashboard estático existe', () => {
        expect(fs.existsSync(DASHBOARD_PATH)).toBe(true);
    });

    test('Consume build-metrics.json y global-timeline.json', () => {
        const html = fs.readFileSync(DASHBOARD_PATH, 'utf8');
        expect(html).toContain('build-metrics.json');
        expect(html).toContain('global-timeline.json');
    });

    test('No contiene referencias a APIs privadas', () => {
        const html = fs.readFileSync(DASHBOARD_PATH, 'utf8');
        expect(html).not.toContain('/api/v1/admin');
        expect(html).not.toContain('x-api-key');
    });
});
