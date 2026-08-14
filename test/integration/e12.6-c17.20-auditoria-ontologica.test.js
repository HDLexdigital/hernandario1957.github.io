'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.20 — Auditoría Ontológica y Contractual de los 208 Contenedores', () => {

    test('Clasifica los 208 nodos contenedores según su estilo, tipo, rol ontológico y metadatos estructurales', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        const mapaEstilosContenedores = new Map();
        let contadorTotalContenedores = 0;

        const auditarOntologia = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                contadorTotalContenedores++;
                const estilo = nodo.inDesignStyle;
                const tipoNodo = nodo.tipoNodo || nodo.tipo || 'desconocido';
                const claseSemantica = nodo.claseSemantica || nodo.claseLegal || 'sin-clase-semantica';
                const cantidadHijos = nodo.contenido.length;

                if (!mapaEstilosContenedores.has(estilo)) {
                    mapaEstilosContenedores.set(estilo, {
                        estiloInDesign: estilo,
                        tipoNodo,
                        claseSemantica,
                        frecuencia: 0,
                        ejemplosHijos: new Set()
                    });
                }

                const registro = mapaEstilosContenedores.get(estilo);
                registro.frecuencia++;
                nodo.contenido.forEach(h => registro.ejemplosHijos.add(h.tipo || h.tipoNodo || 'desconocido'));
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarOntologia);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarOntologia);
        } else {
            auditarOntologia(raizAst);
        }

        // 2. Informe Ontológico en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.20 — AUDITORÍA ONTOLÓGICA DE NODOS CONTENEDORES');
        console.log('====================================================================');
        console.log(`   Total contenedores editoriales auditados : ${contadorTotalContenedores}`);
        console.log(`   Estilos InDesign únicos detectados      : ${mapaEstilosContenedores.size}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Tabla de correspondencia de estilos de contenedores:');
        
        mapaEstilosContenedores.forEach((val, key) => {
            console.log(`     - Estilo: "${key.padEnd(20)}" | TipoNodo: ${val.tipoNodo.padEnd(12)} | Frecuencia: ${String(val.frecuencia).padEnd(3)} | Hijos: ${Array.from(val.ejemplosHijos).join(', ')}`);
        });
        console.log('====================================================================\n');

        expect(contadorTotalContenedores).toBe(208);
        expect(mapaEstilosContenedores.size).toBeGreaterThan(0);
    });

});