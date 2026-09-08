'use strict';

const fs = require('fs');
const path = require('path');
const { ejecutarPipelineModular } = require('../../src/pipelineModular');
const { PersistenciaAdapter } = require('../../src/infra/adaptadores/persistenciaAdapter');
const { TransporteUXPAdapter } = require('../../src/infra/adaptadores/transporteUXPAdapter');

describe('Auditoría de Consolidación C.45-C.50', () => {

    describe('1. C.46 - Exactitud del Artefacto Canónico', () => {
        test('Debe devolver estricta y únicamente { jsonOficial, xhtml, metadatos } sin fugas de propiedades', () => {
            const mockEntrada = { documento: 'audit.indd', contenido: [] };
            const resultado = ejecutarPipelineModular(mockEntrada);
            
            const llaves = Object.keys(resultado).sort();
            expect(llaves).toEqual(['jsonOficial', 'metadatos', 'xhtml']);
        });
    });

    describe('2. C.47 - Delimitación de Errores de Dominio', () => {
        test('Fallos por entradas anómalas deben arrojar errores estructurados, no TypeErrors nativos', () => {
            expect(() => ejecutarPipelineModular(null)).toThrow(/ERR_/);
            expect(() => ejecutarPipelineModular([])).toThrow(/ERR_/);
            expect(() => ejecutarPipelineModular({ foo: 'bar' })).toThrow(/ERR_/);
        });
    });

    describe('3. C.48 - Casos Límite en Persistencia', () => {
        test('PersistenciaAdapter debe fallar con rutas de destino inválidas', () => {
            const adaptador = new PersistenciaAdapter();
            const artefactoMock = { jsonOficial: {}, xhtml: '', metadatos: {} };
            
            expect(() => adaptador.guardar(artefactoMock, null)).toThrow('ERR_INVALID_DESTINATION');
            expect(() => adaptador.guardar(artefactoMock, 123)).toThrow('ERR_INVALID_DESTINATION');
        });
    });

    describe('4. C.50 - Exactitud del Payload IPC', () => {
        test('El TransporteUXPAdapter no debe incluir propiedades ajenas en el envoltorio', async () => {
            let payloadInterceptado = null;
            const mockCliente = { send: async (payload) => { payloadInterceptado = JSON.parse(payload); return { id: 'tx_1' }; } };
            const adaptador = new TransporteUXPAdapter(mockCliente);
            
			await adaptador.enviar({ jsonOficial: {}, xhtml: '<html/>', metadatos: {} });
            
            const llavesEnvoltorio = Object.keys(payloadInterceptado).sort();
            expect(llavesEnvoltorio).toEqual(['payload', 'timestamp', 'tipo']);
        });
    });

    describe('4. C.50 - Exactitud del Payload IPC', () => {
        test('El TransporteUXPAdapter no debe incluir propiedades ajenas en el envoltorio', async () => {
            let payloadInterceptado = null;
            const mockCliente = { send: async (payload) => { payloadInterceptado = JSON.parse(payload); return { id: 'tx_1' }; } };
            const adaptador = new TransporteUXPAdapter(mockCliente);
            
            await adaptador.enviar({ jsonOficial: {}, xhtml: '<html/>', metadatos: {} });
            
            const llavesEnvoltorio = Object.keys(payloadInterceptado).sort();
            expect(llavesEnvoltorio).toEqual(['payload', 'timestamp', 'tipo']);
        });
    });

    describe('6. Pureza Transitiva (Grafo src/core)', () => {
        test('Ningún archivo dentro de src/core debe contener process.env, __dirname, o requires de infraestructura', () => {
            const corePath = path.resolve(__dirname, '../../src/core');
            
            function scanDir(dir) {
                let resultados = [];
                const archivos = fs.readdirSync(dir);
                for (const archivo of archivos) {
                    const fullPath = path.join(dir, archivo);
                    if (fs.statSync(fullPath).isDirectory()) {
                        resultados = resultados.concat(scanDir(fullPath));
                    } else if (fullPath.endsWith('.js')) {
                        resultados.push(fullPath);
                    }
                }
                return resultados;
            }

            const archivosCore = scanDir(corePath);
            let archivosContaminados = [];

            archivosCore.forEach(archivo => {
                const contenido = fs.readFileSync(archivo, 'utf8');
                const tieneProcess = /\bprocess\.env\b/.test(contenido);
                const tieneDirname = /\b__dirname\b/.test(contenido);
                const tieneRequireFs = /\brequire\s*\(\s*['"]fs['"]\s*\)/.test(contenido);
                const tieneRequirePath = /\brequire\s*\(\s*['"]path['"]\s*\)/.test(contenido);
                
                if (tieneProcess || tieneDirname || tieneRequireFs || tieneRequirePath) {
                    archivosContaminados.push(path.basename(archivo));
                }
            });

            // Si hay archivos aquí, tenemos un grave problema de contaminación transitiva
            expect(archivosContaminados).toEqual([]); 
        });
    });
});