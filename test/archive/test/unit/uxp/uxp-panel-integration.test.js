const { UxpPanelIntegration } = require('../../../src/uxp/UxpPanelIntegration');

describe('G1.4 — Contrato del Panel UXP e Interfaz (UxpPanelIntegration)', () => {
    test('G1.4.1 — Extrae y sanea correctamente los parámetros desde los elementos de UI simulados', () => {
        const mockElements = {
            inputPath: { value: '  C:/proyecto/doc.txt  ' },
            semanticMapPath: { value: ' C:/proyecto/sem.json ' },
            cssPath: { value: 'C:/proyecto/styles.css' },
            outputPath: { value: 'C:/proyecto/salida' },
            profilePath: { value: 'C:/proyecto/profile.json' }
        };

        const payload = UxpPanelIntegration.recopilarParametros(mockElements);

        expect(payload.input).toBe('C:/proyecto/doc.txt');
        expect(payload.semanticMap).toBe('C:/proyecto/sem.json');
        expect(payload.css).toBe('C:/proyecto/styles.css');
        expect(payload.output).toBe('C:/proyecto/salida');
        expect(payload.profile).toBe('C:/proyecto/profile.json');
    });

    test('G1.4.2 — Omite el parámetro profile si el campo de UI está vacío o no definido', () => {
        const mockElements = {
            inputPath: { value: 'C:/proyecto/doc.txt' },
            semanticMapPath: { value: 'C:/proyecto/sem.json' },
            cssPath: { value: 'C:/proyecto/styles.css' },
            outputPath: { value: 'C:/proyecto/salida' },
            profilePath: { value: '' } // Vacío
        };

        const payload = UxpPanelIntegration.recopilarParametros(mockElements);
        expect(payload.profile).toBeUndefined();
    });

    test('G1.4.3 — Mapea el feedback interpretado a propiedades de renderizado visual para la UI', () => {
        const feedbackVisual = {
            success: false,
            code: 3,
            severity: 'error',
            title: 'Error del Adaptador InDesign',
            message: 'Estructura de nodos no soportada',
            actionable: true,
            metricsSummary: { durationMs: 120, nodeCount: 45 }
        };

        const propsUI = UxpPanelIntegration.mapearAPropiedadesUI(feedbackVisual);

        expect(propsUI.bannerVariant).toBe('error');
        expect(propsUI.headingText).toBe('Error del Adaptador InDesign');
        expect(propsUI.bodyText).toBe('Estructura de nodos no soportada');
        expect(propsUI.showMetrics).toBe(true);
        expect(propsUI.metricsText).toContain('120 ms');
    });
});