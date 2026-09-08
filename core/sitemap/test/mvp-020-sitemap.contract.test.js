'use strict';

const contract = require('../mvp-020-sitemap.contract.json');

describe('MVP-020 Sitemap Contract', () => {
    test('Define generación estática sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.static).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salidas sitemap.xml y robots.txt', () => {
        expect(contract.output.sitemap).toBe('public/sitemap.xml');
        expect(contract.output.robots).toBe('public/robots.txt');
    });

    test('La validación exige sitemap, robots y XML válido', () => {
        expect(contract.validation.requireSitemap).toBe(true);
        expect(contract.validation.requireRobots).toBe(true);
        expect(contract.validation.requireValidXml).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});
