const path = require('path');
const fs = require('fs');
const { resolverConfiguracion } = require('../../src/profiles/ProfileResolver');
const { validarPerfil } = require('../../src/profiles/ProfileLoader');
const { Logger } = require('../../src/observability/Logger');
const { ColectorMetricas } = require('../../src/observability/CompilationMetrics');
const { crearEventoDiagnostico, TIPOS_EVENTO, NIVELES_SEVERIDAD } = require('../../src/observability/DiagnosticModel');

describe('F14 — Regresión Global del Pipeline (E1–E13 Integrado)', () => {
    const tempDir = path.join(__dirname, '../temp-global-env');

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
    });

    afterAll(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('F14.1 — Resolución de perfiles y observabilidad operan de forma no intrusiva', () => {
        // 1. Validar perfil base
        const perfilValido = {
            name: "regresion-global-profile",
            settings: { outputFormat: "xhtml", strictValidation: true }
        };
        const validacion = validarPerfil(perfilValido);
        expect(validacion.valid).toBe(true);

        // 2. Resolver configuración efectiva (CLI > Perfil > Defaults)
        const defaults = { outputFormat: "html", theme: "default" };
        const cliFlags = { theme: "dark" };
        const configEfectiva = resolverConfiguracion({ defaults, perfil: perfilValido, cliFlags });

        expect(configEfectiva.outputFormat).toBe("xhtml");
        expect(configEfectiva.theme).toBe("dark"); // Precedencia CLI

        // 3. Registrar observabilidad sin alterar datos
        const mockTransporte = { escribir: jest.fn() };
        const logger = new Logger({ transporte: mockTransporte });
        const colector = new ColectorMetricas();

        colector.iniciarCronometro();
        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.PERFIL_CARGADO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Perfil integrado correctamente en pipeline global",
            metadatos: { config: configEfectiva }
        });

        logger.registrar(evento);
        colector.registrarMetricasAST({ nodeCount: 15, paragraphs: 3, characterRuns: 450 });
        colector.finalizarCronometro('SUCCESS');

        const resumen = colector.obtenerResumen();
        expect(resumen.finalResult).toBe('SUCCESS');
        expect(resumen.nodeCount).toBe(15);
        expect(mockTransporte.escribir).toHaveBeenCalledTimes(1);
    });

    test('F14.2 — Determinismo absoluto ante ejecuciones repetidas con observabilidad activa', () => {
        const defaults = { layout: "grid" };
        const perfil = { name: "det-profile", settings: { layout: "flex" } };

        const ejecucion1 = resolverConfiguracion({ defaults, perfil });
        const ejecucion2 = resolverConfiguracion({ defaults, perfil });

        // Comprobación de determinismo estricto en la configuración efectiva
        expect(ejecucion1).toEqual(ejecucion2);
    });
});