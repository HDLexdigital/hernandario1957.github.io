/**
 * test/batchCli.test.js
 * Pruebas de integración exhaustivas para el CLI Batch y contratos C01-OBS / DRY-RUN
 */
const { runBatchCli, parseBatchArgs } = require('../../../src/cli/lexmotorBatchCli.js');
const fs = require('fs');
const path = require('path');

describe('LexMotor Batch CLI Exhaustive Tests', () => {
    const testInputDir = path.join(__dirname, '../../../test/fixtures/cli-batch-input');
    const testOutputDir = path.join(__dirname, '../../../test/fixtures/cli-batch-output');
    const reportBaseDir = path.resolve(process.cwd(), 'reportes');

    beforeEach(() => {
        if (fs.existsSync(testInputDir)) fs.rmSync(testInputDir, { recursive: true, force: true });
        if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
        fs.mkdirSync(testInputDir, { recursive: true });
        fs.mkdirSync(testOutputDir, { recursive: true });
    });

    afterEach(() => {
        // Restaurar estado global y limpiar fixtures de prueba
        process.exitCode = 0;
        if (fs.existsSync(testInputDir)) fs.rmSync(testInputDir, { recursive: true, force: true });
        if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
    });

    test('T01: ParseBatchArgs extrae correctamente los parámetros', () => {
        const args = ['--input', './in', '--output', './out', '--profile', 'WEB', '--dry-run'];
        const parsed = parseBatchArgs(args);
        expect(parsed.input).toBe('./in');
        expect(parsed.output).toBe('./out');
        expect(parsed.profile).toBe('WEB');
        expect(parsed.dryRun).toBe(true);
    });

    test('T02: CLI ejecuta correctamente en modo normal y genera XHTML y C01-OBS', () => {
        fs.writeFileSync(path.join(testInputDir, 'doc1.json'), JSON.stringify({ styleName: 'P01_TITLE_H1', texto: 'Prueba CLI', lang: 'es-CO' }));

        let logs = [];
        let errors = [];
        const mockIo = { log: (m) => logs.push(m), error: (m) => errors.push(m) };

        runBatchCli([
            '--input', testInputDir,
            '--output', testOutputDir,
            '--profile', 'WEB'
        ], mockIo);

        expect(process.exitCode).toBe(0);
        expect(errors.length).toBe(0);
        expect(fs.existsSync(path.join(testOutputDir, 'doc1.xhtml'))).toBe(true);
    });

    test('T03: Contrato DRY-RUN estricto (Calcula métricas y genera C01-OBS pero CERO XHTML)', () => {
        fs.writeFileSync(path.join(testInputDir, 'doc1.json'), JSON.stringify({ styleName: 'P01_TITLE_H1', texto: 'Prueba Dry Run', lang: 'es-CO' }));

        let logs = [];
        let errors = [];
        const mockIo = { log: (m) => logs.push(m), error: (m) => errors.push(m) };

        runBatchCli([
            '--input', testInputDir,
            '--output', testOutputDir,
            '--profile', 'WEB',
            '--dry-run'
        ], mockIo);

        expect(process.exitCode).toBe(0);
        expect(errors.length).toBe(0);
        // Garantizar que NO se escribió ningún XHTML en el directorio de salida
        expect(fs.existsSync(path.join(testOutputDir, 'doc1.xhtml'))).toBe(false);
        const remainingFiles = fs.readdirSync(testOutputDir);
        expect(remainingFiles.length).toBe(0);
    });

    test('T04: CLI rechaza estrictamente un perfil inválido (ERR-003)', () => {
        let errors = [];
        const mockIo = { log: () => {}, error: (m) => errors.push(m) };

        runBatchCli([
            '--input', testInputDir,
            '--output', testOutputDir,
            '--profile', 'PDF_INVALIDO'
        ], mockIo);

        expect(process.exitCode).toBe(1);
        expect(errors.length).toBe(1);
        const errObj = JSON.parse(errors[0]);
        expect(errObj.code).toBe('ERR-003_OUTPUT_PROFILE_INVALID');
    });

    test('T05: CLI captura ERR-004 si el directorio de entrada no existe', () => {
        let errors = [];
        const mockIo = { log: () => {}, error: (m) => errors.push(m) };

        runBatchCli([
            '--input', './directorio-totalmente-fantasma',
            '--output', testOutputDir,
            '--profile', 'WEB'
        ], mockIo);

        expect(process.exitCode).toBe(1);
        expect(errors.length).toBe(1);
        const errObj = JSON.parse(errors[0]);
        expect(errObj.code).toBe('ERR-004_INPUT_DIRECTORY_NOT_FOUND');
    });

    test('T06: Verificación de persistencia inmutable del reporte C01-OBS', () => {
        fs.writeFileSync(path.join(testInputDir, 'doc1.json'), JSON.stringify({ styleName: 'P04_BODY', texto: 'Cuerpo', lang: 'es-CO' }));

        let logs = [];
        const mockIo = { log: (m) => logs.push(m), error: () => {} };

        runBatchCli([
            '--input', testInputDir,
            '--output', testOutputDir,
            '--profile', 'EPUB'
        ], mockIo);

        expect(process.exitCode).toBe(0);
        
        // Buscar que se haya creado un archivo en la carpeta reportes de hoy
        const hoyIso = new Date().toISOString().split('T')[0];
        const carpetaReportesHoy = path.join(reportBaseDir, hoyIso);
        expect(fs.existsSync(carpetaReportesHoy)).toBe(true);

        const archivosReporte = fs.readdirSync(carpetaReportesHoy).filter(f => f.startsWith('batch-report-'));
        expect(archivosReporte.length).toBeGreaterThan(0);

        // Leer el último reporte generado y validar su contenido contractual
        const contenidoReporte = JSON.parse(fs.readFileSync(path.join(carpetaReportesHoy, archivosReporte[archivosReporte.length - 1]), 'utf8'));
        expect(contenidoReporte.profile).toBe('EPUB');
        expect(contenidoReporte.processed).toBe(1);
        expect(contenidoReporte.succeeded).toBe(1);
    });
});
