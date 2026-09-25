/**
 * test/cli.test.js
 * Pruebas unitarias/integración para la Interfaz de Línea de Comandos (CLI)
 */
const { runCli, parseArgs } = require('../../../src/cli/lexmotorCli.js');
const fs = require('fs');
const path = require('path');

describe('LexMotor CLI Tests', () => {

    const testFixturePath = path.join(__dirname, '../../../test/fixtures/indesign-muestra-real.json');

    test('1. ParseArgs extrae correctamente el archivo y el perfil', () => {
        const args = ['documento.json', '--profile', 'WEB'];
        const parsed = parseArgs(args);
        expect(parsed.inputFile).toBe('documento.json');
        expect(parsed.profile).toBe('WEB');
    });

    test('2. CLI ejecuta con éxito el perfil WEB sobre un fixture real', () => {
        let logs = [];
        let errors = [];
        const mockIo = {
            log: (msg) => logs.push(msg),
            error: (msg) => errors.push(msg)
        };

        const originalExitCode = process.exitCode;
        runCli([testFixturePath, '--profile', 'WEB'], mockIo);

        expect(process.exitCode).toBe(0);
        expect(logs.length).toBeGreaterThan(0);
        expect(errors.length).toBe(0);
        expect(logs[0]).toContain('<h1 lang="es-CO">');

        process.exitCode = originalExitCode; // Restaurar
    });

    test('3. CLI falla estrictamente si se provee un perfil inválido (ERR-003)', () => {
        let logs = [];
        let errors = [];
        const mockIo = {
            log: (msg) => logs.push(msg),
            error: (msg) => errors.push(msg)
        };

        const originalExitCode = process.exitCode;
        runCli([testFixturePath, '--profile', 'PDF_INVALIDO'], mockIo);

        expect(process.exitCode).toBe(1);
        expect(errors.length).toBe(1);
        
        const errorObj = JSON.parse(errors[0]);
        expect(errorObj.code).toBe('ERR-003_OUTPUT_PROFILE_INVALID');
        expect(errorObj.contractId).toBe('C01-04');

        process.exitCode = originalExitCode;
    });

    test('4. CLI propaga ERR-001 (Estilo no registrado) manteniendo la estructura contractual', () => {
        // Creamos un fixture temporal con un estilo fantasma
        const tempFixture = path.join(__dirname, '../../../test/fixtures/temp-fantasma.json');
        fs.writeFileSync(tempFixture, JSON.stringify([{ styleName: 'ESTILO_INEXISTENTE', texto: 'Hola' }]));

        let errors = [];
        const mockIo = {
            log: () => {},
            error: (msg) => errors.push(msg)
        };

        const originalExitCode = process.exitCode;
        runCli([tempFixture, '--profile', 'EPUB'], mockIo);

        // Limpiar archivo temporal
        if (fs.existsSync(tempFixture)) fs.unlinkSync(tempFixture);

        expect(process.exitCode).toBe(1);
        expect(errors.length).toBe(1);

        const errorObj = JSON.parse(errors[0]);
        expect(errorObj.code).toBe('ERR-001_STYLE_NOT_REGISTERED');
        expect(errorObj.details.styleName).toBe('ESTILO_INEXISTENTE');

        process.exitCode = originalExitCode;
    });
});
