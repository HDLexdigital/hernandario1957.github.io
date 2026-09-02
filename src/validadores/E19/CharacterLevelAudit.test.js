/**
 * E19.4.3 — Suite Contractual Sintética de Auditoría a Nivel de Caracteres
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Descompone cadenas AST y DOM en puntos de código Unicode (Code Points) y métricas físicas detalladas.
 * - Aisla deltas de espacio, caracteres de control, puntuación y caracteres alfanuméricos puros.
 * - Determina si un CONTENT_ADDITION aparente se debe a artefactos estructurales o a contenido real.
 * - Preserva inmutabilidad estricta y editorialEquivalence: 'NOT_DEMONSTRATED'.
 */

'use strict';

// El motor de auditoría a nivel de caracteres aún no está implementado (Fase RED esperada)
const CharacterLevelAudit = require('../../../src/validadores/E19/CharacterLevelAudit');

describe('E19.4.3 — CharacterLevelAudit Contract Suite (Fase RED)', () => {

    test('1. Descomposición precisa de code points y deltas estructurales', () => {
        const astText = 'Texto base.';
        const domText = 'Texto base con espacio extra y control \u200B.'; // Incluye espacio de ancho cero

        const audit = CharacterLevelAudit.analyzeCodePoints(astText, domText);

        expect(audit.astCodePointsCount).toBe(astText.length);
        expect(audit.domCodePointsCount).toBe(domText.length);
        expect(audit.whitespaceDelta).toBeGreaterThan(0);
        expect(audit.controlCharacterCount).toBeGreaterThan(0);
    });

    test('2. Aislamiento de contenido genuino frente a artefactos puramente espaciales o de control', () => {
        const astText = 'Artículo';
        const domText = 'Artículo   \n '; // Solo se añadieron espacios y saltos de línea

        const audit = CharacterLevelAudit.analyzeCodePoints(astText, domText);

        expect(audit.hasGenuineContentAddition).toBe(false);
        expect(audit.causalClassification).toBe('STRUCTURAL_WHITESPACE_ARTIFACT');
    });

    test('3. Detección positiva de contenido alfanumérico genuinamente añadido', () => {
        const astText = 'Artículo 1.';
        const domText = 'Artículo 1. Inciso añadido.';

        const audit = CharacterLevelAudit.analyzeCodePoints(astText, domText);

        expect(audit.hasGenuineContentAddition).toBe(true);
        expect(audit.causalClassification).toBe('GENUINE_CONTENT_ADDITION');
    });

    test('4. Inmutabilidad estricta de las entradas originales', () => {
        const astText = 'AST original';
        const domText = 'DOM original';

        const astClone = astText.slice();
        const domClone = domText.slice();

        CharacterLevelAudit.analyzeCodePoints(astText, domText);

        expect(astText).toEqual(astClone);
        expect(domText).toEqual(domClone);
    });

    test('5. Seguridad editorial inquebrantable', () => {
        const audit = CharacterLevelAudit.analyzeCodePoints('A', 'B');
        expect(audit.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

});