'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-BASE — Inspección del Constructor XHTML', () => {
    test('E12.6-BASE — Leer contenido de los constructores XHTML', () => {
        const rutasCandidatas = [
            path.resolve(__dirname, '../../../src/core/constructorXHTML.js'),
            path.resolve(__dirname, '../../../src/constructores/constructorXHTML.js')
        ];

        console.log('\n====================================================================');
        console.log('   E12.6-BASE — INSPECCIÓN DE CONSTRUCTORES XHTML');
        console.log('====================================================================');

        rutasCandidatas.forEach(ruta => {
            if (fs.existsSync(ruta)) {
                console.log(`\n📄 Archivo encontrado: ${path.relative(path.resolve(__dirname, '../../..'), ruta)}`);
                const contenido = fs.readFileSync(ruta, 'utf8');
                // Buscamos si contiene asignación de clases o etiquetas p / h2
                const lineasClase = contenido.split('\n').filter(l => l.includes('class') || l.includes('tag') || l.includes('p'));
                console.log(`   Total de líneas con indicios de marcado: ${lineasClase.length}`);
                console.log('   Primeras ocurrencias relevantes:');
                lineasClase.slice(0, 5).forEach(l => console.log(`     ↳ ${l.trim()}`));
            } else {
                console.log(`\n❌ No existe: ${ruta}`);
            }
        });
        console.log('\n====================================================================\n');

        expect(true).toBe(true);
    });
});