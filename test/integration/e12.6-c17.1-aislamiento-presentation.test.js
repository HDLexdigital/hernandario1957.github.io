'use strict';

const path = require('path');

describe('E12.6-C.17.1 — Aislamiento y Diagnóstico del PresentationResolver', () => {

    test('Verifica el comportamiento aislado de la clase y el mapa de presentación', () => {
        let PresentationResolverModule;
        try {
            PresentationResolverModule = require('../../src/resolucion/PresentationResolver');
        } catch (err) {
            try {
                PresentationResolverModule = require('../../src/constructores/PresentationResolver');
            } catch (innerErr) {
                PresentationResolverModule = null;
            }
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.1 — PRUEBA DE AISLAMIENTO PRESENTATION RESOLVER');
        console.log('====================================================================');
        
        if (!PresentationResolverModule) {
            throw new Error("Fallo forense: No se pudo cargar el módulo PresentationResolver.");
        }

        console.log('   Exportaciones del módulo:', Object.keys(PresentationResolverModule));

        const PresentationResolverClass = PresentationResolverModule.PresentationResolver || PresentationResolverModule;
        const PRESENTATION_MAP = PresentationResolverModule.PRESENTATION_MAP;

        console.log('   ¿PRESENTATION_MAP está definido?:', !!PRESENTATION_MAP);
        if (PRESENTATION_MAP) {
            console.log('   PRESENTATION_MAP["P01_BODY_CONT"]:', PRESENTATION_MAP['P01_BODY_CONT']);
        }

        let resolver;
        try {
            resolver = typeof PresentationResolverClass === 'function' ? new PresentationResolverClass() : PresentationResolverClass;
        } catch (e) {
            resolver = PresentationResolverClass;
        }

        console.log('   typeof resolver.resolve:', typeof resolver.resolve);
        console.log('   resolver.resolveOwnProperty:', Object.prototype.hasOwnProperty.call(resolver, 'resolve'));

        const nodoPrueba = {
            tipo: 'parrafo',
            tipoNodo: 'paragraph',
            estiloParrafo: 'P01_BODY_CONT',
            inDesignStyle: 'P01_BODY_CONT'
        };

        const resultado = typeof resolver.resolve === 'function' 
            ? resolver.resolve(nodoPrueba) 
            : 'METODO_RESOLVE_NO_DISPONIBLE';

        console.log('   Nodo de prueba:', nodoPrueba);
        console.log('   Resultado de resolver.resolve(nodoPrueba):', resultado);
        console.log('====================================================================\n');

        expect(resultado).toBe('cuerpo-siguiente');
    });

});