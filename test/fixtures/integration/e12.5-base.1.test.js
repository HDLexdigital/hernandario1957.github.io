'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.5-BASE.1 — Reconstrucción Forense de la Trazabilidad de Origen (InDesign → AST)', () => {

    test('E12.5-BASE.1 — Mapeo empírico de estilos originales de InDesign hacia tipos semánticos y perfiles', () => {
        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');

        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        console.log('\n====================================================================');
        console.log('   E12.5-BASE.1 — MATRIZ DE TRAZABILIDAD DE ORIGEN (INDESIGN → AST)');
        console.log('====================================================================');

        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
        const nodosAST = adaptacion.ast && Array.isArray(adaptacion.ast.contenido) 
            ? adaptacion.ast.contenido 
            : [];

        const mapaTrazabilidad = {};

        nodosAST.forEach(nodo => {
            const tipoSemantico = nodo.tipo || nodo.tipoNodo || 'desconocido';
            // Capturamos el estilo original utilizando las propiedades reales descubiertas
            const estiloOrigen = nodo.estiloParrafo || nodo.inDesignStyle || nodo.estiloOriginal || 'NO_REGISTRADO';

            if (!mapaTrazabilidad[tipoSemantico]) {
                mapaTrazabilidad[tipoSemantico] = {
                    estilosInDesignOrigen: new Set(),
                    ejemplosContenido: []
                };
            }

            mapaTrazabilidad[tipoSemantico].estilosInDesignOrigen.add(estiloOrigen);
            if (mapaTrazabilidad[tipoSemantico].ejemplosContenido.length < 2) {
                mapaTrazabilidad[tipoSemantico].ejemplosContenido.push(
                    (nodo.texto || nodo.content || '').substring(0, 40) + '...'
                );
            }
        });

        console.log(`\nTotal de tipos semánticos descubiertos: ${Object.keys(mapaTrazabilidad).length}\n`);

        for (const [tipoSemantico, datos] of Object.entries(mapaTrazabilidad)) {
            console.log(`--------------------------------------------------------------------`);
            console.log(`[TIPO SEMÁNTICO AST]: ${tipoSemantico}`);
            console.log(`  Estilos de InDesign detectados en el origen:`);
            datos.estilosInDesignOrigen.forEach(estilo => {
                console.log(`    ↳ "${estilo}"`);
            });
            console.log(`  Muestra de contenido:`);
            datos.ejemplosContenido.forEach(ej => {
                console.log(`    " ${ej} "`);
            });
        }

        console.log('\n====================================================================');
        console.log('   E12.5-BASE.1 CONCLUIDO EXITOSAMENTE');
        console.log('====================================================================');

        expect(nodosAST.length).toBeGreaterThan(0);
    });

});