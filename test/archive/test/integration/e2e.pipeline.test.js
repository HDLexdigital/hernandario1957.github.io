const { compilarLexmotor } = require('../../src/index');

describe('FASE 4A: Integración E2E y Fronteras del Orquestador', () => {
    const fixtureJuridico = {
        documento: {
            titulo: 'Codigo'
        },
        contenido: [
            {
                tipo: 'parrafo',
                tipoNodo: 'paragraph',
                estiloParrafo: 'texto_cuerpo',
                claseLegal: 'titulo_parte',
                texto: 'TITULO I.'
            },
            {
                tipo: 'parrafo',
                tipoNodo: 'paragraph',
                estiloParrafo: 'texto_cuerpo',
                claseLegal: 'capitulo',
                texto: 'CAPITULO I'
            },
            {
                tipo: 'parrafo',
                tipoNodo: 'paragraph',
                estiloParrafo: 'texto_cuerpo',
                claseLegal: 'articulo',
                texto: 'Articulo 1.'
            }
        ]
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('1. Flujo Completo E2E: devuelve el contrato de compilación', async () => {
        const resultado = await compilarLexmotor(fixtureJuridico);

        expect(resultado).toHaveProperty('astEnriquecido');
        expect(resultado).toHaveProperty('xhtml');
        expect(resultado).toHaveProperty('jsonOficial');
        expect(resultado).toHaveProperty('metadatos');
        expect(resultado).toHaveProperty('diagnostico');

        expect(resultado.xhtml).toBeTruthy();
    });
});