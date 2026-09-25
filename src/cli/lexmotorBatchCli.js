/**
 * src/cli/lexmotorBatchCli.js
 * CLI oficial para LexMotor Batch con manejo robusto de errores de infraestructura
 */
const { ejecutarBatch } = require('./lexmotorBatch.js');
const { persistirReporteBatch } = require('../telemetria/persistenciaBatch.js');
const { OUTPUT_PROFILES, isValidProfile } = require('../config/profiles.js');
const { LexDigitalContractError } = require('../errores/LexDigitalContractError.js');

function parseBatchArgs(args) {
    let input = null;
    let output = null;
    let profile = null;
    let dryRun = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) {
            input = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            output = args[i + 1];
            i++;
        } else if (args[i] === '--profile' && args[i + 1]) {
            profile = args[i + 1];
            i++;
        } else if (args[i] === '--dry-run') {
            dryRun = true;
        }
    }

    return { input, output, profile, dryRun };
}

function runBatchCli(argv = process.argv.slice(2), io = { log: console.log, error: console.error }) {
    const { input, output, profile, dryRun } = parseBatchArgs(argv);

    if (!input || !output || !profile) {
        io.error("Uso incorrecto. Uso esperado: node src/cli/lexmotorBatchCli.js --input <dir> --output <dir> --profile [WEB|EPUB] [--dry-run]");
        process.exitCode = 1;
        return;
    }

    if (!isValidProfile(profile)) {
        const errorPerfil = new LexDigitalContractError({
            code: 'ERR-003_OUTPUT_PROFILE_INVALID',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: `Perfil de salida inválido: '${profile}'. Debe ser WEB o EPUB.`,
            details: { profile }
        });
        io.error(JSON.stringify(errorPerfil.toJSON(), null, 2));
        process.exitCode = 1;
        return;
    }

    try {
        io.log(`[LexMotor Batch] Iniciando ejecución (${profile})... ${dryRun ? '[MODO DRY-RUN: Simulación sin escritura de XHTML]' : ''}`);
        
        const options = { writeFiles: !dryRun };
        const report = ejecutarBatch(input, output, profile, options);

        // Persistencia C01-OBS inmutable
        const rutaReporte = persistirReporteBatch(report);
        
        io.log(`[LexMotor Batch] Lote finalizado. Reporte C01-OBS persistido en: ${rutaReporte}`);
        io.log(JSON.stringify({
            batchId: report.batchId,
            profile: report.profile,
            processed: report.processed,
            succeeded: report.succeeded,
            failed: report.failed,
            errors: report.errors,
            durationMs: report.durationMs
        }, null, 2));

        process.exitCode = report.failed > 0 ? 1 : 0;

    } catch (err) {
        const errorCode = err.code || 'ERR-999_SYSTEM_UNEXPECTED';
        io.error(JSON.stringify({
            code: errorCode,
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: err.message,
            timestamp: new Date().toISOString()
        }, null, 2));
        process.exitCode = 1;
    }
}

if (require.main === module) {
    runBatchCli();
}

module.exports = { parseBatchArgs, runBatchCli };
