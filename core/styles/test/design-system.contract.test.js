'use strict';

const contract = require('../mvp-009-design-system.contract.json');

describe('MVP-009 Design System Base Contract', () => {
    test('El contrato declara los principios e invariantes', () => {
        expect(contract.principles.separationOfConcerns).toBe(true);
        expect(contract.principles.reusability).toBe(true);
        expect(contract.principles.accessibility).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
        expect(contract.invariants.length).toBeGreaterThan(0);
        expect(contract.invariants).toContain('Inline styles are forbidden');
    });

    test('Los colores están separados por medio: pantalla y imprenta', () => {
        expect(contract.tokens.colors.screen.primaryText).toMatch(/^#/);
        expect(contract.tokens.colors.print.primaryText).toMatch(/cmyk/);
        expect(contract.tokens.colors.print.primaryText).toBe('cmyk(0%, 0%, 0%, 100%)');
    });

    test('La tipografía define tamaños separados para web e imprenta', () => {
        expect(contract.tokens.typography.sizes.web.base).toBe('1rem');
        expect(contract.tokens.typography.sizes.print.base).toBe('10pt');
        expect(contract.tokens.typography.lineHeights.base).toBeGreaterThanOrEqual(1.5);
    });

    test('Las fuentes incluyen fallbacks', () => {
        expect(contract.tokens.typography.fonts.body).toContain('serif');
        expect(contract.tokens.typography.fonts.mono).toContain('monospace');
    });

    test('La página define tamaño A4 explícito', () => {
        expect(contract.tokens.page.size).toBe('A4');
        expect(contract.tokens.page.bleed).toBe('3mm');
    });

    test('Los archivos de estilo usan kebab-case consistente', () => {
        expect(contract.validation.requiredFiles).toEqual(
            expect.arrayContaining(['base.css', 'web.css', 'epub.css', 'print.css', 'paged-media.css'])
        );
        expect(contract.cssArchitecture.order).toContain('paged-media.css');
    });

    test('La validación exige resolución de tokens y no mutación del LEDM', () => {
        expect(contract.validation.tokenResolution).toBe(true);
        expect(contract.validation.noLedmMutation).toBe(true);
        expect(contract.validation.contrastValidation).toBe(true);
    });

    test('Los perfiles de salida asignan colores y tamaños por medio', () => {
        expect(contract.outputProfiles.web.colors).toBe('screen');
        expect(contract.outputProfiles.print.colors).toBe('print');
        expect(contract.outputProfiles.web.sizes).toBe('web');
        expect(contract.outputProfiles.print.sizes).toBe('print');
    });
});
