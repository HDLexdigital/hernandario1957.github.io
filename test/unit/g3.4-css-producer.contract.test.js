/**
 * G3.4-T4.1 — CSS Contract Producer Specification
 * Verifica que un generador de CSS asigne las propiedades visuales del estilo
 * al selector definido en exportTagging.epub.className, no a originalName.
 */

const assert = require('assert');

// 1. Fixture: Modelo combinado que incluye ambas ontologías
const combinedStyleModel = [
    {
        originalName: "P01_BODY_BASE",
        exportTagging: { epub: { className: "p01-body-cont" } },
        properties: { "font-size": "1rem", "line-height": "1.5" }
    },
    {
        originalName: "P02_TITLE_PART",
        exportTagging: { epub: { className: "p02-title-main" } },
        properties: { "font-weight": "bold", "color": "#333" }
    }
];

// 2. Verificador Contractual
function validateCSSProducerContract(producerFn, model) {
    const cssOutput = producerFn(model) || "";
    const errors = [];

    for (const style of model) {
        const expectedClass = style.exportTagging.epub.className;
        const originalName = style.originalName;

        // A. Cobertura: ¿Existe el selector contractual?
        const classRegex = new RegExp(`\\.${expectedClass}\\s*\\{([^}]+)\\}`);
        const match = classRegex.exec(cssOutput);

        if (!match) {
            errors.push(`Falta la clase contractual .${expectedClass} para el estilo ${originalName}`);
            continue;
        }

        // B. Semántica Visual: ¿Están las propiedades correctas en el selector?
        const rules = match[1];
        for (const [prop, value] of Object.entries(style.properties)) {
            if (!rules.includes(`${prop}: ${value}`)) {
                errors.push(`Propiedad faltante o incorrecta [${prop}: ${value}] en el selector .${expectedClass}`);
            }
        }

        // C. Violación de Ontología: ¿Se utilizó originalName como selector accidentalmente?
        const badSelector = "." + originalName.toLowerCase().replace(/_/g, '-');
        if (cssOutput.includes(`${badSelector} {`)) {
            errors.push(`Violación de ontología: Se generó el selector ${badSelector} basado en originalName`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// ==========================================
// SUITE DE PRUEBAS DEL PRODUCTOR (G3.4-T4.1)
// ==========================================
describe('G3.4-T4.1 — CSS Contract Producer Specification', () => {

    test('RED: Productor que utiliza originalName (Simula el fallo de adaptadorCSS.js actual)', () => {
        const badProducer = (model) => {
            return model.map(st => {
                const selector = "." + st.originalName.toLowerCase().replace(/_/g, '-');
                return `${selector} { font-size: ${st.properties['font-size']}; line-height: ${st.properties['line-height']}; }`;
            }).join('\n');
        };

        const result = validateCSSProducerContract(badProducer, combinedStyleModel);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.some(e => e.includes('Falta la clase contractual')));
    });

    test('RED: Productor que usa className pero omite las propiedades visuales', () => {
        const incompleteProducer = (model) => {
            return model.map(st => {
                const selector = "." + st.exportTagging.epub.className;
                return `${selector} { /* Sin propiedades */ }`;
            }).join('\n');
        };

        const result = validateCSSProducerContract(incompleteProducer, combinedStyleModel);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.some(e => e.includes('Propiedad faltante o incorrecta')));
    });

    test('GREEN: Productor Canónico que asigna propiedades al exportTagging.epub.className', () => {
        const canonicalProducer = (model) => {
            return model.map(st => {
                const selector = "." + st.exportTagging.epub.className;
                const rules = Object.entries(st.properties)
                                    .map(([k, v]) => `${k}: ${v};`)
                                    .join(' ');
                return `${selector} { ${rules} }`;
            }).join('\n');
        };

        const result = validateCSSProducerContract(canonicalProducer, combinedStyleModel);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.errors.length, 0);
    });

});