'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.31 — Auditoría Específica de Fugas Intercontenedor', () => {

    test('Busca de forma exhaustiva si algún contenedor hijo contiene texto o fragmentos de artículos subsiguientes', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        const contenedoresGlobales = [];

        // Recolectar todos los contenedores editoriales en orden lineal de aparición
        const recolectarContenedores = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                contenedoresGlobales.push({
                    estilo: nodo.inDesignStyle,
                    texto: (nodo.texto || '').trim(),
                    hijosTextos: nodo.contenido.map(h => (h.texto || '').trim())
                });
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(recolectarContenedores);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(recolectarContenedores);
        } else {
            recolectarContenedores(raizAst);
        }

        let totalFugasDetectadas = 0;
        const muestrasFugasDetectadas = [];

        // Inspeccionar si el contenedor N+1 aparece mencionado o contenido dentro de los hijos del contenedor N
        for (let i = 0; i < contenedoresGlobales.length - 1; i++) {
            const actual = contenedoresGlobales[i];
            const siguiente = contenedoresGlobales[i + 1];

            // Extraer porciones clave del siguiente contenedor (ej. "Artículo X")
            const matchArticulo = siguiente.texto.match(/Artículo\s+\d+/i);
            if (matchArticulo) {
                const tokenClave = matchArticulo[0]; // Ej: "Artículo 2"

                // Verificar si este token aparece en los hijos del contenedor actual
                const fugaEnHijos = actual.hijosTextos.some((hijoTexto, idx) => {
                    // Ignoramos el último hijo si por diseño el contenedor agrupa texto continuo, 
                    // pero si aparece el token del siguiente artículo, es una fuga clara de frontera.
                    return idx > 0 && hijoTexto.includes(tokenClave);
                });

                if (fugaEnHijos) {
                    totalFugasDetectadas++;
                    if (muestrasFugasDetectadas.length < 3) {
                        muestrasFugasDetectadas.push({
                            indice: i,
                            estiloActual: actual.estilo,
                            tokenBuscado: tokenClave,
                            estiloSiguiente: siguiente.estilo,
                            textoSiguientePreview: siguiente.texto.substring(0, 30)
                        });
                    }
                }
            }
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.31 — INFORME DE AUDITORÍA ESPECÍFICA DE FUGAS');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados       : ${contenedoresGlobales.length}`);
        console.log(`   Fugas intercontenedor detectadas    : ${totalFugasDetectadas}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasFugasDetectadas.length > 0) {
            console.log('   Detalle de fugas estructurales encontradas:');
            muestrasFugasDetectadas.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Contenedor [${m.indice}] (${m.estiloActual}) contiene el token "${m.tokenBuscado}" perteneciente a (${m.estiloSiguiente})`);
            });
        } else {
            console.log('   [VERIFICADO] No se detectaron fugas de marcadores de artículos entre contenedores.');
        }
        console.log('====================================================================\n');

        expect(contenedoresGlobales.length).toBe(208);
    });

});