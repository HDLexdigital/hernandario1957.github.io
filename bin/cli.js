#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ejecutarCLI } = require('../src/cli/lexmotorCLI');

const args = process.argv.slice(2);
let canonicalArgs = args;

// 0. Intercepción de ayuda
if (args.length === 0 || args.includes('--help')) {
    console.log(`
LexDigital CLI Wrapper (Compatibilidad G3.5)

Uso posicional heredado:
  node bin/cli.js <archivo-json> [nombre-base] [nombre-css]

Uso canónico:
  node bin/cli.js compile --input <json> --semantic-map <mapa> --css <css> --output <dir>

Opciones heredadas soportadas:
  --help          Mostrar esta ayuda
`);
    process.exit(0);
}

// 1. Detección de sintaxis heredada (posicional) vs moderna (banderas)
if (args[0] !== 'compile' && !args[0].startsWith('--')) {
    const inputFile = path.resolve(process.cwd(), args[0]);
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Error (Exit Code 1): Archivo de entrada no encontrado: ${inputFile}`);
        process.exit(1);
    }

    const parsedPath = path.parse(inputFile);
    
    // 2. Separación de conceptos
    const nombreDocumento = parsedPath.name;
    const nombreBase = (args[1] && !args[1].startsWith('--')) ? args[1] : nombreDocumento;
    
// ... (resolución de rutas del mapa y CSS intactas) ...

    // 6. Construir array de argumentos canónicos incluyendo el nombre de salida
    canonicalArgs = [
        'compile',
        '--input', inputFile,
        '--semantic-map', semanticMapPath,
        '--css', cssPath,
        '--output', outputFolder,
        '--name', nombreBase       // <--- Extensión del contrato
    ];
}  
    // 3. Resolución estricta del Mapa Semántico (anclada al documento de entrada)
    const mapName = `${nombreDocumento}.semantic_map.json`;
    const possibleMapPaths = [
        path.join(parsedPath.dir, mapName),               // Junto al JSON original
        path.join(process.cwd(), 'estilos', mapName)      // En la carpeta estilos/
    ];

    let semanticMapPath = null;
    for (const mapPath of possibleMapPaths) {
        if (fs.existsSync(mapPath)) {
            semanticMapPath = mapPath;
            break;
        }
    }

    if (!semanticMapPath) {
        console.error(`Error crítico (Exit Code 2): No se encontró el mapa semántico para '${nombreDocumento}'.`);
        console.error(`Se buscó en:\n  - ${possibleMapPaths.join('\n  - ')}`);
        process.exit(2);
    }

    // 4. Resolución estricta del CSS
    const cssArg = (args.length > 2 && !args[2].startsWith('--')) ? args[2] : 'fragmento.css';
    const possibleCssPaths = [
        path.resolve(process.cwd(), cssArg),              // 4.1 Explicitamente indicado / relativo a CWD
        path.join(parsedPath.dir, cssArg),                // 4.2 Junto al JSON
        path.join(process.cwd(), 'estilos', cssArg)       // 4.3 En la carpeta estilos/
    ];

    let cssPath = null;
    for (const p of possibleCssPaths) {
        if (fs.existsSync(p)) {
            cssPath = p;
            break;
        }
    }

    if (!cssPath) {
        console.error(`Error crítico (Exit Code 2): No se encontró el archivo CSS '${cssArg}'.`);
        console.error(`Se buscó en:\n  - ${possibleCssPaths.join('\n  - ')}`);
        process.exit(2);
    }

    // 5. Definir carpeta de salida
    const outputFolder = path.join(process.cwd(), 'salidaXHTML');

    // 6. Construir array de argumentos canónicos
    canonicalArgs = [
        'compile',
        '--input', inputFile,
        '--semantic-map', semanticMapPath,
        '--css', cssPath,
        '--output', outputFolder
    ];
}

// 7. Ejecutar interfaz canónica protegiendo el borde del proceso
ejecutarCLI(canonicalArgs)
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
        console.error('Error fatal en el orquestador CLI:', error);
        process.exit(5);
    });