const { Logger } = require('../../../src/observability/Logger');
const { crearEventoDiagnostico, TIPOS_EVENTO, NIVELES_SEVERIDAD } = require('../../../src/observability/DiagnosticModel');

describe('F13.2 — Logger Periférico', () => {
    test('F13.2.1 — Permite registrar eventos de diagnóstico correctamente', () => {
        const mockTransporte = { escribir: jest.fn() };
        const logger = new Logger({ transporte: mockTransporte });

        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_INFO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Prueba de log"
        });

        logger.registrar(evento);

        expect(mockTransporte.escribir).toHaveBeenCalledTimes(1);
        expect(mockTransporte.escribir).toHaveBeenCalledWith(evento);
    });

    test('F13.2.2 — Filtra eventos por debajo del nivel de severidad configurado', () => {
        const mockTransporte = { escribir: jest.fn() };
        // Configuramos el logger para que solo admita WARNING o superior
        const logger = new Logger({ transporte: mockTransporte, nivelMinimo: NIVELES_SEVERIDAD.WARNING });

        const eventoInfo = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_INFO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Debe ser ignorado"
        });

        const eventoError = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_ERROR,
            nivel: NIVELES_SEVERIDAD.ERROR,
            mensaje: "Debe ser registrado"
        });

        logger.registrar(eventoInfo);
        logger.registrar(eventoError);

        expect(mockTransporte.escribir).toHaveBeenCalledTimes(1);
        expect(mockTransporte.escribir).toHaveBeenCalledWith(eventoError);
    });

    test('F13.2.3 — Tolerancia a fallos: un error en el transporte no propaga excepciones al flujo', () => {
        const transporteRoto = {
            escribir: () => { throw new Error("Fallo crítico en disco o red"); }
        };
        const logger = new Logger({ transporte: transporteRoto });

        const evento = crearEventoDiagnostico({
            tipo: TIPOS_EVENTO.COMPILACION_INFO,
            nivel: NIVELES_SEVERIDAD.INFO,
            mensaje: "Prueba de tolerancia"
        });

        // No debe lanzar la excepción hacia afuera para proteger el pipeline
        expect(() => {
            logger.registrar(evento);
        }).not.toThrow();
    });
});