/**
 * @fileoverview test/integration/pipeline.contract-resolver.test.js
 * Validación de contratos y robustez de entrada para el motor LexDigital.
 */

const assert = require('assert');

const {
    compilarLexmotor,
    validarCompatibilidad
} = require('../../src/index');

const parametrosTest = [
    'test',
    'styles.css',
    { debug: false }
];


/*
 * ============================================================
 * PIPE-CONTRACT-001
 * Motor LexDigital
 * ============================================================
 */

describe('PIPE-CONTRACT-001 Motor LexDigital', () => {

    test(
        'Vector A: rechaza jsonCrudo cuando no es objeto',
        async () => {

            await expect(
                compilarLexmotor(
                    null,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /jsonCrudo debe ser un objeto/i
                );
        }
    );


    test(
        'Vector B: valida compatibilidad estructural del documento',
        () => {

            const documentoValido = {

                metadata: {
                    version: '1.0',
                    nombreBase: 'test'
                },

                documento: {
                    titulo: 'Test'
                },

                contenido: [
                    {
                        tipo: 'articulo',
                        texto: 'Artículo 1. Objeto de prueba.'
                    }
                ]
            };

            const resultado =
                validarCompatibilidad(
                    documentoValido
                );

            assert.strictEqual(
                typeof resultado.esValido,
                'boolean'
            );
        }
    );


    test(
        'Vector C: compila exitosamente con entrada válida',
        async () => {

            const jsonValido = {

                documento: {
                    titulo: 'Test'
                },

                contenido: [
                    {
                        tipo: 'articulo',
                        texto: 'Artículo 1. Prueba de compilación.'
                    }
                ]
            };

            const resultado =
                await compilarLexmotor(
                    jsonValido,
                    ...parametrosTest
                );

            expect(resultado).toBeTruthy();

            expect(
                typeof resultado.xhtml
            ).toBe('string');
        }
    );

});


/*
 * ============================================================
 * PIPE-CONTRACT-002
 * Identidad documental
 * ============================================================
 */

describe('PIPE-CONTRACT-002', () => {

    test(
        'PIPE-CONTRACT-002-A rechaza documentos sin propiedad documento',
        async () => {

            const jsonCrudo = {};

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /falta propiedad requerida "documento"/i
                );
        }
    );


    test(
        'PIPE-CONTRACT-002-B rechaza documento con tipo inválido',
        async () => {

            const jsonCrudo = {
                documento: 'texto inválido'
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /"documento" debe ser un objeto válido/i
                );
        }
    );


    test(
        'PIPE-CONTRACT-002-C rechaza documento sin título',
        async () => {

            const jsonCrudo = {
                documento: {}
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /falta propiedad requerida "titulo" en el documento/i
                );
        }
    );


    test(
        'PIPE-CONTRACT-002-D1 rechaza documento con título de cadena vacía',
        async () => {

            const jsonCrudo = {
                documento: {
                    titulo: ''
                }
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /título del documento no puede estar vacío/i
                );
        }
    );


    test(
        'PIPE-CONTRACT-002-D2 rechaza documento con título de solo espacios',
        async () => {

            const jsonCrudo = {
                documento: {
                    titulo: '   '
                }
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /título del documento no puede estar vacío/i
                );
        }
    );

});

/*
 * ============================================================
 * PIPE-CONTRACT-003-A
 * Existencia y tipo de la colección "contenido"
 * ============================================================
 */

describe(
    'PIPE-CONTRACT-003-A: Existencia y tipo de la colección',
    () => {

        test(
            '003-A1: rechaza compilación si falta la colección "contenido"',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    }
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /falta colección requerida "contenido"/i
                    );
            }
        );

        test(
            '003-A2: rechaza compilación si "contenido" no es un arreglo',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    },

                    contenido: {
                        tipo: 'articulo',
                        texto: 'Invalido porque es objeto, no array'
                    }
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /"contenido" debe ser un arreglo/i
                    );
            }
        );

    }
);


/*
 * ============================================================
 * PIPE-CONTRACT-003-B
 * Integridad de los nodos
 * ============================================================
 */

describe(
    'PIPE-CONTRACT-003-B: Integridad de los nodos',
    () => {

        test(
            '003-B1: rechaza elementos primitivos dentro de "contenido"',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    },

                    contenido: [
                        'Artículo 1. Texto inválido.'
                    ]
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /cada elemento de "contenido" debe ser un objeto/i
                    );
            }
        );

        test(
            '003-B2: rechaza números dentro de "contenido"',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    },

                    contenido: [
                        123
                    ]
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /cada elemento de "contenido" debe ser un objeto/i
                    );
            }
        );

    }
);

