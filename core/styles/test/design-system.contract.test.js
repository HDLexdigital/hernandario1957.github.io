'use strict';

const contract = require('../mvp-009-design-system.contract.json');

describe('MVP-009 Design System Base Contract', () => {
    test('El contrato declara la versión 0.3.0-draft', () => {
        expect(contract.version).toBe('1.0.0');
    });

    test('El alcance evita convertirse en MVP universal', () => {
        expect(contract.scope).toContain('does not mutate LEDM');
        expect(contract.scope).toContain('does not certify output format conformance');
    });

    test('Los colores separan representación sRGB y CMYK', () => {
        expect(contract.tokens.colors.screen.primaryText).toMatch(/^#/);
        expect(contract.tokens.colors.print.primaryText).toMatch(/cmyk/);
        expect(contract.tokens.colors.print.primaryText).toBe('cmyk(0%, 0%, 0%, 100%)');
        expect(contract.tokens.colors.representation.screen).toBe('sRGB');
        expect(contract.tokens.colors.representation.print).toBe('CMYK production value');
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

    test('La página define tamaño A4 y márgenes explícitos', () => {
        expect(contract.tokens.page.size).toBe('A4');
        expect(contract.tokens.page.margin.top).toBe('25mm');
        expect(contract.tokens.page.margin.left).toBe('30mm');
    });

    test('Los perfiles de salida separan pdf-ua y print', () => {
        expect(contract.outputProfiles['pdf-ua'].colors).toBe('screen');
        expect(contract.outputProfiles['pdf-ua'].bleed).toBe('0mm');
        expect(contract.outputProfiles['pdf-ua'].marks).toEqual([]);

        expect(contract.outputProfiles.print.colors).toBe('print');
        expect(contract.outputProfiles.print.bleed).toBe('3mm');
        expect(contract.outputProfiles.print.marks).toContain('crop');
    });

    test('Las unidades están diferenciadas por perfil', () => {
        expect(contract.outputProfiles.web.units.typography).toBe('rem');
        expect(contract.outputProfiles.print.units.typography).toBe('pt');
        expect(contract.outputProfiles.print.units.page).toBe('mm');
    });

    test('La arquitectura CSS define bundles por formato', () => {
        expect(contract.cssArchitecture.bundles.web).toEqual(['base.css', 'web.css']);
        expect(contract.cssArchitecture.bundles['pdf-ua']).toEqual(['base.css', 'paged-media.css']);
        expect(contract.cssArchitecture.bundles.print).toEqual(['base.css', 'paged-media.css', 'print.css']);
    });

    test('Las reglas editoriales de paginación están definidas', () => {
        expect(contract.rules.keepHeadingsWithNext).toBe(true);
        expect(contract.rules.widowsAndOrphansMinimum).toBeGreaterThanOrEqual(2);
        expect(contract.rules.hyphenationLanguage).toBe('es');
    });

    test('La jerarquía de headings no es impuesta por el Design System', () => {
        expect(contract.rules.headingHierarchy.designSystemConsumes).toBe(true);
        expect(contract.rules.headingHierarchy.designSystemImposes).toBe(false);
    });

    test('Las clases semánticas prohíben identificadores de InDesign', () => {
        expect(contract.rules.semanticClassNames.source).toBe('LEDM semantic role');
        expect(contract.rules.semanticClassNames.forbidden).toContain('InDesign style name');
    });

    test('La validación exige integridad de fuentes y no mutación', () => {
        expect(contract.validation.fontEmbeddingValidation).toBe(true);
        expect(contract.validation.noLedmMutation).toBe(true);
        expect(contract.validation.tokenResolution).toBe(true);
        expect(contract.validation.noTokenDrift).toBe(true);
    });
});
