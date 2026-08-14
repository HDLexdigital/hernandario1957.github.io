'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.4 — Anatomía Interna de Nodos del AST (Observacional)', () => {
    
    test('Inspección microscópica de las diferentes poblaciones del AST', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        // 2. Extracción de la colección en la ruta reina comprobada
        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 3. Contenedores para capturar muestras de cada población objetivo
        const muestras = {
            'Ninguno': [],
            'TerminoGlosario': [],
            'P01_BODY_CONT': [],
            'P01_BODY_BASE': []
        };

        const buscarMuestras = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estilo = nodo.inDesignStyle || nodo.estiloParrafo || nodo.estiloCaracter || '[sin-estilo]';
            
            for (const categoria of Object.keys(muestras)) {
                const coincide =
                    categoria === 'Ninguno'
                        ? estilo === '[Ninguno]' || estilo === '[sin-estilo]'
                        : estilo.includes(categoria);

                if (coincide && muestras[categoria].length < 2) {
                    muestras[categoria].push({
                        tipo: nodo.tipo,
                        tipoNodo: nodo.tipoNodo,
                        estiloParrafo: nodo.estiloParrafo,
                        inDesignStyle: nodo.inDesignStyle,
                        claseLegal: nodo.claseLegal,
                        texto: nodo.texto,
                        contenidoTipo: typeof nodo.contenido,
                        contenidoEsArray: Array.isArray(nodo.contenido),
                        contenidoMuestra: Array.isArray(nodo.contenido) ? nodo.contenido.length : nodo.contenido,
                        clavesInternas: Object.keys(nodo)
                    });
                }
            }

            // Profundizar recursivamente
            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                if (nodo[prop] && Array.isArray(nodo[prop])) {
                    nodo[prop].forEach(buscarMuestras);
                }
            });
        };

        listaNodos.forEach(buscarMuestras);

        console.log('\n====================================================================');
        console.log('   E12.6-C.4 — RADIOGRAFÍA MICROSCÓPICA DE PROPIEDADES (AST)');
        console.log('====================================================================');

        for (const [categoria, lista] of Object.entries(muestras)) {
            console.log(`\n--- MUESTRAS DE LA POBLACIÓN: [ ${categoria} ] ---`);
            lista.forEach((item, idx) => {
                console.log(`  [Muestra ${idx + 1}]:`, JSON.stringify(item, null, 2));
            });
        }

        console.log('\n====================================================================\n');

        expect(listaNodos.length).toBeGreaterThan(0);
    });

});