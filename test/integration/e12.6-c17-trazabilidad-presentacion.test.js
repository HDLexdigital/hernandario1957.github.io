'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

// Intentamos importar el PresentationResolver de forma segura para auditar su contrato
let presentationResolver;
try {
    presentationResolver = require('../../src/resolucion/PresentationResolver');
} catch (e) {
    try {
        presentationResolver = require('../../src/constructores/PresentationResolver');
    } catch (err) {
        presentationResolver = null;
    }
}

describe('E12.6-C.17 — Trazabilidad Forense de la Resolución de Presentación', () => {

    test('Auditoría de métodos expuestos en PresentationResolver y su comportamiento ante estilos críticos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
        const resultado = adaptarInDesign({ jsonCrudo });

        console.log('\n====================================================================');
        console.log('   E12.6-C.17 — AUDITORÍA DE CONTRATO DE PRESENTATION RESOLVER');
        console.log('====================================================================');
        
        if (!presentationResolver) {
            console.log('   [Advertencia] No se pudo encontrar PresentationResolver en las rutas estándar.');
        } else {
            console.log('   Métodos/Exportaciones de PresentationResolver:', Object.keys(presentationResolver));
            if (typeof presentationResolver === 'function') {
                console.log('   PresentationResolver es una función directa.');
            } else {
                console.log('   ¿Tiene .resolve?:', typeof presentationResolver.resolve === 'function');
                console.log('   ¿Tiene .resolveParagraph?:', typeof presentationResolver.resolveParagraph === 'function');
            }
        }

        // Inspeccionamos cómo responden los nodos críticos a la resolución
        const estilosObjetivo = ['TerminoGlosario', 'P01_BODY_CONT', 'P01_BODY_BASE'];
        const muestrasRespuesta = {};

        const auditarPresentacion = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estilo = nodo.inDesignStyle || nodo.estiloParrafo;
            if (estilosObjetivo.includes(estilo)) {
                if (!muestrasRespuesta[estilo]) {
                    muestrasRespuesta[estilo] = {
                        estiloOriginal: estilo,
                        tieneResolvedClass: !!nodo.resolvedClass,
                        resolvedClassValor: nodo.resolvedClass || 'ninguna',
                        resultadoInvocacionResolve: null,
                        resultadoInvocacionResolveParagraph: null
                    };

                    if (presentationResolver) {
                        try {
                            if (typeof presentationResolver.resolve === 'function') {
                                muestrasRespuesta[estilo].resultadoInvocacionResolve = presentationResolver.resolve(nodo);
                            } else if (typeof presentationResolver === 'function') {
                                muestrasRespuesta[estilo].resultadoInvocacionResolve = presentationResolver(nodo);
                            }
                        } catch (err) {
                            muestrasRespuesta[estilo].resultadoInvocacionResolve = `ERROR: ${err.message}`;
                        }

                        try {
                            if (typeof presentationResolver.resolveParagraph === 'function') {
                                muestrasRespuesta[estilo].resultadoInvocacionResolveParagraph = presentationResolver.resolveParagraph(nodo);
                            } else {
                                muestrasRespuesta[estilo].resultadoInvocacionResolveParagraph = 'METODO_NO_EXISTE';
                            }
                        } catch (err) {
                            muestrasRespuesta[estilo].resultadoInvocacionResolveParagraph = `ERROR: ${err.message}`;
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarPresentacion);
            }
        };

        auditarPresentacion(resultado.ast);

        console.log('\n   Resultados de prueba para estilos críticos:');
        Object.entries(muestrasRespuesta).forEach(([estilo, data]) => {
            console.log(`     - Estilo [${estilo}]:`);
            console.log(`         resolvedClass en nodo: "${data.resolvedClassValor}"`);
            console.log(`         presentationResolver.resolve(nodo):`, data.resultadoInvocacionResolve);
            console.log(`         presentationResolver.resolveParagraph(nodo):`, data.resultadoInvocacionResolveParagraph);
        });
        console.log('====================================================================\n');

        expect(resultado.ast).toBeDefined();
    });

});