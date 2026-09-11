'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-053: Unicidad de Implementación (Core vs Wrappers)', () => {
    const scriptsDir = path.join(__dirname, '..', '..', '..', 'scripts');

    const PATRONES_PROHIBIDOS = [
        'fs.writeFileSync',
        'fs.readFileSync',
        'JSON.parse(',
        'JSON.stringify('
    ];

    const EXCEPCIONES = [
        'build-public.js'
    ];

    function listarWrappers() {
        return fs.readdirSync(scriptsDir)
            .filter(f => f.startsWith('build-') && f.endsWith('.js'))
            .filter(f => !EXCEPCIONES.includes(f));
    }

    test('Regla 1: wrappers sin lógica I/O prohibida', () => {
        const violaciones = [];

        listarWrappers().forEach(file => {
            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            const importaCore = content.includes('src/core/');
            const tieneLogicaProhibida = PATRONES_PROHIBIDOS.some(p => content.includes(p));

            if (!importaCore || tieneLogicaProhibida) {
                violaciones.push({ archivo: file, importaCore, tieneLogicaProhibida });
            }
        });

        if (violaciones.length > 0) {
            console.log('\n⚠️ Wrappers no delgados:');
            violaciones.forEach(v => console.log('  - ' + v.archivo));
        }

        expect(violaciones).toEqual([]);
    });

    test('Regla 2: sin dependencias scripts → scripts', () => {
        const violaciones = [];

        listarWrappers().forEach(file => {
            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            const re = /require\(['"](?:\.\.\/)?(?:\.\.\/)?scripts\/([^'"]+)['"]\)/g;
            let m;
            while ((m = re.exec(content)) !== null) {
                violaciones.push({ archivo: file, dependencia: m[1] });
            }
        });

        if (violaciones.length > 0) {
            console.log('\n⚠️ Dependencias scripts → scripts:');
            violaciones.forEach(v => console.log('  - ' + v.archivo + ' → ' + v.dependencia));
        }

        expect(violaciones).toEqual([]);
    });

    test('Regla 3: sin funciones duplicadas entre wrappers', () => {
        const funcionesPorNombre = new Map();

        listarWrappers().forEach(file => {
            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            const re = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
            let m;
            while ((m = re.exec(content)) !== null) {
                const nombre = m[1];
                if (!funcionesPorNombre.has(nombre)) {
                    funcionesPorNombre.set(nombre, []);
                }
                funcionesPorNombre.get(nombre).push(file);
            }
        });

        const duplicadas = [];
        funcionesPorNombre.forEach((archivos, nombre) => {
            if (archivos.length > 1) {
                duplicadas.push({ funcion: nombre, archivos });
            }
        });

        if (duplicadas.length > 0) {
            console.log('\n⚠️ Funciones duplicadas entre wrappers:');
            duplicadas.forEach(d => console.log('  - ' + d.funcion + ' en ' + d.archivos.join(', ')));
        }

        expect(duplicadas).toEqual([]);
    });

    test('Regla 4: todos los wrappers delegan en src/core/compiladores/', () => {
        const violaciones = [];

        listarWrappers().forEach(file => {
            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            if (!content.includes("src/core/")) {
                violaciones.push(file);
            }
        });

        expect(violaciones).toEqual([]);
    });

    test('Regla 5: sin patrones de lógica sustantiva en wrappers', () => {
        const PATRONES_LOGICA = [
            /for\s*\(.+\)\s*\{/,
            /while\s*\(.+\)\s*\{/,
            /\.map\s*\(/,
            /\.filter\s*\(/,
            /\.reduce\s*\(/
        ];

        const violaciones = [];

        listarWrappers().forEach(file => {
            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            const tienePatron = PATRONES_LOGICA.some(re => re.test(content));
            if (tienePatron) {
                violaciones.push(file);
            }
        });

        if (violaciones.length > 0) {
            console.log('\n⚠️ Wrappers con lógica sustantiva:');
            violaciones.forEach(v => console.log('  - ' + v));
        }

        expect(violaciones).toEqual([]);
    });

    test('Contrato MVP-053 en 1.0.0', () => {
        const contractPath = path.join(__dirname, '..', 'mvp-053-compilador-modular.contract.json');
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.version).toBe('1.0.0');
    });
});
