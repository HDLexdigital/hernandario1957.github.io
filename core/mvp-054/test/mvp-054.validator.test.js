'use strict';

const { validarTodo } = require('../../../src/core/validators/capas');

describe('MVP-054 Validador por capas E18-E26', () => {

    test('Documento válido pasa todas las capas', () => {
        const doc = {
            meta: { model: 'CIDM-1.0', source: { type: 'INDESIGN', id: 'test' } },
            styleDictionary: {
                'p01': { name: 'P01_BODY_FIRST' }
            },
            content: [
                { type: 'p', class: 'p01-body-first', text: 'Texto válido' }
            ]
        };
        const r = validarTodo(doc);
        expect(r.ok).toBe(true);
    });

    test('Documento sin meta falla E18', () => {
        const r = validarTodo({});
        expect(r.ok).toBe(false);
        expect(r.resultados.E18.ok).toBe(false);
    });

    test('Documento sin BOM pasa E19', () => {
        const doc = {
            meta: { model: 'CIDM', source: {} },
            styleDictionary: {},
            content: []
        };
        const r = validarTodo(doc);
        expect(r.resultados.E19.ok).toBe(true);
    });

    test('Clase CSS no kebab-case falla E23', () => {
        const doc = {
            meta: { model: 'CIDM', source: {} },
            styleDictionary: {},
            content: [{ type: 'p', class: 'P01_Body First' }]
        };
        const r = validarTodo(doc);
        expect(r.resultados.E23.ok).toBe(false);
    });

    test('Párrafo sin cerrar falla E24', () => {
        const doc = {
            meta: { model: 'CIDM', source: {} },
            styleDictionary: {},
            content: [{ type: 'html', html: '<p>Texto sin cerrar' }]
        };
        const r = validarTodo(doc);
        expect(r.resultados.E24.ok).toBe(false);
    });

    test('Párrafo anidado falla E25', () => {
        const doc = {
            meta: { model: 'CIDM', source: {} },
            styleDictionary: {},
            content: [{ type: 'html', html: '<p><p>Anidado</p></p>' }]
        };
        const r = validarTodo(doc);
        expect(r.resultados.E25.ok).toBe(false);
    });
});