/*
 * ============================================================
 * PIPE-CONTRACT-003-C
 * Identidad y cuerpo del nodo normativo
 * ============================================================
 */

describe(
    'PIPE-CONTRACT-003-C: Identidad y cuerpo del nodo normativo',
    () => {

        test(
            '003-C1: rechaza nodos que no declaren la propiedad "tipo"',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    },
                    contenido: [
                        {
                            texto: 'Artículo 1. Falta el tipo.'
                        }
                    ]
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /cada elemento de "contenido" debe incluir la propiedad "tipo"/i
                    );
            }
        );

        test(
            '003-C2: rechaza nodos que no declaren contenido textual',
            async () => {
                const jsonCrudo = {
                    documento: {
                        titulo: 'Test'
                    },
                    contenido: [
                        {
                            tipo: 'articulo'
                        }
                    ]
                };

                await expect(
                    compilarLexmotor(
                        jsonCrudo,
                        ...parametrosTest
                    )
                )
                    .rejects
                    .toThrow(
                        /cada elemento de "contenido" debe incluir la propiedad "texto"/i
                    );
            }
        );

    }
);


/*
 * ============================================================
 * PIPE-CONTRACT-003-D
 * Tipos de identidad y cuerpo del nodo
 * ============================================================
 */
describe('PIPE-CONTRACT-003-D: Tipos de identidad y cuerpo del nodo', () => {

    test(
        '003-D1: rechaza nodos donde "tipo" no es un string',
        async () => {
            const jsonCrudo = {
                documento: { titulo: 'Test' },
                contenido: [
                    { tipo: 123, texto: 'Texto válido' }
                ]
            };

            await expect(
                compilarLexmotor(jsonCrudo, ...parametrosTest)
            ).rejects.toThrow(
                /la propiedad "tipo" de cada elemento de "contenido" debe ser un string/i
            );
        }
    );

    test(
        '003-D2: rechaza nodos donde "texto" no es un string',
        async () => {
            const jsonCrudo = {
                documento: { titulo: 'Test' },
                contenido: [
                    { tipo: 'articulo', texto: 123 }
                ]
            };

            await expect(
                compilarLexmotor(jsonCrudo, ...parametrosTest)
            ).rejects.toThrow(
                /la propiedad "texto" de cada elemento de "contenido" debe ser un string/i
            );
        }
    );

});


describe('PIPE-CONTRACT-003-E: Dominio semántico de tipo', () => {

    test(
        '003-E1: rechaza "tipo" como cadena vacía',
        async () => {
            const jsonCrudo = {
                documento: { titulo: 'Test' },
                contenido: [
                    { tipo: '', texto: 'Texto válido' }
                ]
            };

            await expect(
                compilarLexmotor(jsonCrudo, ...parametrosTest)
            ).rejects.toThrow(
                /la propiedad "tipo".*no puede estar vacía/i
            );
        }
    );

    test(
        '003-E2: rechaza nodos cuyo "tipo" no pertenece al vocabulario controlado',
        async () => {
            const jsonCrudo = {
                documento: { titulo: 'Test' },
                contenido: [
                    {
                        tipo: 'tipo_inventado',
                        texto: 'Texto válido'
                    }
                ]
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            ).rejects.toThrow(
                /tipo no reconocido o inválido: "tipo_inventado"/i
            );
        }
    );

});   // <-- FALTABA ESTE CIERRE DE 003-E

/**
 * ============================================================
 * PIPE-CONTRACT-003-F
 * Semántica del contenido textual
 * ============================================================
 */
describe('PIPE-CONTRACT-003-F: Semántica del contenido textual', () => {

    test(
        '003-F1: rechaza nodos con "texto" vacío',
        async () => {

            const jsonCrudo = {
                documento: {
                    titulo: 'Test'
                },
                contenido: [
                    {
                        tipo: 'articulo',
                        texto: ''
                    }
                ]
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /la propiedad "texto" de cada elemento de "contenido" no puede estar vacía/i
                );
        }
    );

    test(
        '003-F2: rechaza nodos con "texto" compuesto solo por espacios',
        async () => {

            const jsonCrudo = {
                documento: {
                    titulo: 'Test'
                },
                contenido: [
                    {
                        tipo: 'articulo',
                        texto: '   '
                    }
                ]
            };

            await expect(
                compilarLexmotor(
                    jsonCrudo,
                    ...parametrosTest
                )
            )
                .rejects
                .toThrow(
                    /la propiedad "texto" de cada elemento de "contenido" no puede estar vacía/i
                );
        }
    );

});