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
        'build-public.js' // Orquestador de build: puede invocar exec/spawn y coordinar otros scripts
    ];

    test('Los scripts build-*.js actúan como wrappers delgados', () => {
        const files = fs.readdirSync(scriptsDir)
            .filter(f => f.startsWith('build-') && f.endsWith('.js'));

        const violaciones = [];

        files.forEach(file => {
            if (EXCEPCIONES.includes(file)) return;

            const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');

            const importaCore = content.includes('src/core/') || content.includes("'../src/core/") || content.includes("'../../src/core/");
            const tieneLogicaProhibida = PATRONES_PROHIBIDOS.some(p => content.includes(p));

            if (!importaCore || tieneLogicaProhibida) {
                violaciones.push({
                    archivo: file,
                    importaCore,
                    tieneLogicaProhibida
                });
            }
        });

        if (violaciones.length > 0) {
            console.log('\n⚠️ Scripts que aún no son wrappers delgados:');
            violaciones.forEach(v => {
                console.log('  - ' + v.archivo + ' | importaCore: ' + v.importaCore + ' | lógicaProhibida: ' + v.tieneLogicaProhibida);
            });
        }

        expect(violaciones).toEqual([]);
    });

    test('El contrato MVP-053 está en 1.0.0', () => {
        const contractPath = path.join(__dirname, '..', 'mvp-053-compilador-modular.contract.json');
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.version).toBe('1.0.0');
    });
});
