'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-041 Public Home Builder', () => {
    const htmlPath = path.join(process.cwd(), 'public', 'index.html');

    test('Genera public/index.html', () => {
        execSync('node scripts/build-public-home.js');
        expect(fs.existsSync(htmlPath)).toBe(true);
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('LexDigitalHD 2.0');
        expect(content).toContain('Búsqueda Simplificada');
        expect(content).toContain('Búsqueda Avanzada');
        expect(content).toContain('Búsqueda con Relevancia');
        expect(content).toContain('Novedades');
        expect(content).toContain('Línea de Tiempo Global');
        expect(content).toContain('Métricas');
        expect(content).toContain('Exportaciones');
        expect(content).toContain('Colección Completa');
    });
});
