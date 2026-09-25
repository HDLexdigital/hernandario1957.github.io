/**
 * src/cli/lexmotorBatch.js
 * Orquestador Masivo de Lotes (LexMotor Batch) - Auto-creación de input y versión 1.0.0-frozen
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../compiladores/compilarLexmotor.js');
const { OUTPUT_PROFILES, isValidProfile } = require('../config/profiles.js');
const { LexDigitalContractError } = require('../errores/LexDigitalContractError.js');

function ejecutarBatch(inputDir, outputDir, profile, options = { writeFiles: true }) {
    const startTime = Date.now();
    const batchId = new Date().toISOString();

    if (!profile || !isValidProfile(profile)) {
        throw new Error(`[LexMotor Batch] Perfil de salida requerido o inválido: ${profile}. Debe ser WEB o EPUB.`);
    }

    const resolvedInput = path.resolve(process.cwd(), inputDir);
    const resolvedOutput = path.resolve(process.cwd(), outputDir);

    // Auto-creación transparente del directorio de entrada si no existe
    if (!fs.existsSync(resolvedInput)) {
        fs.mkdirSync(resolvedInput, { recursive: true });
    }

    if (options.writeFiles && !fs.existsSync(resolvedOutput)) {
        fs.mkdirSync(resolvedOutput, { recursive: true });
    }

    const files = fs.readdirSync(resolvedInput).filter(f => f.endsWith('.json'));
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errorCounters = {};
    const documentsTrace = [];

    for (const file of files) {
        processed++;
        const filePath = path.join(resolvedInput, file);
        const docStart = Date.now();

        try {
            const rawContent = fs.readFileSync(filePath, 'utf8');
            const nodoInDesign = JSON.parse(rawContent);

            const nodosArray = Array.isArray(nodoInDesign) ? nodoInDesign : [nodoInDesign];
            const resultadosXHTML = nodosArray.map(nodo => compilarLexmotor(nodo, profile));

            if (options.writeFiles) {
                const outputFilename = file.replace('.json', '.xhtml');
                const outputPath = path.join(resolvedOutput, outputFilename);
                fs.writeFileSync(outputPath, resultadosXHTML.join('\n'), 'utf8');
            }

            const docDuration = Date.now() - docStart;
            succeeded++;
            documentsTrace.push({
                file,
                status: 'SUCCESS',
                durationMs: docDuration
            });

        } catch (err) {
            failed++;
            const errorCode = err instanceof LexDigitalContractError ? err.code : (err.code || 'ERR-999_SYSTEM_UNEXPECTED');
            
            errorCounters[errorCode] = (errorCounters[errorCode] || 0) + 1;

            documentsTrace.push({
                file,
                status: 'FAILED',
                errorCode: errorCode,
                message: err.message,
                details: err.details || {}
            });
        }
    }

    const totalDuration = Date.now() - startTime;

    const batchReport = {
        coreVersion: "1.0.0-frozen",
        contractVersion: "1.0.0",
        batchId,
        profile,
        processed,
        succeeded,
        failed,
        errors: errorCounters,
        durationMs: totalDuration,
        documents: documentsTrace
    };

    return batchReport;
}

module.exports = { ejecutarBatch };
