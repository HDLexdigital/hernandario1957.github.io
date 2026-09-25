/**
 * test/batch.test.js
 * Pruebas de Integración para el Orquestador por Lotes (LexMotor Batch)
 */
const { ejecutarBatch } = require('../../../src/cli/lexmotorBatch.js');
const fs = require('fs');
const path = require('path');

describe('LexMotor Batch Orchestrator Tests', () => {
    const testInputDir = path.join(__dirname, '../../../test/fixtures/batch-input');
    const testOutputDir = path.join(__dirname, '../../../test/fixtures/batch-output');

    beforeEach(() => {
        // Preparar directorios temporales limpios para pruebas
        if (fs.existsSync(testInputDir)) {
            fs.rmSync(testInputDir, { recursive: true, force: true });
        }
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testInputDir, { recursive: true });
        fs.mkdirSync(testOutputDir, { recursive: true });
    });

    afterEach(() => {
        // Limpieza posterior
        if (fs.existsSync(testInputDir)) fs.rmSync(testInputDir, { recursive: true, force: true });
        if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
    });

    test('1. Ejecución de lote exitoso con métricas agregadas correctas', () => {
        // Crear archivos JSON válidos en el origen
        fs.writeFileSync(path.join(testInputDir, 'doc1.json'), JSON.stringify({ styleName: 'P01_TITLE_H1', texto: 'Título 1', lang: 'es-CO' }));
        fs.writeFileSync(path.join(testInputDir, 'doc2.json'), JSON.stringify({ styleName: 'P04_BODY', texto: 'Párrafo estándar', lang: 'es-CO' }));

        const report = ejecutarBatch(testInputDir, testOutputDir, 'WEB');

        expect(report.processed).toBe(2);
        expect(report.succeeded).toBe(2);
        expect(report.failed).toBe(0);
        expect(report.profile).toBe('WEB');
        expect(report.errors).toEqual({});
        expect(report.documents.length).toBe(2);

        // Validar que se generaron los XHTML en disco
        expect(fs.existsSync(path.join(testOutputDir, 'doc1.xhtml'))).toBe(true);
        expect(fs.existsSync(path.join(testOutputDir, 'doc2.xhtml'))).toBe(true);
    });

    test('2. Manejo de lote mixto (aislamiento de fallos contractuales ERR-001)', () => {
        // Doc válido y Doc inválido (estilo fantasma)
        fs.writeFileSync(path.join(testInputDir, 'valido.json'), JSON.stringify({ styleName: 'P03_ARTICLE', texto: 'Artículo 1' }));
        fs.writeFileSync(path.join(testInputDir, 'roto.json'), JSON.stringify({ styleName: 'ESTILO_inexistente', texto: 'Error' }));

        const report = ejecutarBatch(testInputDir, testOutputDir, 'EPUB');

        expect(report.processed).toBe(2);
        expect(report.succeeded).toBe(1);
        expect(report.failed).toBe(1);
        expect(report.errors['ERR-001_STYLE_NOT_REGISTERED']).toBe(1);

        // El documento válido sí debe haberse compilado y guardado
        expect(fs.existsSync(path.join(testOutputDir, 'valido.xhtml'))).toBe(true);
        // El documento roto no genera archivo XHTML pero queda registrado en la telemetría del lote
        expect(fs.existsSync(path.join(testOutputDir, 'roto.xhtml'))).toBe(false);
    });

    test('3. Fallo estricto si el perfil provisto al batch es inválido', () => {
        expect(() => {
            ejecutarBatch(testInputDir, testOutputDir, 'FORMATO_FANTASMA');
        }).toThrow(/Perfil de salida requerido o inválido/);
    });
});
