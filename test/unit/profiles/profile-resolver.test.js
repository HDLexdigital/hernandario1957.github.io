const { resolverConfiguracion } = require('../../../src/profiles/ProfileResolver');

describe('F12.3 — ProfileResolver (Precedencia y Resolución de Configuración)', () => {
    const defaultsGlobales = {
        outputFormat: "xhtml",
        indent: true,
        strictCSSCoverage: true,
        outputDir: "./salida"
    };

    test('F12.3.1 — Resuelve correctamente usando solo defaults si no hay perfil ni CLI', () => {
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil: null, cliFlags: {} });
        expect(config.outputFormat).toBe("xhtml");
        expect(config.indent).toBe(true);
        expect(config.outputDir).toBe("./salida");
    });

    test('F12.3.2 — El perfil JSON sobreescribe los valores por defecto', () => {
        const perfil = {
            name: "test-perfil",
            settings: {
                indent: false,
                outputDir: "./custom-dir"
            }
        };
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags: {} });
        expect(config.indent).toBe(false);
        expect(config.outputDir).toBe("./custom-dir");
        expect(config.outputFormat).toBe("xhtml");
    });

    test('F12.3.3 — Los flags explícitos de la CLI tienen precedencia absoluta', () => {
        const perfil = {
            name: "test-perfil",
            settings: { outputDir: "./dir-del-perfil" }
        };
        const cliFlags = { outputDir: "./dir-desde-cli" };
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags });
        expect(config.outputDir).toBe("./dir-desde-cli");
    });

    test('F12.3.4 — CLI sobreescribe defaults aunque el perfil no declare el valor', () => {
        const perfil = { name: "test-perfil", settings: {} };
        const cliFlags = { outputFormat: "epub" };
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags });
        expect(config.outputFormat).toBe("epub");
    });

    test('F12.3.5 — Propiedades no relacionadas permanecen intactas', () => {
        const perfil = { name: "test-perfil", settings: { indent: false } };
        const cliFlags = { strictCSSCoverage: false };
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags });
        
        expect(config.indent).toBe(false);
        expect(config.strictCSSCoverage).toBe(false);
        expect(config.outputFormat).toBe("xhtml");
    });

    test('F12.3.6 — Inmutabilidad: El perfil original y los defaults no sufren mutación', () => {
        const defaultsOriginales = JSON.parse(JSON.stringify(defaultsGlobales));
        const perfilOriginal = { name: "test", settings: { indent: false } };
        const perfilClonSeguro = JSON.parse(JSON.stringify(perfilOriginal));

        resolverConfiguracion({ 
            defaults: defaultsGlobales, 
            perfil: perfilOriginal, 
            cliFlags: { outputDir: "./cli" } 
        });

        expect(defaultsGlobales).toEqual(defaultsOriginales);
        expect(perfilOriginal).toEqual(perfilClonSeguro);
    });

    test('F12.3.7 — Determinismo: Resoluciones repetidas producen idéntico resultado', () => {
        const perfil = { name: "test", settings: { indent: false } };
        const resA = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags: { outputDir: "a" } });
        const resB = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags: { outputDir: "a" } });
        expect(resA).toEqual(resB);
    });

    test('F12.3.8 — Rechaza la resolución si el perfil no es válido', () => {
        const perfilInvalido = { settings: {} };
        expect(() => {
            resolverConfiguracion({ defaults: defaultsGlobales, perfil: perfilInvalido, cliFlags: {} });
        }).toThrow();
    });

    test('F12.3.9 — semanticOverrides se propaga sin alterar la estructura base', () => {
        const perfil = {
            name: "test",
            settings: {},
            semanticOverrides: { "P01": "clase-custom" }
        };
        const config = resolverConfiguracion({ defaults: defaultsGlobales, perfil, cliFlags: {} });
        expect(config.semanticOverrides).toEqual({ "P01": "clase-custom" });
    });
});