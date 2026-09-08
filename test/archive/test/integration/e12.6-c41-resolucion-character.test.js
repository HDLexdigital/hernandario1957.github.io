'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.41 — Resolución y Conformidad de Estilos de Carácter', () => {

    test('Invariante C.41: compilarLexmotor resuelve correctamente nodos character (span y resolvedClass) preservando texto y fronteras', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const jsonCrudo = JSON.parse(
            fs.readFileSync(rutaJson, 'utf8')
        );

        // 1. Ejecutar E10 (C.38 GREEN)
        const adaptadoE10 = adaptarInDesign({ jsonCrudo });
        const astE10 = adaptadoE10.ast;

        // 2. Ejecutar compilación a auditar
        const resultadoCompilacion = compilarLexmotor(astE10);
        const astCompilado = resultadoCompilacion.ast;

        let totalCaracteresAuditados = 0;
        let caracteresConTerminoGlosario = 0;
        let caracteresConNinguno = 0;
        let fallosResolucionTag = 0;
        let fallosResolucionClase = 0;
        let fallosTextoOriginal = 0;

        const auditarNodosRecursivo = (nodoE10, nodoComp) => {
            if (!nodoE10 || !nodoComp || typeof nodoE10 !== 'object' || typeof nodoComp !== 'object') return;

            if (nodoComp.tipoNodo === 'character') {
                totalCaracteresAuditados++;
                const estilo = nodoComp.inDesignStyle || nodoComp.estiloCaracter || '';

                if (estilo === 'TerminoGlosario') {
                    caracteresConTerminoGlosario++;
                    if (nodoComp.resolvedTag !== 'span') {
                        fallosResolucionTag++;
                    }
                    if (nodoComp.resolvedClass !== 'terminoglosario') {
                        fallosResolucionClase++;
                    }
                } else if (estilo === '[Ninguno]' || !estilo) {
                    caracteresConNinguno++;
                    // Todo nodo character debe representarse como span inline por contrato E12
                    if (nodoComp.resolvedTag !== 'span') {
                        fallosResolucionTag++;
                    }
                    if (nodoComp.resolvedClass !== null) {
                        fallosResolucionClase++;
                    }
                }

                if (nodoComp.texto !== nodoE10.texto) {
                    fallosTextoOriginal++;
                }
            }

            if (Array.isArray(nodoE10.contenido) && Array.isArray(nodoComp.contenido)) {
                for (let i = 0; i < nodoE10.contenido.length; i++) {
                    auditarNodosRecursivo(nodoE10.contenido[i], nodoComp.contenido[i]);
                }
            }
        };

        const raizE10 = astE10.contenido || astE10;
        const raizComp = astCompilado.contenido || astCompilado;

        if (Array.isArray(raizE10) && Array.isArray(raizComp)) {
            for (let i = 0; i < raizE10.length; i++) {
                auditarNodosRecursivo(raizE10[i], raizComp[i]);
            }
        } else {
            auditarNodosRecursivo(raizE10, raizComp);
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.41 — INFORME DE AUDITORÍA DE CARACTERES (COMPILADOR)');
        console.log('====================================================================');
        console.log(`   Total nodos character auditados      : ${totalCaracteresAuditados}`);
        console.log(`   - Caracteres TerminoGlosario detectados: ${caracteresConTerminoGlosario}`);
        console.log(`   - Caracteres [Ninguno] detectados      : ${caracteresConNinguno}`);
        console.log(`   - Fallos en resolvedTag ('span')     : ${fallosResolucionTag}`);
        console.log(`   - Fallos en resolvedClass             : ${fallosResolucionClase}`);
        console.log(`   - Fallos de alteración de texto       : ${fallosTextoOriginal}`);
        console.log('====================================================================\n');

        // Expectativas del contrato C.41 en estado GREEN consolidado
        expect(totalCaracteresAuditados).toBeGreaterThan(0);
        expect(fallosResolucionTag).toBe(0);
        expect(fallosResolucionClase).toBe(0);
        expect(fallosTextoOriginal).toBe(0);
    });
});