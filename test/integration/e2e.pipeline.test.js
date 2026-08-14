const { compilarLexmotor } = require('../../src/index');
const procesadorDom = require('../../src/core/postProcesadorDom');

describe('FASE 4A: Integración E2E y Fronteras del Orquestador', () => {

    // Fixture realista usando tipos estrictamente válidos (texto_cuerpo)
    const fixtureJuridico = {
        documento: { titulo: 'Código de Procedimiento Administrativo - Fragmento' },
        contenido: [
            { tipo: 'texto_cuerpo', texto: 'TÍTULO I.' },
            { tipo: 'texto_cuerpo', texto: 'CAPÍTULO I' },
            { tipo: 'texto_cuerpo', texto: 'Artículo 1. Finalidad.' },
            { tipo: 'texto_cuerpo', texto: 'Las normas de esta parte tienen como finalidad proteger los derechos.' },
            { tipo: 'texto_cuerpo', texto: 'Parágrafo 1. Excepciones.' }
        ]
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('1. Flujo Completo (E2E): Clasifica, estructura y valida un documento legal', async () => {
        const resultado = await compilarLexmotor(
            fixtureJuridico,
            'cpaca_test',
            'estilo_juridico.css',
            { debug: false, validarSalida: true }
        );

        // Verificamos que retorna la estructura oficial del pipeline
        expect(resultado).toHaveProperty('jsonOficial');
        expect(resultado).toHaveProperty('xhtml');
        expect(resultado).toHaveProperty('metadatos');

        // Verificamos que las fases interactuaron correctamente
        expect(resultado.xhtml).toContain('<!DOCTYPE html>'); 
        expect(resultado.xhtml).toContain('estilo_juridico.css');
        expect(resultado.xhtml).toContain('Código de Procedimiento Administrativo');

        // Verificamos que el motor GREP re-clasificó los nodos y el constructor aplicó las clases
        expect(resultado.xhtml).toMatch(/class="[^"]*titulo_parte[^"]*".*?TÍTULO I/);
        expect(resultado.xhtml).toMatch(/class="[^"]*capitulo[^"]*".*?CAPÍTULO I/);
        expect(resultado.xhtml).toMatch(/class="[^"]*articulo[^"]*".*?Artículo 1/);
        expect(resultado.xhtml).toMatch(/class="[^"]*texto_cuerpo[^"]*".*?Las normas de esta parte/);
        expect(resultado.xhtml).toMatch(/class="[^"]*paragrafo_normativo[^"]*".*?Parágrafo 1/);
    });

    test('2. Frontera (Bypass): { validarSalida: false } omite la verificación estricta', async () => {
        const resultado = await compilarLexmotor(
            fixtureJuridico,
            'cpaca_bypass',
            'test.css',
            { debug: false, validarSalida: false }
        );

        // Si llega aquí sin lanzar errores, el bypass funcionó
        expect(resultado).toHaveProperty('xhtml');
    });

});