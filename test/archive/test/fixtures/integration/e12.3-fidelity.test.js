'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

/**
 * Perfil métrico de referencia congelado empíricamente (E12.3-BASE)
 * Nota: El color de '.titulo' (#aN) se omite intencionalmente hasta obtener nueva evidencia.
 */
const PERFIL_TIPOGRAFICO_E12_3 = {
    "cuerpo-siguiente": {
        fontFamily: '"Liberation Serif", serif',
        fontSize: '14pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '4.25pt',
        textIndent: '17pt'
    },
    "sangria-n1": {
        fontFamily: '"Minion Pro", serif',
        fontSize: '14pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '4.25pt',
        textIndent: '-22pt'
    },
    "base-titulos": {
        fontFamily: '"Liberation Serif", serif',
        fontSize: '15pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '9.92pt'
    },
    "p02-title-main": {
        fontFamily: '"Georgia Pro", serif',
        fontSize: '24pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '14.17pt',
        marginBottom: '2.83pt'
    },
    "titulo": {
        fontFamily: '"Georgia Pro", serif',
        fontSize: '16pt',
        lineHeight: '1.2',
        // color pendiente de evidencia empírica (#aN descartado)
        marginTop: '14.17pt',
        marginBottom: '2.83pt'
    },
    "texto-centrado-normal": {
        fontFamily: '"Liberation Serif", serif',
        fontSize: '14pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '5pt',
        marginBottom: '5pt'
    },
    "texto-centrado-bold": {
        fontFamily: '"Liberation Serif", serif',
        fontSize: '14pt',
        lineHeight: '1.2',
        color: '#000000',
        marginTop: '5pt',
        marginBottom: '5pt'
    }
};

/**
 * Parser de reglas CSS tolerante a espacios y saltos de línea
 */
function extraerReglasCSS(css) {
    const reglas = {};
    // Limpiamos comentarios CSS para evitar interferencias en el parsing
    const cssLimPIO = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const regex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(cssLimPIO)) !== null) {
        // Normalizamos los selectores (separa por comas si hay selectores múltiples)
        const selectoresBrutos = match[1].trim().split(',');
        const cuerpo = match[2];
        const propiedades = {};

        cuerpo.split(';').forEach(declaracion => {
            const indice = declaracion.indexOf(':');
            if (indice === -1) return;

            const propiedad = declaracion.slice(0, indice).trim();
            const valor = declaracion.slice(indice + 1).trim();

            if (propiedad) {
                propiedades[propiedad] = valor;
            }
        });

        selectoresBrutos.forEach(sel => {
            const selectorLimPIO = sel.trim();
            reglas[selectorLimPIO] = propiedades;
        });
    }

    return reglas;
}

function obtenerReglaClase(reglas, nombreClase) {
    // Buscamos tanto con punto exacto como por coincidencia parcial de clase
    const selectorPunto = `.${nombreClase}`;
    if (reglas[selectorPunto]) return reglas[selectorPunto];

    // Búsqueda tolerante por si el selector contiene pseudoclases o combinadores
    const claveEncontrada = Object.keys(reglas).find(k => k.includes(`.${nombreClase}`));
    return claveEncontrada ? reglas[claveEncontrada] : undefined;
}

describe('E12.3 — Fidelidad Tipográfica, Métrica y Jerárquica', () => {

    let cssText;
    let reglas;

    beforeAll(() => {
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css'); // Ajustar según ruta real
        cssText = fs.readFileSync(cssPath, 'utf8');
        reglas = extraerReglasCSS(cssText);
    });

    test('E12.3-A — Inventario: todas las clases tipográficas críticas tienen regla CSS', () => {
        for (const clase of Object.keys(PERFIL_TIPOGRAFICO_E12_3)) {
            const regla = obtenerReglaClase(reglas, clase);
            expect(regla).toBeDefined();
        }
    });

    describe('E12.3-B — Fidelidad Métrica Declarativa por Clase', () => {
        for (const [clase, perfil] of Object.entries(PERFIL_TIPOGRAFICO_E12_3)) {
            test(`Selector .${clase} conserva sus métricas declarativas`, () => {
                const regla = obtenerReglaClase(reglas, clase);
                expect(regla).toBeDefined();

                if (perfil.fontFamily !== undefined) {
                    expect(regla['font-family']).toBe(perfil.fontFamily);
                }
                if (perfil.fontSize !== undefined) {
                    expect(regla['font-size']).toBe(perfil.fontSize);
                }
                if (perfil.lineHeight !== undefined) {
                    expect(regla['line-height']).toBe(perfil.lineHeight);
                }
                if (perfil.color !== undefined) {
                    expect(regla['color']).toBe(perfil.color);
                }
                if (perfil.marginTop !== undefined) {
                    expect(regla['margin-top']).toBe(perfil.marginTop);
                }
                if (perfil.marginBottom !== undefined) {
                    expect(regla['margin-bottom']).toBe(perfil.marginBottom);
                }
                if (perfil.textIndent !== undefined) {
                    expect(regla['text-indent']).toBe(perfil.textIndent);
                }
            });
        }
    });

    describe('E12.3-C — Jerarquía Tipográfica (Relaciones Métricas)', () => {

        test('Cuerpo base utiliza 14pt', () => {
            expect(reglas['.cuerpo-siguiente']['font-size']).toBe('14pt');
        });

        test('Título principal (.p02-title-main: 24pt) supera estrictamente al cuerpo (14pt)', () => {
            const titulo = parseFloat(reglas['.p02-title-main']['font-size']);
            const cuerpo = parseFloat(reglas['.cuerpo-siguiente']['font-size']);
            expect(titulo).toBeGreaterThan(cuerpo);
            expect(titulo).toBe(24);
        });

        test('Título general (.titulo: 16pt) supera estrictamente al cuerpo (14pt)', () => {
            const titulo = parseFloat(reglas['.titulo']['font-size']);
            const cuerpo = parseFloat(reglas['.cuerpo-siguiente']['font-size']);
            expect(titulo).toBeGreaterThan(cuerpo);
            expect(titulo).toBe(16);
        });

        test('Base de títulos (.base-titulos: 15pt) supera estrictamente al cuerpo (14pt)', () => {
            const titulo = parseFloat(reglas['.base-titulos']['font-size']);
            const cuerpo = parseFloat(reglas['.cuerpo-siguiente']['font-size']);
            expect(titulo).toBeGreaterThan(cuerpo);
            expect(titulo).toBe(15);
        });

        test('Verificación de escala jerárquica global: 24 > 16 > 15 > 14', () => {
            const p02Main = parseFloat(reglas['.p02-title-main']['font-size']);
            const titulo = parseFloat(reglas['.titulo']['font-size']);
            const baseTitulos = parseFloat(reglas['.base-titulos']['font-size']);
            const cuerpo = parseFloat(reglas['.cuerpo-siguiente']['font-size']);

            expect(p02Main).toBeGreaterThan(titulo);
            expect(titulo).toBeGreaterThan(baseTitulos);
            expect(baseTitulos).toBeGreaterThan(cuerpo);
        });
    });

});