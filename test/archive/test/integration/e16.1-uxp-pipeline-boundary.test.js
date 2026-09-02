/**
 * @fileoverview test/integration/e16.1-uxp-pipeline-boundary.test.js
 *
 * E16.1 — Contrato UXP -> Pipeline (El Cliente Tonto)
 * Instrumento corregido: Aislamiento de caché de módulos para Spies precisos
 * y aserciones estrictas de no-contaminación del AST.
 */

'use strict';

// ⚠️ IMPORTANTE: Ajusta el nombre del archivo al final de esta ruta 
// (ej. 'pipelineModular', 'orquestador', 'index', según cómo lo hayas nombrado en src/)
const RUTA_ORQUESTADOR = '../../src/pipelineModular'; 

describe('E16.1 — Frontera Opaca UXP a Pipeline', () => {
    const payloadCrudoMock = {
        documento: 'uxp_test.indd',
        contenido: [{ tipoNodo: 'paragraph', estiloParrafo: 'Titulo', texto: 'Contrato E16.1' }]
    };

    beforeEach(() => {
        // Limpiamos el caché de require() antes de cada test para garantizar aislamiento
        jest.resetModules();
    });

    test('E16.1-D: Aislamiento de errores (Rechaza payloads inválidos en la frontera)', () => {
        const { ejecutarPipelineModular } = require(RUTA_ORQUESTADOR);
        
        expect(() => ejecutarPipelineModular(null)).toThrow(/ERR_INVALID_INPUT/);
        expect(() => ejecutarPipelineModular([])).toThrow(/ERR_INVALID_INPUT/);
        expect(() => ejecutarPipelineModular({})).toThrow(/ERR_INVALID_INPUT/);
    });

    test('E16.1-A & E16.1-C: Entrada opaca y Salida pública estable', () => {
        const { ejecutarPipelineModular } = require(RUTA_ORQUESTADOR);
        
        const resultado = ejecutarPipelineModular(payloadCrudoMock, { nombreBase: 'doc_uxp' });

        // Salida estandarizada esperada por el cliente
        expect(resultado).toHaveProperty('xhtml');
        expect(resultado).toHaveProperty('jsonOficial');
        expect(resultado).toHaveProperty('metadatos');

        expect(typeof resultado.xhtml).toBe('string');
        expect(resultado.metadatos.nombre).toBe('doc_uxp');
    });

    test('E16.1-B & E16.1-F: Adaptación interna y Caja Negra (Mock del Pipeline)', () => {
        // 1. Preparamos los mocks ANTES de requerir el orquestador
        const mockAdapter = { 
            adaptarInDesign: jest.fn(req => ({ ast: req.jsonCrudo })) 
        };
        const mockCore = { 
            compilarLexmotor: jest.fn(ast => ({ ast: ast, xhtml: '<xhtml>Mock</xhtml>' })) 
        };

        // 2. Inyectamos los mocks en el sistema de módulos de Jest
        jest.doMock('../../src/adaptadores/InDesignAdapter', () => mockAdapter);
        jest.doMock('../../src/compiladores/compilarLexmotor', () => mockCore);

        // 3. Ahora requerimos el Orquestador (cargará las dependencias mockeadas)
        const { ejecutarPipelineModular } = require(RUTA_ORQUESTADOR);

        // 4. Ejecutamos
        ejecutarPipelineModular(payloadCrudoMock, { nombreBase: 'caja_negra' });

        // 5. Aserciones de intercepción (Resolviendo el problema del destructuring)
        expect(mockAdapter.adaptarInDesign).toHaveBeenCalledTimes(1);
        expect(mockAdapter.adaptarInDesign).toHaveBeenCalledWith(
            expect.objectContaining({ jsonCrudo: payloadCrudoMock })
        );
        
        expect(mockCore.compilarLexmotor).toHaveBeenCalledTimes(1);
        // El Core recibe el AST y las opciones (basado en la última refactorización)
        expect(mockCore.compilarLexmotor).toHaveBeenCalledWith(
            expect.objectContaining({
                documento: 'uxp_test.indd',
                contenido: expect.any(Array)
            }),
            expect.any(Object) 
        );
    });

    test('E16.1-E: No contaminación (Proyección pública limpia hacia UXP)', () => {
        // Ejecutamos con los módulos reales
        const { ejecutarPipelineModular } = require(RUTA_ORQUESTADOR);
        const resultado = ejecutarPipelineModular(payloadCrudoMock);

        // El cliente UXP no debe recibir propiedades de infraestructura
        expect(resultado).not.toHaveProperty('fs');
        expect(resultado).not.toHaveProperty('PresentationResolver');
        
        // CUIDADO: Aquí es donde E16.1-E debería fallar (RED) si el Orquestador
        // no está limpiando el AST enriquecido antes de devolver jsonOficial.
        const token = resultado.jsonOficial.tokens[0];
        
        expect(token).toBeDefined();
        expect(token).not.toHaveProperty('resolvedTag');
        expect(token).not.toHaveProperty('resolvedClass');
        expect(token).not.toHaveProperty('claseSemantica');
    });
});