'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('E12.6-C — Contrato Final de Frecuencias y Orquestación (Fragmento-211)', () => {

    let resultadoXHTML = '';
    let documentosNodos = [];
    
    let semantica = { texto_cuerpo: 0, articulo: 0, paragrafo_normativo: 0, titulo_parte: 0 };
    let presentacion = { 'cuerpo-siguiente': 0, 'sangria-n1': 0, 'p02-title-main': 0, 'titulo': 0, 'titulo_parte': 0, 'texto-centrado-bold': 0 };
    let nodosValidos = 0;
    let matrizGeneral = {}; // Para diagnóstico visual

    test('C1: Inspección estructural del orquestador principal', () => {
        const rutaCompilador = path.resolve(__dirname, '../../../src/compiladores/compilarLexmotor.js');
        const codigoCompilador = fs.readFileSync(rutaCompilador, 'utf8');
        expect(codigoCompilador.length).toBeGreaterThan(0);
    });

    test('C2: Compilación real a través del pipeline productivo', async () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        
        // Buscamos LA RUTA del mapa semántico para pasársela al orquestador
        const posiblesRutasMapa = [
            path.resolve(rootDir, 'test/fixtures/raw/fragmento.semantic_map.json'),
            path.resolve(rootDir, 'estilos/fragmento.semantic_map.json')
        ];
        
        let semanticMapPath = null;
        for (const ruta of posiblesRutasMapa) {
            if (fs.existsSync(ruta)) {
                semanticMapPath = ruta;
                break;
            }
        }

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación a AST Canónico
        const adapterModule = require(path.resolve(__dirname, '../../../src/adaptadores/InDesignAdapter'));
        const adaptarInDesign = typeof adapterModule === 'function' ? adapterModule : (adapterModule.adaptarInDesign || adapterModule.adaptar);
        
        // El adaptador necesita el objeto JSON parseado
        const semanticMapObj = semanticMapPath ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) : {};
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw, semanticMap: semanticMapObj });
        const astCanonico = adaptado.ast || adaptado;

        // 2. Orquestación: Pasamos la RUTA al compilador Lexmotor (dependencias.semanticMapPath)
        const compiladorModulo = require(path.resolve(__dirname, '../../../src/compiladores/compilarLexmotor.js'));
        const compilarLexmotor = typeof compiladorModulo === 'function' ? compiladorModulo : compiladorModulo.compilarLexmotor;
        
        const dependencias = semanticMapPath ? { semanticMapPath } : {};
        const resultadoCompilacion = await compilarLexmotor(astCanonico, dependencias);

        resultadoXHTML = typeof resultadoCompilacion === 'string' 
            ? resultadoCompilacion 
            : (resultadoCompilacion.xhtml || resultadoCompilacion.resultado || '');

        const dom = new JSDOM(resultadoXHTML);
        documentosNodos = Array.from(dom.window.document.querySelectorAll('p, h2, h3, div, span'));
        documentosNodos = documentosNodos.filter(el => (el.getAttribute('class') || '').trim() !== ''); 
        
        documentosNodos.forEach(el => {
            const clase = el.getAttribute('class') || '';
            matrizGeneral[clase] = (matrizGeneral[clase] || 0) + 1;
            const partes = clase.trim().split(/\s+/);
            
            if (partes.includes('texto_cuerpo')) semantica.texto_cuerpo++;
            if (partes.includes('articulo')) semantica.articulo++;
            if (partes.includes('paragrafo_normativo')) semantica.paragrafo_normativo++;
            if (partes.includes('titulo_parte')) semantica.titulo_parte++;
            
            if (partes.includes('cuerpo-siguiente')) presentacion['cuerpo-siguiente']++;
            if (partes.includes('sangria-n1')) presentacion['sangria-n1']++;
            if (partes.includes('p02-title-main')) presentacion['p02-title-main']++;
            if (partes.includes('titulo') && !partes.includes('titulo_parte') && !partes.includes('capitulo')) presentacion['titulo']++;
            if (partes.includes('titulo_parte') && !partes.includes('p02-title-main')) presentacion['titulo_parte']++;
            if (partes.includes('texto-centrado-bold')) presentacion['texto-centrado-bold']++;
            
            if (partes[0] !== 'parrafo' && partes[0] !== 'sin-clase') {
                nodosValidos++;
            }
        });

        console.log('\n====================================================================');
        console.log('   E12.6-C — MATRIZ TIPOGRÁFICA GENERADA (Para Diagnóstico)');
        console.log('====================================================================');
        Object.entries(matrizGeneral).forEach(([cls, freq]) => console.log(`     ↳ "${cls}": ${freq} nodos`));
        console.log('====================================================================\n');
    });

    test('C3: Invariantes Semánticas (El orquestador preserva E12.2)', () => {
        expect(semantica.texto_cuerpo).toBe(125);
        expect(semantica.articulo).toBe(78);
        expect(semantica.paragrafo_normativo).toBe(3);
        expect(semantica.titulo_parte).toBe(2);
    });

    test('C4: Invariantes de Presentación (Empíricas del Fixture 211)', () => {
        expect(presentacion['cuerpo-siguiente']).toBe(194);
        expect(presentacion['sangria-n1']).toBe(8);
        expect(presentacion['p02-title-main']).toBe(2);
        expect(presentacion['titulo']).toBe(2);
        expect(presentacion['texto-centrado-bold']).toBe(1);
    });

    test('C5: Cobertura Semántica Total (Todos los nodos asumen una clase legal combinada)', () => {
        expect(nodosValidos).toBe(208);
    });
});