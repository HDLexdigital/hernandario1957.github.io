'use strict';

const fs = require('fs');
const path = require('path');

const baseCssPath = path.join(__dirname, '..', 'base.css');

describe('MVP-009 Experimental base.css', () => {
    test('El archivo base.css existe', () => {
        expect(fs.existsSync(baseCssPath)).toBe(true);
    });

    test('Contiene el prefijo de namespace --ld-*', () => {
        const css = fs.readFileSync(baseCssPath, 'utf8');
        expect(css).toMatch(/--ld-/);
    });

    test('Contiene tokens mínimos de color, fuente, tamaño y espaciado', () => {
        const css = fs.readFileSync(baseCssPath, 'utf8');
        expect(css).toContain('--ld-color-text-primary');
        expect(css).toContain('--ld-color-bg-primary');
        expect(css).toContain('--ld-font-family-body');
        expect(css).toContain('--ld-font-size-base');
        expect(css).toContain('--ld-line-height-base');
        expect(css).toContain('--ld-spacing-unit');
    });

    test('No contiene estilos inline prohibidos', () => {
        const css = fs.readFileSync(baseCssPath, 'utf8');
        expect(css).not.toContain('style=');
    });
});