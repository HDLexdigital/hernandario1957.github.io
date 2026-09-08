'use strict';

const {
    PersistenciaArtefactoPort
} = require('../../src/core/ports/persistenciaArtefacto');

describe('E12.6-C.48.0 — Contrato del Puerto de Persistencia del Artefacto', () => {

    test('El puerto debe exponer la operación guardar()', () => {
        const puerto = new PersistenciaArtefactoPort();

        expect(typeof puerto.guardar).toBe('function');
    });

    test('La implementación abstracta debe rechazar la operación no implementada', () => {
        const puerto = new PersistenciaArtefactoPort();

        expect(() => {
            puerto.guardar(
                {
                    jsonOficial: {},
                    xhtml: '<html></html>',
                    metadatos: {}
                },
                'destino'
            );
        }).toThrow(
            'ERR_PORT_NOT_IMPLEMENTED'
        );
    });

    test('El puerto no debe depender directamente de infraestructura de filesystem', () => {
        const contenidoPuerto = require('fs').readFileSync(
            require('path').resolve(
                __dirname,
                '../../src/core/ports/persistenciaArtefacto.js'
            ),
            'utf8'
        );

        expect(contenidoPuerto).not.toMatch(
            /\brequire\s*\(\s*['"]fs['"]\s*\)/
        );

        expect(contenidoPuerto).not.toMatch(
            /\brequire\s*\(\s*['"]path['"]\s*\)/
        );
    });

});