'use strict';

const { construirXHTMLDesdeLEDM, escaparHTML } = require('../../../src/core/constructores/xhtml-ledm');

describe('MVP-054 Builder XHTML LEDM', () => {
    test('Genera XHTML básico', () => {
        const ledm = { meta: { title: 'Test' }, content: [{ type: 'p', class: 'p01-body-first', text: 'Hola' }] };
        const html = construirXHTMLDesdeLEDM(ledm);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('Hola');
    });

    test('Escapa caracteres HTML', () => {
        expect(escaparHTML('<script>')).toBe('&lt;script&gt;');
    });

    test('Incluye role y aria-label', () => {
        const ledm = { meta: { title: 'Doc' }, content: [{ type: 'p', class: 'p01', role: 'region', 'aria-label': 'Normativo', text: 'Texto' }] };
        const html = construirXHTMLDesdeLEDM(ledm);
        expect(html).toContain('role="region"');
    });
});
