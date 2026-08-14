'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.27 — Auditoría de Fragmentos, Estilos e Inline en Nodos Hijos', () => {

    test('Inspecciona metadatos, propiedades tipográficas, estilos de carácter y atributos de los 909 nodos hijos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let totalHijosAuditados = 0;
        const propiedadesHijosSet = new Set();
        const muestrasHijos = [];

        const auditarHijosDetalle = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                nodo.contenido.forEach((hijo, idx) => {
                    totalHijosAuditados++;
                    
                    // Recolectar todas las keys / propiedades presentes en el objeto hijo para detectar metadatos de estilo o carácter
                    Object.keys(hijo).forEach(key => propiedadesHijosSet.add(key));

                    if (muestrasHijos.length < 10) {
                        muestrasHijos.push({
                            estiloPadre: nodo.inDesignStyle,
                            indiceHijo: idx,
                            tipoHijo: hijo.tipo || hijo.tipoNodo || 'desc',
                            estiloHijo: hijo.inDesignStyle || hijo.estilo || hijo.charStyle || 'sin-estilo-especifico',
                            textoHijo: (hijo.texto || '').trim(),
                            keysDisponibles: Object.keys(hijo)
                        });
                    }
                });
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarHijosDetalle);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarHijosDetalle);
        } else {
            auditarHijosDetalle(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.27 — INFORME DE AUDITORÍA DE FRAGMENTOS E INLINE');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados       : ${totalContenedores}`);
        console.log(`   Total nodos hijos auditados         : ${totalHijosAuditados}`);
        console.log(`   Propiedades (keys) únicas en hijos  : ${Array.from(propiedadesHijosSet).join(', ')}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Muestra de la estructura y metadatos de los nodos hijos:');
        muestrasHijos.forEach((m, idx) => {
            console.log(`     [${idx + 1}] Padre estilo: "${m.estiloPadre}" | Hijo tipo: ${m.tipoHijo} | Estilo hijo: ${m.estiloHijo}`);
            console.log(`         Texto: "${m.textoHijo}"`);
            console.log(`         Keys: ${JSON.stringify(m.keysDisponibles)}`);
        });
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
        expect(totalHijosAuditados).toBe(909);
    });

});