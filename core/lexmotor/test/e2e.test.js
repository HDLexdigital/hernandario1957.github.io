/**
 * test/e2e.test.js
 * Prueba End-to-End: JSON Real InDesign -> ACL -> Proyección Web/EPUB
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/compiladores/compilarLexmotor.js');

describe('E2E: Integración LexMotor con JSON InDesign', () => {
    let jsonProduccion;

    beforeAll(() => {
        const fixturePath = path.join(__dirname, '../../../test/fixtures/indesign-muestra-real.json');
        jsonProduccion = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    });

    test('1. Pipeline WEB: Suprime epub:type y respeta omisiones de lang', () => {
        const resultadoWeb = jsonProduccion.map(nodo => compilarLexmotor(nodo, 'WEB'));

        const salidaEsperadaWeb = [
            '<h1 lang="es-CO">CONSTITUCIÓN POLÍTICA DE COLOMBIA</h1>',
            '<section role="doc-chapter">TÍTULO I\nDE LOS PRINCIPIOS FUNDAMENTALES</section>',
            '<section>Artículo 1. Colombia es un Estado social de derecho, organizado en forma de República unitaria.</section>',
            '<p lang="es-CO">Son fines esenciales del Estado: servir a la comunidad y garantizar la efectividad de los principios.</p>',
            '<span aria-hidden="true">***</span>'
        ];

        expect(resultadoWeb).toEqual(salidaEsperadaWeb);
    });

    test('2. Pipeline EPUB: Inyecta semántica estructural W3C y respeta omisiones de lang', () => {
        const resultadoEpub = jsonProduccion.map(nodo => compilarLexmotor(nodo, 'EPUB'));

        const salidaEsperadaEpub = [
            '<h1 epub:type="title" lang="es-CO">CONSTITUCIÓN POLÍTICA DE COLOMBIA</h1>',
            '<section epub:type="chapter" role="doc-chapter">TÍTULO I\nDE LOS PRINCIPIOS FUNDAMENTALES</section>',
            '<section epub:type="division">Artículo 1. Colombia es un Estado social de derecho, organizado en forma de República unitaria.</section>',
            '<p lang="es-CO">Son fines esenciales del Estado: servir a la comunidad y garantizar la efectividad de los principios.</p>',
            '<span aria-hidden="true">***</span>'
        ];

        expect(resultadoEpub).toEqual(salidaEsperadaEpub);
    });
});
