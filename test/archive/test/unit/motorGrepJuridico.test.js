const fs = require('fs');
const { evaluarTokenConGrep } = require('../../src/core/motorGrepJuridico');

describe('Motor GREP jurídico', () => {

    describe('Reglas estructurales base', () => {
        test('clasifica TÍTULO I como titulo_parte', () => {
            const resultado = evaluarTokenConGrep('TÍTULO I.');
            expect(resultado).toEqual({
                tipo: 'titulo_parte',
                epubType: 'part',
                nivelHtml: 2,
                coincidioGrep: true
            });
        });

        test('clasifica CAPÍTULO I como capitulo', () => {
            const resultado = evaluarTokenConGrep('CAPÍTULO I');
            expect(resultado).toEqual({
                tipo: 'capitulo',
                epubType: 'chapter',
                nivelHtml: 3,
                coincidioGrep: true
            });
        });

        test('clasifica SECCIÓN I como seccion', () => {
            const resultado = evaluarTokenConGrep('SECCIÓN I');
            expect(resultado).toEqual({
                tipo: 'seccion',
                epubType: 'section',
                nivelHtml: 4,
                coincidioGrep: true
            });
        });

        test('clasifica LIBRO I como libro', () => {
            const resultado = evaluarTokenConGrep('LIBRO I');
            expect(resultado).toEqual({
                tipo: 'libro',
                epubType: 'volume',
                nivelHtml: 1,
                coincidioGrep: true
            });
        });

        test('clasifica GLOSARIO como glosario_titulo', () => {
            const resultado = evaluarTokenConGrep('GLOSARIO');
            expect(resultado).toEqual({
                tipo: 'glosario_titulo',
                epubType: 'backmatter',
                nivelHtml: 2,
                coincidioGrep: true
            });
        });
    });

    describe('Reglas dinámicas', () => {
        test('clasifica Artículo 1. como articulo', () => {
            const resultado = evaluarTokenConGrep('Artículo 1.');
            expect(resultado).toEqual({
                tipo: 'articulo',
                epubType: 'article',
                nivelHtml: 5,
                coincidioGrep: true
            });
        });
    });

    describe('Fallback', () => {
        test('clasifica texto ordinario como texto_cuerpo', () => {
            const resultado = evaluarTokenConGrep('Texto ordinario de prueba');
            expect(resultado).toEqual({
                tipo: 'texto_cuerpo',
                epubType: 'body',
                nivelHtml: 6,
                coincidioGrep: false
            });
        });
    });

    describe('Cobertura exhaustiva del catálogo de tipos (Soporte UTF-8)', () => {
        const casosDePrueba = [
            ['PORTADA', 'preliminar_portada'],
            ['PÁGINA LEGAL', 'preliminar_legal'],
            ['ÍNDICE', 'preliminar_indice'],
            ['PRÓLOGO', 'preliminar_prologo'],
            ['LIBRO I', 'libro'],
            ['TÍTULO I', 'titulo_parte'],
            ['CAPÍTULO I', 'capitulo'],
            ['SECCIÓN I', 'seccion'],
            ['Artículo 1.', 'articulo'],
            ['Parágrafo 1', 'paragrafo_normativo'],
            ['GLOSARIO', 'glosario_titulo'],
            ['Este es un texto ordinario sin clasificación especial.', 'texto_cuerpo']
        ];

        test.each(casosDePrueba)(
            'Clasifica correctamente "%s" como "%s"',
            (texto, tipoEsperado) => {
                const resultado = evaluarTokenConGrep(texto);
                expect(resultado.tipo).toBe(tipoEsperado);
                expect(resultado).toHaveProperty('epubType');
                expect(resultado).toHaveProperty('nivelHtml');
            }
        );
    });

    describe('Carga dinámica de reglas y lectura de archivos (fs)', () => {
        let existsSyncSpy;
        let readFileSyncSpy;
        let consoleWarnSpy;

        beforeEach(() => {
            existsSyncSpy = jest.spyOn(fs, 'existsSync');
            readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('1. Si el archivo no existe, utiliza solo las reglas base', () => {
            existsSyncSpy.mockReturnValue(false);
            const resultado = evaluarTokenConGrep('Artículo 1.');
            expect(resultado.tipo).toBe('articulo');
            expect(existsSyncSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).not.toHaveBeenCalled();
        });

        test('2. Lee y aplica una regla dinámica plana (sin delimitadores)', () => {
            existsSyncSpy.mockReturnValue(true);
            readFileSyncSpy.mockReturnValue('TIPO: regla_custom | PATRON: ^CustomRule$');
            const resultado = evaluarTokenConGrep('CustomRule');
            expect(resultado.tipo).toBe('regla_custom');
            expect(resultado.epubType).toBe('notice');
        });

        test('3. Lee y procesa correctamente el flag /i (Case Insensitive)', () => {
            existsSyncSpy.mockReturnValue(true);
            readFileSyncSpy.mockReturnValue('TIPO: regla_insensible | PATRON: /^Insensible/i');
            const resultado = evaluarTokenConGrep('inSenSiBle');
            expect(resultado.tipo).toBe('regla_insensible');
        });

        test('4. Lee y procesa delimitadores estrictos /.../', () => {
            existsSyncSpy.mockReturnValue(true);
            readFileSyncSpy.mockReturnValue('TIPO: regla_delimitada | PATRON: /^Delimitada$/');
            const resultado = evaluarTokenConGrep('Delimitada');
            expect(resultado.tipo).toBe('regla_delimitada');
        });

        test('5. Ignora líneas vacías y mal formateadas sin romperse', () => {
            existsSyncSpy.mockReturnValue(true);
            readFileSyncSpy.mockReturnValue(`
                TIPO: sin_pipe_patron
                TIPO: a | PATRON: b | EXTRA: c
                TIPO: regla_valida | PATRON: ^Valida$
            `);
            const resultadoInvalido = evaluarTokenConGrep('sin_pipe_patron');
            expect(resultadoInvalido.tipo).toBe('texto_cuerpo');
            const resultadoValido = evaluarTokenConGrep('Valida');
            expect(resultadoValido.tipo).toBe('regla_valida');
        });

        test('6. Captura y registra errores de lectura (permisos/bloqueos) mediante catch', () => {
            existsSyncSpy.mockReturnValue(true);
            readFileSyncSpy.mockImplementation(() => {
                throw new Error('Permiso denegado al leer el .txt');
            });
            const resultado = evaluarTokenConGrep('Artículo 1.');
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Advertencia al leer reglas dinámicas:'),
                'Permiso denegado al leer el .txt'
            );
            expect(resultado.tipo).toBe('articulo');
        });
    });

});