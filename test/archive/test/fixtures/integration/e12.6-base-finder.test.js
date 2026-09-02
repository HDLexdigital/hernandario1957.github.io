'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-BASE — Localización forense del Renderer XHTML', () => {
    test('E12.6-BASE — Listar archivos del directorio src/ recursivamente', () => {
        const srcDir = path.resolve(__dirname, '../../../src');
        
        function getFiles(dir, fileList = []) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    getFiles(filePath, fileList);
                } else {
                    fileList.push(path.relative(srcDir, filePath));
                }
            });
            return fileList;
        }

        const archivosSrc = getFiles(srcDir);
        
        console.log('\n====================================================================');
        console.log('   E12.6-BASE — INVENTARIO DE ARCHIVOS EN SRC/');
        console.log('====================================================================');
        archivosSrc.forEach(f => console.log(`  📂 src/${f}`));
        console.log('====================================================================\n');

        expect(archivosSrc.length).toBeGreaterThan(0);
    });
});