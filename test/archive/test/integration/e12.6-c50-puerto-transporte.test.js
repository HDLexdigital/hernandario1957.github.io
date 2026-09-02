'use strict';

const fs = require('fs');
const path = require('path');
const { TransporteArtefactoPort } = require('../../src/core/ports/transporteArtefacto');

describe('E12.6-C.50.0 — Contrato del Puerto de Transporte del Artefacto', () => {

    test('El puerto debe exponer la operación enviar()', () => {
        const puerto = new TransporteArtefactoPort();
        expect(typeof puerto.enviar).toBe('function');
    });

    test('La implementación abstracta debe rechazar la operación no implementada protegiendo la Invariante T.6', () => {
        const puerto = new TransporteArtefactoPort();

        expect(() => {
            puerto.enviar({ jsonOficial: {}, xhtml: '<html/>', metadatos: {} });
        }).toThrow('ERR_PORT_NOT_IMPLEMENTED');
    });

    test('El puerto no debe depender de infraestructura de red o IPC (Invariante T.4)', () => {
        const rutaPuerto = path.resolve(__dirname, '../../src/core/ports/transporteArtefacto.js');
        const contenidoPuerto = fs.readFileSync(rutaPuerto, 'utf8');

        // Búsqueda estricta de imports de red/sockets/IPC comunes en Node
        const usoNet = /\brequire\s*\(\s*['"]net['"]\s*\)/.test(contenidoPuerto);
        const usoHttp = /\brequire\s*\(\s*['"]http['"]\s*\)/.test(contenidoPuerto);
        const usoWs = /\brequire\s*\(\s*['"]ws['"]\s*\)/.test(contenidoPuerto);
        const usoUXP = /\brequire\s*\(\s*['"]uxp['"]\s*\)/.test(contenidoPuerto);

        expect(usoNet).toBe(false);
        expect(usoHttp).toBe(false);
        expect(usoWs).toBe(false);
        expect(usoUXP).toBe(false);
    });

});