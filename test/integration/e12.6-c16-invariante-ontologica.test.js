'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.16 — Invariante Ontológica en InDesignAdapter', () => {
    test('Invariante: Todo nodo con estiloParrafo debe ser estrictamente tipoNodo=paragraph', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
        const resultado = adaptarInDesign({ jsonCrudo });

        let totalNodosParrafo = 0;
        let violacionesInvariante = 0;

        const recorrer = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            if (nodo.estiloParrafo) {
                totalNodosParrafo++;
                if (nodo.tipoNodo !== 'paragraph') {
                    violacionesInvariante++;
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(recorrer);
            }
        };

        recorrer(resultado.ast);

        console.log(`\n[C.16 AUDIT] Total nodos con estiloParrafo evaluados: ${totalNodosParrafo}`);
        console.log(`[C.16 AUDIT] Violaciones de la invariante (estiloParrafo sin tipoNodo=paragraph): ${violacionesInvariante}`);

        // El invariante contractual exige que cero nodos con estilo de párrafo tengan un tipoNodo incorrecto
        expect(violacionesInvariante).toBe(0);
        expect(totalNodosParrafo).toBeGreaterThan(0); // Aseguramos que la prueba sí evaluó nodos reales
    });
});