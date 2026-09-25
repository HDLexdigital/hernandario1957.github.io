/**
 * src/cli/lexmotorCli.js
 * Interfaz de Línea de Comandos (CLI) para LexMotor
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../compiladores/compilarLexmotor.js');
const { OUTPUT_PROFILES, isValidProfile } = require('../config/profiles.js');
const { LexDigitalContractError } = require('../errores/LexDigitalContractError.js');

function parseArgs(args) {
    let inputFile = null;
    let profile = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--profile' && args[i + 1]) {
            profile = args[i + 1];
            i++;
        } else if (!inputFile && !args[i].startsWith('--')) {
            inputFile = args[i];
        }
    }

    return { inputFile, profile };
}

function runCli(argv = process.argv.slice(2), io = { log: console.log, error: console.error }) {
    const { inputFile, profile } = parseArgs(argv);

    // 1. Validación de argumentos básicos del CLI
    if (!inputFile || !profile) {
        io.error("Uso incorrecto. Uso esperado: lexmotor <archivo.json> --profile [WEB|EPUB]");
        process.exitCode = 1;
        return;
    }

    // 2. Validación explícita del perfil (C01-05 ERR-003)
    if (!isValidProfile(profile)) {
        const errorPerfil = new LexDigitalContractError({
            code: 'ERR-003_OUTPUT_PROFILE_INVALID',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: `Perfil de salida inválido: '${profile}'. Debe ser WEB o EPUB.`,
            details: { perfil: profile } // Corregido de shorthand a propiedad explícita
        });
        io.error(JSON.stringify(errorPerfil.toJSON(), null, 2));
        process.exitCode = 1;
        return;
    }

    try {
        // 3. Lectura de entrada
        const resolvedPath = path.resolve(process.cwd(), inputFile);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Archivo de entrada no encontrado en disco: ${resolvedPath}`);
        }

        const rawData = fs.readFileSync(resolvedPath, 'utf8');
        const nodosInDesign = JSON.parse(rawData);

        // 4. Invocación al orquestador (ACL)
        const nodosArray = Array.isArray(nodosInDesign) ? nodosInDesign : [nodosInDesign];
        const resultados = nodosArray.map(nodo => compilarLexmotor(nodo, profile));

        // 5. Salida estándar de resultados
        resultados.forEach(res => io.log(res));
        process.exitCode = 0;

    } catch (err) {
        // 6. Propagación íntegra de errores contractuales (C01-05)
        if (err instanceof LexDigitalContractError) {
            io.error(JSON.stringify(err.toJSON(), null, 2));
        } else {
            io.error(JSON.stringify({
                name: err.name,
                code: 'ERR-999_SYSTEM_UNEXPECTED',
                contractId: 'C01-04',
                contractVersion: '1.0.0',
                message: err.message,
                timestamp: new Date().toISOString()
            }, null, 2));
        }
        process.exitCode = 1;
    }
}

module.exports = { parseArgs, runCli };
