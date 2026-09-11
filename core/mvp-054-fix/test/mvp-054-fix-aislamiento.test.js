'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-054-FIX: Aislamiento del núcleo src/core/', () => {
    const CORE_DIR = path.join(__dirname, '..', '..', '..', 'src', 'core');

    // Rutas prohibidas: el core no debe depender de otras capas del proyecto
    const RUTAS_PROHIBIDAS = [
        /require\(['"][^'"]*scripts\//,
        /require\(['"][^'"]*core\/web\//,
        /require\(['"][^'"]*core\/api\//,
        /require\(['"][^'"]*core\/admin\//
    ];

    function listarJS(dir) {
        const result = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                result.push(...listarJS(full));
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                result.push(full);
            }
        }
        return result;
    }

    test('src/core/ no depende de scripts/, core/web/ ni core/api/', () => {
        const archivos = listarJS(CORE_DIR);
        const violaciones = [];

        archivos.forEach(archivo => {
            const content = fs.readFileSync(archivo, 'utf8');
            RUTAS_PROHIBIDAS.forEach(re => {
                const m = content.match(re);
                if (m) {
                    violaciones.push({
                        archivo: path.relative(CORE_DIR, archivo),
                        dependencia: m[0]
                    });
                }
            });
        });

        if (violaciones.length > 0) {
            console.log('\n⚠️ Dependencias prohibidas en src/core/:');
            violaciones.forEach(v => console.log('  - ' + v.archivo + ' → ' + v.dependencia));
        }

        expect(violaciones).toEqual([]);
    });

    test('src/core/ no escala fuera de su propio directorio', () => {
        const archivos = listarJS(CORE_DIR);
        const violaciones = [];

        archivos.forEach(archivo => {
            const content = fs.readFileSync(archivo, 'utf8');
            const re = /require\(['"](\.\.\/\.\.\/\.\.\/[^'"]+)['"]\)/g;
            let m;
            while ((m = re.exec(content)) !== null) {
                const ruta = m[1];
                // Permitir ../../.. solo si permanece dentro de src/
                const resolved = path.resolve(path.dirname(archivo), ruta);
                if (!resolved.startsWith(path.join(CORE_DIR, '..', '..'))) {
                    violaciones.push({ archivo: path.relative(CORE_DIR, archivo), ruta });
                }
            }
        });

        expect(violaciones).toEqual([]);
    });
});
