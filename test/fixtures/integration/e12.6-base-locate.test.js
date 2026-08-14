'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-BASE — Localización de Clases CSS en el Constructor XHTML', () => {
    test('E12.6-BASE — Buscar ocurrencias de class= o atributo de estilo en constructores', () => {
        const rutasCandidatas = [
            path.resolve(__dirname, '../../../src/core/constructorXHTML.js'),
            path.resolve(__dirname, '../../../src/constructores/constructorXHTML.js')
        ];

        console.log('\n====================================================================');
        console.log('   E12.6-BASE — BÚSQUEDA DE INYECCIÓN DE CLASES EN RENDERERS');
        console.log('====================================================================');

        rutasCandidatas.forEach(ruta => {
            if (fs.existsSync(ruta)) {
                const relPath = path.relative(path.resolve(__dirname, '../../..'), ruta);
                console.log(`\n📄 Analizando: ${relPath}`);
                const contenido = fs.readFileSync(ruta, 'utf8');
                const lineas = contenido.split('\n');
                
                lineas.forEach((linea, idx) => {
                    if (linea.includes('class') || linea.includes('clase') || linea.includes('perfil') || linea.includes('render')) {
                        console.log(`   [Línea ${idx + 1}]: ${linea.trim()}`);
                    }
                });
            }
        });
        console.log('\n====================================================================\n');

        expect(true).toBe(true);
    });
});