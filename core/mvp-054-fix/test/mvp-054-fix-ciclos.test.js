'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-054-FIX: Detección de ciclos en src/core/', () => {
    const CORE_DIR = path.join(__dirname, '..', '..', '..', 'src', 'core');

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

    function extraerRequires(content) {
        const re = /require\(['"](\.[^'"]+)['"]\)/g;
        const requires = [];
        let m;
        while ((m = re.exec(content)) !== null) {
            requires.push(m[1]);
        }
        return requires;
    }

    function resolverRuta(archivoBase, relRequire) {
        const dir = path.dirname(archivoBase);
        let abs = path.resolve(dir, relRequire);
        if (!abs.endsWith('.js') && fs.existsSync(abs + '.js')) {
            abs = abs + '.js';
        }
        if (fs.existsSync(abs)) return abs;
        if (fs.existsSync(abs + '.js')) return abs + '.js';
        if (fs.existsSync(path.join(abs, 'index.js'))) return path.join(abs, 'index.js');
        return null;
    }

    function construirGrafo(archivos) {
        const grafo = new Map();
        for (const archivo of archivos) {
            const content = fs.readFileSync(archivo, 'utf8');
            const deps = extraerRequires(content)
                .map(r => resolverRuta(archivo, r))
                .filter(x => x !== null && x.startsWith(CORE_DIR));
            grafo.set(archivo, deps);
        }
        return grafo;
    }

    function detectarCiclos(grafo) {
        const ciclos = [];
        const estado = new Map();
        const pila = [];

        function dfs(nodo) {
            estado.set(nodo, 'visiting');
            pila.push(nodo);

            const vecinos = grafo.get(nodo) || [];
            for (const vecino of vecinos) {
                const est = estado.get(vecino);
                if (est === 'visiting') {
                    const idx = pila.indexOf(vecino);
                    const ciclo = pila.slice(idx).concat(vecino);
                    ciclos.push(ciclo);
                } else if (!est) {
                    dfs(vecino);
                }
            }

            pila.pop();
            estado.set(nodo, 'visited');
        }

        for (const nodo of grafo.keys()) {
            if (!estado.has(nodo)) dfs(nodo);
        }

        return ciclos;
    }

    test('No hay ciclos de dependencia entre módulos de src/core/', () => {
        const archivos = listarJS(CORE_DIR);
        const grafo = construirGrafo(archivos);
        const ciclos = detectarCiclos(grafo);

        if (ciclos.length > 0) {
            console.log('\n⚠️ Ciclos detectados:');
            ciclos.forEach(c => {
                const cadena = c.map(x => path.relative(CORE_DIR, x)).join(' → ');
                console.log('  ' + cadena);
            });
        }

        expect(ciclos).toEqual([]);
    });
});
