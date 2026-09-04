'use strict';

const fs = require('fs');
const path = require('path');
const contract = require('../mvp-009-design-system.contract.json');

describe('MVP-009 CSS Bundles Experimental', () => {
    const stylesDir = path.join(__dirname, '..');

    const requiredFiles = [
        'base.css',
        'web.css',
        'epub.css',
        'paged-media.css',
        'print.css'
    ];

    test('Los archivos de estilo requeridos existen', () => {
        for (const file of requiredFiles) {
            expect(fs.existsSync(path.join(stylesDir, file))).toBe(true);
        }
    });

    test('Los bundles del contrato referencian archivos existentes', () => {
        const bundles = contract.cssArchitecture.bundles;
        for (const profile of Object.keys(bundles)) {
            for (const file of bundles[profile]) {
                expect(fs.existsSync(path.join(stylesDir, file))).toBe(true);
            }
        }
    });

    test('El bundle pdf-ua no incluye print.css', () => {
        expect(contract.cssArchitecture.bundles['pdf-ua']).not.toContain('print.css');
        expect(contract.cssArchitecture.bundles['pdf-ua']).toEqual(['base.css', 'paged-media.css']);
    });

    test('El bundle print incluye paged-media.css y print.css', () => {
        expect(contract.cssArchitecture.bundles.print).toContain('paged-media.css');
        expect(contract.cssArchitecture.bundles.print).toContain('print.css');
    });

    test('paged-media.css no define colores CMYK', () => {
        const css = fs.readFileSync(path.join(stylesDir, 'paged-media.css'), 'utf8');
        expect(css).not.toMatch(/cmyk/);
    });

    test('print.css define colores CMYK y marcas de corte', () => {
        const css = fs.readFileSync(path.join(stylesDir, 'print.css'), 'utf8');
        expect(css).toMatch(/cmyk/);
        expect(css).toContain('marks: crop cross');
        expect(css).toContain('bleed: 3mm');
    });
});