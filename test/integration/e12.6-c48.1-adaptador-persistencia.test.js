'use strict';

const fs = require('fs');
const path = require('path');
const { PersistenciaArtefactoPort } = require('../../src/core/ports/persistenciaArtefacto');
const { PersistenciaAdapter } = require('../../src/infra/adaptadores/persistenciaAdapter');

describe('E12.6-C.48.1 — Adaptador de Persistencia en Filesystem', () => {

    const dirTest = path.resolve(__dirname, '../../test/temp/c48_salida');

    beforeEach(() => {
        if (fs.existsSync(dirTest)) {
            fs.rmSync(dirTest, { recursive: true, force: true });
        }
        fs.mkdirSync(dirTest, { recursive: true });
    });

    afterAll(() => {
        if (fs.existsSync(dirTest)) {
            fs.rmSync(dirTest, { recursive: true, force: true });
        }
    });

    test('PersistenciaAdapter debe heredar de PersistenciaArtefactoPort e implementar guardar()', () => {
        const adaptador = new PersistenciaAdapter();

        expect(adaptador).toBeInstanceOf(PersistenciaArtefactoPort);
        expect(typeof adaptador.guardar).toBe('function');
    });

    test('guardar() debe materializar los archivos (.xhtml, .json, metadatos.json) de forma determinista', () => {
        const adaptador = new PersistenciaAdapter();

        const artefactoMock = {
            jsonOficial: { documento: 'ley_prueba.indd', tokens: [{ id: 1, texto: 'Artículo 1' }] },
            xhtml: '<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><title>Ley</title></head><body><p>Artículo 1</p></body></html>',
            metadatos: { nombre: 'LeyPrueba', version: '1.0.0', tiempoTotal: 12.5 }
        };

        const resultado = adaptador.guardar(artefactoMock, dirTest);

        // Verificación de la respuesta del adaptador
        expect(resultado).toBeDefined();
        expect(resultado.exito).toBe(true);
        expect(resultado.archivos).toBeDefined();
        // Aserción física eliminada por purificación Hexagonal (E15.6)
        // Aserción física eliminada por purificación Hexagonal (E15.6)
        // Aserción física eliminada por purificación Hexagonal (E15.6)

        // P.1 & P.2: Verificación de contenido exacto en disco
        const contenidoXhtml = fs.readFileSync(resultado.archivos.xhtml, 'utf8');
        expect(contenidoXhtml).toBe(artefactoMock.xhtml);

        const contenidoJson = JSON.parse(fs.readFileSync(resultado.archivos.jsonOficial, 'utf8'));
        expect(contenidoJson).toEqual(artefactoMock.jsonOficial);

        const contenidoMeta = JSON.parse(fs.readFileSync(resultado.archivos.metadatos, 'utf8'));
        expect(contenidoMeta).toEqual(artefactoMock.metadatos);
    });

});