'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.2 — Contrato de Estilos y Abstracción Semántica (CSS & Desacoplamiento)', () => {

    const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
    const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
    const cssFixtureName = 'fragmento-test.css'; // Mismo mecanismo de inyección estandarizado en E11

    let resultado;
    let frecuenciasClases = {};

    /**
     * Helper robusto para extraer y contar exclusivamente las clases presentes 
     * en los atributos class="..." del XHTML generado.
     */
    function contarClasesXHTML(xhtml) {
        const matchClasses = xhtml.match(/class="([^"]+)"/g) || [];
        const frecuencias = {};
        matchClasses.forEach(m => {
            const classNameMatch = m.match(/class="([^"]+)"/);
            if (classNameMatch && classNameMatch[1]) {
                classNameMatch[1].split(/\s+/).forEach(c => {
                    frecuencias[c] = (frecuencias[c] || 0) + 1;
                });
            }
        });
        return frecuencias;
    }

beforeAll(async () => {
        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
        
        // Apuntamos a la ruta absoluta del archivo CSS del fixture en lugar de un nombre plano
        const cssPath = path.join(__dirname, '../raw/fragmento-test.css'); // O el nombre correcto del CSS en raw

        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });

        resultado = await compilarLexmotor(
            adaptacion.ast,
            'fragmento-211',
            cssPath // <- Ruta absoluta
        );

        frecuenciasClases = contarClasesXHTML(resultado.xhtml);
    });

    test('E12.2-A — Carga y existencia del archivo CSS canónico en disco', () => {
        // Apuntamos a la ruta real de los estilos del proyecto
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css'); 
        expect(fs.existsSync(cssPath)).toBe(true);
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        expect(typeof cssContent).toBe('string');
        expect(cssContent.trim().length).toBeGreaterThan(0);
    });

    test('E12.2-B — Vocabulario semántico canónico presente en clases HTML', () => {
        expect(frecuenciasClases).toHaveProperty('texto_cuerpo');
        expect(frecuenciasClases).toHaveProperty('articulo');
        expect(frecuenciasClases).toHaveProperty('paragrafo_normativo');
        expect(frecuenciasClases).toHaveProperty('titulo_parte');
    });

    test('E12.2-F — Desacoplamiento estricto de InDesign (sin fugas de nombres crudos)', () => {
        const estilosInDesignCrudos = [
            'P01_BODY_BASE',
            'P01_BODY_CONT',
            'P02_TITLE_MAIN',
            'P02_TITLE_PART',
            'P03_CENTER_BOLD'
        ];

        estilosInDesignCrudos.forEach(estiloCrudo => {
            expect(frecuenciasClases).not.toHaveProperty(estiloCrudo);
            expect(resultado.xhtml).not.toContain(`class="${estiloCrudo}"`);
        });
    });

    test('E12.2-C — Cardinalidad semántica exacta para el fixture fragmento-211', () => {
        // Congelado empíricamente tras la auditoría E12.2
        expect(frecuenciasClases.texto_cuerpo).toBe(125);
        expect(frecuenciasClases.articulo).toBe(78);
        expect(frecuenciasClases.paragrafo_normativo).toBe(3);
        expect(frecuenciasClases.titulo_parte).toBe(2);
    });

    test('E12.2-D — Correspondencia de clases tipográficas reales en el CSS fuente', () => {
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css'); // o fragmento-test.css según la ruta probada
        const cssText = fs.readFileSync(cssPath, 'utf8');
        
        // Clases tipográficas contractuales reales confirmadas en la hoja de estilos
        const clasesTipograficasReales = [
            'cuerpo-siguiente',
            'sangria-n1',
            'base-titulos',
            'p02-title-main',
            'titulo',
            'texto-centrado-normal',
            'texto-centrado-bold'
        ];

        clasesTipograficasReales.forEach(cls => {
            const regexSelector = new RegExp(`\\.${cls}\\b`, 'g');
            expect(cssText).toMatch(regexSelector);
        });
    });

});