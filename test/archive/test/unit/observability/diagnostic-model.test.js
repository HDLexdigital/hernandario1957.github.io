const { crearEventoDiagnostico, TIPOS_EVENTO, NIVELES_SEVERIDAD } = require('../../../src/observability/DiagnosticModel');

describe('F13.1 — Modelo de Diagnóstico y Eventos', () => {
    test('F13.1.1 — Crea un evento de diagnóstico básico con estructura canónica', () => {
        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_INFO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Iniciando procesamiento de documento."
        });

        expect(evento).toHaveProperty('id');
        expect(evento).toHaveProperty('timestamp');
        expect(evento.tipo).toBe(TIPOS_EVENTO.COMPILACION_INFO);
        expect(evento.nivel).toBe(NIVELES_SEVERIDAD.INFO);
        expect(evento.mensaje).toBe("Iniciando procesamiento de documento.");
    });

    test('F13.1.2 — Admite metadatos contextuales opcionales sin alterar la estructura base', () => {
        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.PERFIL_CARGADO,
            nivel: NIVELES_SEVERIDAD.DEBUG,
            mensaje: "Perfil editorial aplicado.",
            metadatos: { perfil: "editorial-standard.json" }
        });

        expect(evento.metadatos).toEqual({ perfil: "editorial-standard.json" });
    });

    test('F13.1.3 — Rechaza la creación de eventos con tipos o severidades no soportados', () => {
        expect(() => {
            crearEventoDiagnostico({
                tipo: "TIPO_INEXISTENTE",
                nivel: NIVELES_SEVERIDAD.INFO,
                mensaje: "Error de prueba"
            });
        }).toThrow();
    });

    test('F13.1.4 — Inmutabilidad: El objeto de evento retornado es congelado o independiente', () => {
        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_INFO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Prueba inmutabilidad"
        });

        expect(Object.isFrozen(evento)).toBe(true);
    });
});