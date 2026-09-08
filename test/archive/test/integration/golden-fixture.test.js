const { compilarLexmotor } = require('../../src/index');

describe('FASE 4B: Golden Fixture - Documento Jurídico Real', () => {
    
    // Simulamos la extracción cruda desde InDesign:
// Simulamos la extracción cruda desde InDesign:
    // Ajustado milimétricamente a las expresiones regulares de ReglasGrepJuridicas.txt
    const fixtureConstitucion = {
        documento: {
            titulo: 'Constitución Política de Colombia'
        },
        contenido: [
            { tipo: 'texto_cuerpo', texto: 'TÍTULO I.' }, // <-- Faltaba el punto final para hacer match
            { tipo: 'texto_cuerpo', texto: 'DE LOS PRINCIPIOS FUNDAMENTALES' }, 
            { tipo: 'texto_cuerpo', texto: 'CAPÍTULO I' },
            { tipo: 'texto_cuerpo', texto: 'Artículo 1. Colombia es un Estado social de derecho...' },
            { tipo: 'texto_cuerpo', texto: 'Artículo 2. Son fines esenciales del Estado...' },
            { tipo: 'texto_cuerpo', texto: 'Parágrafo 1. El Gobierno Nacional...' } // <-- Aseguramos dígito
        ]
    };

    test('Procesa el Golden Fixture respetando la Única Fuente de Verdad y la Semántica XHTML', async () => {
        const resultado = await compilarLexmotor(
            fixtureConstitucion,
            'constitucion_test',
            'lexdigital_estilos.css',
            { debug: false, validarSalida: true }
        );

        // 1. Contrato Base (El pipeline sobrevivió y devolvió la estructura de producción)
        expect(resultado).toHaveProperty('jsonOficial');
        expect(resultado).toHaveProperty('xhtml');
        expect(resultado).toHaveProperty('metadatos');

        // 2. Verificación de la Única Fuente de Verdad
        const tokensProcesados = resultado.jsonOficial.tokens;
        expect(tokensProcesados).toHaveLength(6);
        
        tokensProcesados.forEach(token => {
            expect(token).toHaveProperty('texto');
            expect(token.texto).toBeTruthy();
            
            // Aseguramos que la deuda técnica NO resucitó
            expect(token).not.toHaveProperty('texto_completo');
            expect(token).not.toHaveProperty('texto_limpio');
        });

        // 3. Verificación del Motor GREP (Magia de Reclasificación)
        expect(tokensProcesados[0].tipo).toBe('titulo_parte');
        expect(tokensProcesados[1].tipo).toBe('texto_cuerpo'); // Fallback correcto
        expect(tokensProcesados[2].tipo).toBe('capitulo');
        expect(tokensProcesados[3].tipo).toBe('articulo');
        expect(tokensProcesados[4].tipo).toBe('articulo');
        expect(tokensProcesados[5].tipo).toBe('paragrafo_normativo');

        // 4. Verificación del XHTML Final (Semántica y atributos)
        const xhtml = resultado.xhtml;
        expect(xhtml).toContain('<title>Constitución Política de Colombia</title>');
        expect(xhtml).toContain('lexdigital_estilos.css');
        
        // Clases inyectadas por el constructor
        expect(xhtml).toMatch(/class="[^"]*titulo_parte[^"]*"/);
        expect(xhtml).toMatch(/class="[^"]*capitulo[^"]*"/);
        expect(xhtml).toMatch(/class="[^"]*articulo[^"]*".*?Artículo 1\./);
        expect(xhtml).toMatch(/class="[^"]*articulo[^"]*".*?Artículo 2\./);
        expect(xhtml).toMatch(/class="[^"]*paragrafo_normativo[^"]*"/);
        
        // Atributos de accesibilidad EPUB3
        expect(xhtml).toContain('role="heading"');
        expect(xhtml).toContain('role="doc-section"');
    });

});