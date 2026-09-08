const { compilarLexmotor, validarCompatibilidad } = require('../../src/index');

describe('Orquestador Principal: src/index.js', () => {

    describe('FASE 3.2: Camino Feliz (Happy Path)', () => {
        test('Ejecuta el pipeline completo y retorna la estructura final', async () => {
            const jsonCrudo = {
                documento: { titulo: 'Constitución de Prueba' },
                contenido: [
                    { tipo: 'articulo', texto: 'Artículo 1. Pruebas' }
                ]
            };

            const resultado = await compilarLexmotor(
                jsonCrudo,
                'lexdigital_test',
                'custom.css',
                { debug: false }
            );

            // Validamos los contratos de salida
            expect(resultado).toHaveProperty('jsonOficial');
            expect(resultado).toHaveProperty('xhtml');
            expect(resultado).toHaveProperty('metadatos');

            // Validamos que el HTML se ensambló correctamente con los datos
            expect(resultado.xhtml).toContain('Constitución de Prueba'); // De validarDocumento -> constructor
            expect(resultado.xhtml).toContain('custom.css');             // Del nombreCSS
            expect(resultado.xhtml).toContain('Artículo 1. Pruebas');    // Del validador -> motor -> constructor
        });
    });

    describe('FASE 3.3: Contratos de Argumentos', () => {
        test('Rechaza jsonCrudo nulo o indefinido desde la inicialización', async () => {
            await expect(compilarLexmotor(null, 'test', 'test.css'))
                .rejects.toThrow(/jsonCrudo debe ser un objeto/i);
                
            await expect(compilarLexmotor(undefined, 'test', 'test.css'))
                .rejects.toThrow(/jsonCrudo debe ser un objeto/i);
        });

        test('Rechaza jsonCrudo si es un array en lugar de un objeto', async () => {
            await expect(compilarLexmotor([], 'test', 'test.css'))
                .rejects.toThrow(/jsonCrudo debe ser un objeto/i);
        });
    });

    describe('FASE 3.6: Pruebas de validarCompatibilidad()', () => {
        test('Retorna un diagnóstico válido (esValido: true) para un JSON correcto', () => {
            const jsonCrudo = {
                documento: { titulo: 'Valido' },
                contenido: [{ tipo: 'parrafo', texto: 'Texto ok' }]
            };
            
            const resultado = validarCompatibilidad(jsonCrudo);
            
            expect(resultado.esValido).toBe(true);
            expect(resultado.errores).toHaveLength(0);
            expect(resultado).toHaveProperty('estadisticas');
        });

        test('Atrapa errores internamente y retorna esValido: false sin lanzar excepción', () => {
            // Estructura ilegal (falta documento y el contenido no es un array)
            const jsonInvalido = {
                contenido: "Esto no es un array"
            };
            
            // Si la función lanzara throw, esta línea fallaría el test
            const resultado = validarCompatibilidad(jsonInvalido);
            
            expect(resultado.esValido).toBe(false);
            expect(resultado.errores.length).toBeGreaterThan(0);
            
            // Verificamos que el error atrapado sea descriptivo
            const mensajeErrores = resultado.errores.join(' ');
			expect(mensajeErrores).toMatch(/Campo "documento" faltante/i);        });
    });
describe('FASE 3.4 y 3.5: Manejo de Excepciones Severas (catch blocks)', () => {
        
        // Creamos una función que genera un objeto que "explota" al ser leído
        const crearJsonVenenoso = () => {
            const obj = {};
            Object.defineProperty(obj, 'documento', {
                get: () => { throw new Error('Fallo catastrófico simulado'); }
            });
            return obj;
        };

        test('validarCompatibilidad atrapa excepciones no controladas (línea 782+)', () => {
            const jsonVenenoso = crearJsonVenenoso();
            
            // Esto provocará un throw en la línea: if (!jsonCrudo.documento...)
            const resultado = validarCompatibilidad(jsonVenenoso);
            
            expect(resultado.esValido).toBe(false);
            // Verificamos que el catch() capturó el error y lo metió al array
            expect(resultado.errores.some(e => e.includes('Fallo catastrófico simulado'))).toBe(true);
        });

        test('compilarLexmotor atrapa errores genéricos y los relanza adecuadamente', async () => {
            const jsonVenenoso = crearJsonVenenoso();
            
            // Esto provocará un throw dentro de compilarLexmotor
            // Forzando al pipeline a ejecutar su bloque catch principal
            await expect(compilarLexmotor(jsonVenenoso, 'test', 'test.css', { debug: false }))
                .rejects.toThrow(/Fallo catastrófico simulado/);
        });
    });
});