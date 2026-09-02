'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-C.50.6.1 — Aislamiento y IoC del Motor GREP Jurídico', () => {

    test('El archivo motorGrepJuridico.js no debe contener dependencias de infraestructura transitiva', () => {
        const rutaMotor = path.resolve(__dirname, '../../src/core/motorGrepJuridico.js');
        const contenido = fs.readFileSync(rutaMotor, 'utf8');

        // Búsqueda de contaminación de entorno e infraestructura
        const tieneProcess = /\bprocess\.env\b/.test(contenido);
        const tieneDirname = /\b__dirname\b/.test(contenido);
        const tieneRequireFs = /\brequire\s*\(\s*['"]fs['"]\s*\)/.test(contenido);
        const tieneRequirePath = /\brequire\s*\(\s*['"]path['"]\s*\)/.test(contenido);

        expect(tieneProcess).toBe(false);
        expect(tieneDirname).toBe(false);
        expect(tieneRequireFs).toBe(false);
        expect(tieneRequirePath).toBe(false);
    });

});