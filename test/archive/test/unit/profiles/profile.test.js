const fs = require('fs');
const path = require('path');
const os = require('os');

// Nota: Estos módulos se implementarán en la siguiente subfase (F12.2 / F12.3).
// La suite define el contrato al que la implementación deberá someterse estrictamente.
const { validarPerfil, cargarPerfil } = require('../../../src/profiles/ProfileLoader');

describe('F12 — Perfiles Editoriales (Contrato y Carga Segura)', () => {
    let tempDir;
    let perfilValidoPath;
    let perfilInvalidoPath;
    let jsonCorruptoPath;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'f12-profile-'));
        
        perfilValidoPath = path.join(tempDir, 'constitucion.json');
        perfilInvalidoPath = path.join(tempDir, 'incompleto.json');
        jsonCorruptoPath = path.join(tempDir, 'corrupto.json');

        // F12.1 — Mínimo perfil válido exigido por el contrato
        fs.writeFileSync(perfilValidoPath, JSON.stringify({
            name: "constitucion-colombia",
            settings: {
                outputFormat: "xhtml",
                indent: true
            },
            semanticOverrides: {
                "P01_BODY_CONT": "cuerpo-siguiente"
            }
        }));

        // F12.1 — Perfil inválido (Falta settings)
        fs.writeFileSync(perfilInvalidoPath, JSON.stringify({
            name: "incompleto-sin-settings"
        }));

        // F12.2 — Archivo con sintaxis JSON rota
        fs.writeFileSync(jsonCorruptoPath, '{ name: "corrupto", malFormado: ');
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe('F12.1 — Profile Contract & Validation', () => {
        test('F12.1.1 — Acepta un perfil que cumple estrictamente con name y settings', () => {
            const perfilCrudo = JSON.parse(fs.readFileSync(perfilValidoPath, 'utf8'));
            const resultado = validarPerfil(perfilCrudo);
            expect(resultado.valid).toBe(true);
            expect(resultado.errors).toHaveLength(0);
        });

        test('F12.1.2 — Rechaza un perfil por ausencia absoluta de name', () => {
            const perfilSinNombre = { settings: {} };
            const resultado = validarPerfil(perfilSinNombre);
            expect(resultado.valid).toBe(false);
            expect(resultado.errors.some(e => e.includes('name'))).toBe(true);
        });

        test('F12.1.3 — Rechaza un perfil por ausencia absoluta de settings', () => {
            const perfilSinSettings = { name: "test-perfil" };
            const resultado = validarPerfil(perfilSinSettings);
            expect(resultado.valid).toBe(false);
            expect(resultado.errors.some(e => e.includes('settings'))).toBe(true);
        });

        test('F12.1.4 — Rechaza tipos de datos incorrectos en la estructura raíz', () => {
            const perfilTiposRotos = { name: 12345, settings: "no-es-objeto" };
            const resultado = validarPerfil(perfilTiposRotos);
            expect(resultado.valid).toBe(false);
        });
    });

    describe('F12.2 — Profile Loading & Inmutabilidad Periférica', () => {
        test('F12.2.1 — Carga exitosamente un perfil válido desde el sistema de archivos', () => {
            const perfilCargado = cargarPerfil(perfilValidoPath);
            expect(perfilCargado).toBeDefined();
            expect(perfilCargado.name).toBe('constitucion-colombia');
        });

        test('F12.2.2 — Rechaza explícitamente perfiles con JSON corrupto sin cargar estados parciales', () => {
            expect(() => {
                cargarPerfil(jsonCorruptoPath);
            }).toThrow();
        });

        test('F12.2.3 — Lanza error controlado ante perfiles inexistentes en disco', () => {
            const rutaFalsa = path.join(tempDir, 'fantasma.json');
            expect(() => {
                cargarPerfil(rutaFalsa);
            }).toThrow();
        });

        test('F12.2.4 — Inmutabilidad: La carga y resolución del perfil clonan los datos y no mutan la fuente', () => {
            const contenidoOriginal = fs.readFileSync(perfilValidoPath, 'utf8');
            const perfilCargado = cargarPerfil(perfilValidoPath);
            
            // Intentamos mutar el objeto devuelto por el cargador
            perfilCargado.settings.indent = false;
            perfilCargado.name = "mutado";

            const contenidoDespues = fs.readFileSync(perfilValidoPath, 'utf8');
            expect(contenidoDespues).toBe(contenidoOriginal);
        });

        test('F12.2.5 — Determinismo: Cargas repetidas del mismo archivo producen objetos equivalentes idénticos', () => {
            const perfilA = cargarPerfil(perfilValidoPath);
            const perfilB = cargarPerfil(perfilValidoPath);
            expect(perfilA).toEqual(perfilB);
        });
    });
});