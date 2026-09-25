/**
 * test/compilarLexmotor.test.js
 * Pruebas de Integración (TDD) para la Capa Anticorrupción (ACL)
 */
const { compilarLexmotor } = require('../../../src/compiladores/compilarLexmotor.js');
const { LexDigitalContractError } = require('../../../src/errores/LexDigitalContractError.js');

describe('Capa Anticorrupción (ACL) - compilarLexmotor', () => {

    test('1. ERR-001: Falla estrictamente si el estilo no existe en el contrato', () => {
        const nodoInDesign = { styleName: 'ESTILO_FANTASMA', texto: 'Algo' };
        
        try {
            compilarLexmotor(nodoInDesign, 'WEB');
            expect(true).toBe(false); 
        } catch (error) {
            expect(error).toBeInstanceOf(LexDigitalContractError);
            expect(error.code).toBe('ERR-001_STYLE_NOT_REGISTERED');
            expect(error.details.styleName).toBe('ESTILO_FANTASMA');
        }
    });

    test('2. ERR-002: Falla estrictamente si el token viola Zod (ej. idioma BCP 47 inválido)', () => {
        // Usamos 'es_CO' (con guion bajo) que viola estructuralmente el estándar BCP 47
        const nodoInDesign = { styleName: 'P01_TITLE_H1', texto: 'Constitución', lang: 'es_CO' };
        
        try {
            compilarLexmotor(nodoInDesign, 'WEB');
            expect(true).toBe(false); // Si no falla, disparamos JestAssertionError
        } catch (error) {
            // El error atrapado no es el de Jest, sino el nuestro
            expect(error).toBeInstanceOf(LexDigitalContractError);
            expect(error.code).toBe('ERR-002_TOKEN_CONTRACT_INVALID');
        }
    });

    test('3. ERR-003: Falla estrictamente si el perfil de salida es inválido', () => {
        const nodoInDesign = { styleName: 'P02_CHAPTER', texto: 'Capítulo 1' };
        
        try {
            compilarLexmotor(nodoInDesign, 'PDF_INVENTADO');
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeInstanceOf(LexDigitalContractError);
            expect(error.code).toBe('ERR-003_OUTPUT_PROFILE_INVALID');
        }
    });

    test('4. Proyección Exitosa (Perfil WEB): Genera XHTML determinista sin epub:type', () => {
        const nodoInDesign = { styleName: 'P03_ARTICLE', texto: 'Artículo 1.' };
        const resultado = compilarLexmotor(nodoInDesign, 'WEB');
        // El Contrato C01-04 dicta que P03_ARTICLE es una <section> sin ARIA ni epub:type en WEB
        expect(resultado).toBe('<section>Artículo 1.</section>');
    });

    test('5. Proyección Exitosa (Perfil EPUB): Genera XHTML con epub:type="division"', () => {
        const nodoInDesign = { styleName: 'P03_ARTICLE', texto: 'Artículo 1.' };
        const resultado = compilarLexmotor(nodoInDesign, 'EPUB');
        // En EPUB sí proyecta el epub:type="division"
        expect(resultado).toBe('<section epub:type="division">Artículo 1.</section>');
    });
});
