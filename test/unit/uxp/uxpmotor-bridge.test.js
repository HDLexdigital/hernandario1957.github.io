const { UxpmotorBridge } = require('../../../src/uxp/UxpmotorBridge');

describe('G1.1 — Contrato del Wrapper UXP (UxpmotorBridge)', () => {
    test('G1.1.1 — Construye la solicitud y los argumentos CLI básicos correctamente', () => {
        const mockTransport = { ejecutar: jest.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }) };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const payload = {
            input: 'C:/proyecto/documento.txt',
            semanticMap: 'C:/proyecto/semantic_map.json',
            css: 'C:/proyecto/styles.css',
            output: 'C:/proyecto/salida'
        };

        const args = bridge.construirArgumentos(payload);
        expect(args).toContain('--input');
        expect(args).toContain('C:/proyecto/documento.txt');
        expect(args).toContain('--output');
        expect(args).not.toContain('--profile');
    });

    test('G1.1.2 — Incluye --profile cuando el parámetro existe en la solicitud', () => {
        const mockTransport = { ejecutar: jest.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }) };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const payload = {
            input: 'C:/proyecto/documento.txt',
            semanticMap: 'C:/proyecto/semantic_map.json',
            css: 'C:/proyecto/styles.css',
            output: 'C:/proyecto/salida',
            profile: 'C:/proyecto/profiles/constitucion.json'
        };

        const args = bridge.construirArgumentos(payload);
        expect(args).toContain('--profile');
        expect(args).toContain('C:/proyecto/profiles/constitucion.json');
    });

    test('G1.1.3 — Omite --profile cuando no viene definido en la solicitud', () => {
        const mockTransport = { ejecutar: jest.fn() };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const args = bridge.construirArgumentos({
            input: 'a', semanticMap: 'b', css: 'c', output: 'd'
        });
        expect(args.includes('--profile')).toBe(false);
    });

    test('G1.1.4 — Nunca genera argumentos duplicados ante llamadas repetidas', () => {
        const mockTransport = { ejecutar: jest.fn() };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const payload = {
            input: 'a', semanticMap: 'b', css: 'c', output: 'd', profile: 'p.json'
        };

        const args1 = bridge.construirArgumentos(payload);
        const args2 = bridge.construirArgumentos(payload); // <-- Aquí estaba duplicado como const args1

        expect(args1).toEqual(args2);
        expect(args1.filter(arg => arg === '--profile').length).toBe(1);
    });

    test('G1.1.5 — Propaga exitCode (0 a 5) y normaliza el resultado sin modificarlos', async () => {
        const mockTransport = { 
            ejecutar: jest.fn().mockResolvedValue({ exitCode: 3, stdout: 'out', stderr: 'err' }) 
        };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const resultado = await bridge.ejecutar({
            input: 'a', semanticMap: 'b', css: 'c', output: 'd'
        });

        expect(resultado.success).toBe(false);
        expect(resultado.exitCode).toBe(3);
        expect(resultado.stdout).toBe('out');
        expect(resultado.stderr).toBe('err');
    });

    test('G1.1.9 — Un fallo inesperado del transporte se convierte en error controlado', async () => {
        const mockTransport = { 
            ejecutar: jest.fn().mockRejectedValue(new Error("Fallo crítico de red o proceso")) 
        };
        const bridge = new UxpmotorBridge({ transport: mockTransport });

        const resultado = await bridge.ejecutar({
            input: 'a', semanticMap: 'b', css: 'c', output: 'd'
        });

        expect(resultado.success).toBe(false);
        expect(resultado.exitCode).toBe(1); // Error operacional general
        expect(resultado.stderr).toContain("Fallo crítico de red o proceso");
    });
});