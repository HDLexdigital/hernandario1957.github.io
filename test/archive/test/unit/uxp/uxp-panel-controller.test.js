const { UxpPanelController } = require('../../../src/uxp/UxpPanelController');

describe('G1.2 — Contrato de Orquestación del Panel UXP (UxpPanelController)', () => {
    test('G1.2.1 — Inicializa en estado IDLE con valores base limpios', () => {
        const mockBridge = { ejecutar: jest.fn() };
        const controller = new UxpPanelController({ bridge: mockBridge });

        const estado = controller.obtenerEstado();
        expect(estado.status).toBe('IDLE');
        expect(estado.isCompiling).toBe(false);
        expect(estado.lastResult).toBeNull();
    });

    test('G1.2.2 — Orquesta la compilación exitosamente a través del bridge y actualiza el estado', async () => {
        const mockBridge = { 
            ejecutar: jest.fn().mockResolvedValue({ 
                success: true, 
                exitCode: 0, 
                stdout: 'Compilación OK', 
                stderr: '', 
                outputPath: 'C:/salida' 
            }) 
        };
        const controller = new UxpPanelController({ bridge: mockBridge });

        const payload = {
            input: 'C:/doc.txt',
            semanticMap: 'C:/sem.json',
            css: 'C:/styles.css',
            output: 'C:/salida'
        };

        const resultado = await controller.ejecutarCompilacion(payload);

        expect(mockBridge.ejecutar).toHaveBeenCalledTimes(1);
        expect(mockBridge.ejecutar).toHaveBeenCalledWith(payload);
        expect(resultado.success).toBe(true);
        expect(controller.obtenerEstado().status).toBe('SUCCESS');
        expect(controller.obtenerEstado().isCompiling).toBe(false);
    });

    test('G1.2.3 — Captura y clasifica errores operacionales (códigos 1–5) en la interfaz', async () => {
        const mockBridge = { 
            ejecutar: jest.fn().mockResolvedValue({ 
                success: false, 
                exitCode: 3, 
                stdout: '', 
                stderr: 'Error del adaptador E10', 
                outputPath: null,
                diagnostics: { category: 'ADAPTER_ERROR' }
            }) 
        };
        const controller = new UxpPanelController({ bridge: mockBridge });

        const resultado = await controller.ejecutarCompilacion({ input: 'a', semanticMap: 'b', css: 'c', output: 'd' });

        expect(resultado.success).toBe(false);
        expect(resultado.exitCode).toBe(3);
        expect(controller.obtenerEstado().status).toBe('ERROR');
        expect(controller.obtenerEstado().lastDiagnostics.category).toBe('ADAPTER_ERROR');
    });

    test('G1.2.4 — Valida la estructura mínima requerida del manifest.json de UXP', () => {
        const manifestInvalido = { name: "Incompleto" };
        const validacion = UxpPanelController.validarManifest(manifestInvalido);
        expect(validacion.valid).toBe(false);

        const manifestValido = {
            manifestVersion: 5,
            id: "com.lexmotor.uxp",
            name: "Lexmotor UXP Panel",
            version: "1.0.0",
            main: "index.html",
            host: [{ app: "indesign", minVersion: "20.0" }]
        };
        const validacionOk = UxpPanelController.validarManifest(manifestValido);
        expect(validacionOk.valid).toBe(true);
    });
});