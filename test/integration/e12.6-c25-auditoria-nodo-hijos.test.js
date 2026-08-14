'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.25 — Auditoría Estructural Directa de los 208 Contenedores AST y sus Hijos', () => {

    test('Inspecciona metadatos, tipos de hijos y características de fragmentación en los 208 contenedores', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        const resumenTiposHijos = new Map();
        const muestrasDetalle = [];

        const auditarNodosAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const estilo = nodo.inDesignStyle;
                const textoPadreLen = (nodo.texto || '').length;
                const cantidadHijos = nodo.contenido.length;

                nodo.contenido.forEach(hijo => {
                    const tipoHijo = hijo.tipo || hijo.tipoNodo || 'desconocido';
                    resumenTiposHijos.set(tipoHijo, (resumenTiposHijos.get(tipoHijo) || 0) + 1);
                });

                if (muestrasDetalle.length < 8) {
                    muestrasDetalle.push({
                        estilo,
                        traceId: nodo.__traceId || 'sin-traza',
                        textoPadreLen,
                        cantidadHijos,
                        tiposHijos: nodo.contenido.map(h => h.tipo || h.tipoNodo || 'desc'),
                        textosHijosPreview: nodo.contenido.map(h => (h.texto || '').substring(0, 20))
                    });
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarNodosAST);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarNodosAST);
        } else {
            auditarNodosAST(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.25 — INFORME DE AUDITORÍA ESTRUCTURAL AST (NODOS & HIJOS)');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados       : ${totalContenedores}`);
        console.log('   Distribución de tipos en hijos internos:');
        resumenTiposHijos.forEach((count, tipo) => {
            console.log(`     - Tipo hijo [${tipo}] : ${count} ocurrencias`);
        });
        console.log('--------------------------------------------------------------------');
        console.log('   Muestras de estructura interna de contenedores:');
        muestrasDetalle.forEach((m, idx) => {
            console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | Hijos: ${m.cantidadHijos} | Tipos: ${JSON.stringify(m.tiposHijos)}`);
            console.log(`         Preview textos hijos: ${JSON.stringify(m.textosHijosPreview)}`);
        });
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
        expect(resumenTiposHijos.size).toBeGreaterThan(0);
    });

});