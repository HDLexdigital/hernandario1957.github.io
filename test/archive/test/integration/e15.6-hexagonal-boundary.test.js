/**
 * @fileoverview test/integration/e15.6-hexagonal-boundary.test.js
 *
 * E15.6-A — Contrato de Frontera Hexagonal
 * Garantiza que el Core transformador (compilarLexmotor) no dependa de infraestructura 
 * de I/O para persistir artefactos, operando como un motor matemáticamente puro.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E15.6-A — Certificación Hexagonal del Core', () => {
    
    test('1. Análisis Estático: El Core no importa infraestructura de rutas (path)', () => {
        const rutaCore = path.resolve(__dirname, '../../src/compiladores/compilarLexmotor.js');
        const codigo = fs.readFileSync(rutaCore, 'utf8');
        
        // Exigimos que 'path' haya sido extirpado, lo que imposibilita la concatenación 
        // de rutas para escritura en directorios temporales (outputFolder).
        expect(codigo).not.toMatch(/require\(['"]path['"]\)/);
        
        // Verificamos que se erradicó el bloque de persistencia
        expect(codigo).not.toMatch(/fs\.writeFileSync/);
    });

    test('2. Pureza de Entrada/Salida: Transformación en memoria sin orquestador', () => {
        // AST Canónico simulado (Totalmente desconectado de InDesign)
        const astFalso = { 
            tipoNodo: 'paragraph', 
            estilo: 'titulo', 
            contenido: [{ tipoNodo: 'character', texto: 'Invariante Hexagonal' }] 
        };
        
        // Ejecutamos el Core sin inyectar outputFolder ni dependencias de I/O
        const resultado = compilarLexmotor(astFalso);
        
        // Aserciones de frontera
        expect(resultado).toBeDefined();
        expect(resultado).toHaveProperty('xhtml');
        expect(resultado.xhtml).toContain('Invariante Hexagonal');
    });
});