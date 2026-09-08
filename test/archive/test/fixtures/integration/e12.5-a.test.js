'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.5-A — Contrato del PresentationResolver: Sonda de Propiedades', () => {

    test('E12.5-A — Confirmar la existencia y nombre de la propiedad de origen en los nodos del AST', () => {
        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw });
        
        const nodosAST = adaptacion.ast && Array.isArray(adaptacion.ast.contenido) 
            ? adaptacion.ast.contenido 
            : [];

        // Evaluamos un nodo representativo para confirmar la API del resolver
        const nodo = nodosAST.find(n => n.inDesignStyle || n.estiloParrafo);
        
        console.log('\n====================================================================');
        console.log('   E12.5-A — CONFIRMACIÓN DE PROPIEDADES PARA PresentationResolver');
        console.log('====================================================================');
        
        if (nodo) {
            console.log('Nodo encontrado. Propiedades de origen detectadas:');
            console.log('  - estiloParrafo:', nodo.estiloParrafo);
            console.log('  - inDesignStyle:', nodo.inDesignStyle);
        } else {
            console.log('⚠️ Nodo con metadatos de estilo no encontrado en la muestra.');
        }

        console.log('\n====================================================================');

        expect(nodo).toBeDefined();
        // El contrato debe validar que al menos una de estas dos sea la fuente de verdad
        expect(nodo.inDesignStyle || nodo.estiloParrafo).toBeDefined();
    });
});