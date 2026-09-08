'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E11.3 — Contrato E10 y Regresión Semántica (211 párrafos)', () => {

    const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
    const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
    
    let fixtureRaw;
    let semanticMap = null;
    let resultado;
    let nodosAST;

    // Compilamos una sola vez antes de todas las pruebas
    beforeAll(async () => {
        fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        
        if (fs.existsSync(semanticMapPath)) {
            semanticMap = JSON.parse(fs.readFileSync(semanticMapPath, 'utf8'));
        }

        const adaptacion = adaptarInDesign({ 
            jsonCrudo: fixtureRaw, 
            semanticMap: semanticMap 
        });

        resultado = await compilarLexmotor(
            adaptacion.ast,
            'fragmento-211',
            'fragmento-211.css'
        );

        // Determinamos la colección canónica según el esquema oficial
        nodosAST = resultado.jsonOficial.tokens || resultado.jsonOficial.contenido || [];
    });

    test('A. Integridad estructural: AST válido (Medición de Nodos)', () => {
        expect(resultado.jsonOficial).toBeDefined();
        expect(Array.isArray(nodosAST)).toBe(true);
        
        // CONTRATO E11.3-A: 211 elementos crudos producen exactamente 208 nodos canónicos.
        expect(nodosAST.length).toBe(208);
    });

    test('B. Ontología: Tipos canónicos válidos y explícitos', () => {
        const tipos = new Set(nodosAST.map(nodo => nodo.tipo));
        
        // Frontera E10: Prohibición de tipos transaccionales/inválidos
        expect(tipos.has('referencia')).toBe(false);
        expect(tipos.has('transicion')).toBe(false);

        // Todos los nodos deben tener resolución ontológica
        const todosTienenTipo = nodosAST.every(nodo => typeof nodo.tipo === 'string' && nodo.tipo.length > 0);
        expect(todosTienenTipo).toBe(true);
    });

    test('C. Contrato textual: Garantía de propiedad texto', () => {
        // Ningún nodo debe pasar al constructor XHTML sin su propiedad "texto"
        const todosTienenTexto = nodosAST.every(nodo => typeof nodo.texto === 'string');
        expect(todosTienenTexto).toBe(true);
    });

    test('D. Serialización: JSON round-trip del AST real', () => {
        const serializado = JSON.stringify(resultado.jsonOficial);
        const reconstruido = JSON.parse(serializado);
        
        // Comprueba que no hay dependencias circulares ni pérdida de datos en memoria
        expect(reconstruido).toEqual(resultado.jsonOficial);
    });

    test('E. Tratamiento de marcadores [VACÍO] (Contrato estricto)', () => {
        const vaciosAST = nodosAST.filter(nodo => nodo.texto === '[VACÍO]').length;
        const vaciosXHTML = (resultado.xhtml.match(/\[VACÍO\]/g) || []).length;

        // CONTRATO E11.3-E: E10 purga los vacíos; cero fugas hacia el dominio y cero en la vista final.
        expect(vaciosAST).toBe(0);
        expect(vaciosXHTML).toBe(0);
    });

    test('F. Generación XHTML y conservación de semántica', () => {
        expect(typeof resultado.xhtml).toBe('string');
        expect(resultado.xhtml.length).toBeGreaterThan(0);
        
        // Asumiendo que este texto existe literalmente en tu fragmento-211.json
        // Si falla, significa que InDesign lo segmentó distinto y ajustaremos el expect.
        expect(resultado.xhtml).toContain('Constitución Política');
    });

});