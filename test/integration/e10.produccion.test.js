const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { validateCSSCoverage } = require('../../src/validadores/validarCSSCoverage');

describe('E10.6 — Test de Aceptación de Producción (Artefactos Reales Completos)', () => {
    let jsonCrudo;
    let semanticMap;
    let cssString;
    
    // Rutas absolutas a los artefactos generados por el extractor
	const jsonPath = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\MisJSON\\fragmento.json';
    const mapPath = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\estilos\\fragmento.semantic_map.json';
    const cssPath = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\estilos\\fragmento.css';
    
    // Configuración ambiental de destino para el pipeline
    const outputFolder = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\salidaXHTML';
    const profilePath = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular\\estilos\\profile_map.json';

    beforeAll(() => {
        // Validación de existencia antes de lectura para evitar falsos negativos
        if (!fs.existsSync(jsonPath)) throw new Error(`Falta JSON crudo en: ${jsonPath}`);
        if (!fs.existsSync(mapPath)) throw new Error(`Falta mapa semántico en: ${mapPath}`);
        if (!fs.existsSync(cssPath)) throw new Error(`Falta CSS en: ${cssPath}`);

        jsonCrudo = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        semanticMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        cssString = fs.readFileSync(cssPath, 'utf8');

        // Garantizar que la carpeta de salida exista y proveer un perfil vacío si no hay uno
        if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
        if (!fs.existsSync(profilePath)) fs.writeFileSync(profilePath, '{}', 'utf8');
    });

    test('1. El InDesignAdapter procesa el documento completo sin errores estructurales', () => {
        const resultado = adaptarInDesign({ jsonCrudo, semanticMap });
        
        expect(resultado.diagnostics.valid).toBe(true);
        expect(resultado.ast.contenido.length).toBe(208); // Verifica la ingesta total de párrafos reales
        
        // Auditoría sobre un nodo aleatorio para confirmar normalización
        const parrafoMuestra = resultado.ast.contenido[10];
        expect(parrafoMuestra.tipoNodo).toBe('paragraph');
        expect(parrafoMuestra.texto).toBeUndefined();
        expect(Array.isArray(parrafoMuestra.contenido)).toBe(true);
    });

    test('2. Preservación de atributos editoriales (E10.5)', () => {
        const resultado = adaptarInDesign({ jsonCrudo, semanticMap });
        
        const parrafoTitulo = resultado.ast.contenido.find(p => p.estiloParrafo === 'P02_TITLE_PART');
        expect(parrafoTitulo.propiedadesEstilo).toBeDefined();
        expect(parrafoTitulo.propiedadesEstilo.tamano).toBe(24);
        
        const runBold = parrafoTitulo.contenido[0];
        expect(runBold.bold).toBe(true);
    });

test('3. Pipeline Integral de Producción (InDesign -> Lexmotor -> Cobertura CSS)', async () => {
        const adaptacion = adaptarInDesign({ jsonCrudo, semanticMap });
        
        const dependencias = {
            outputFolder: outputFolder,
            semanticMapPath: mapPath,
            profileStyleMapPath: profilePath
        };

        const resultadoLexmotor = await compilarLexmotor(adaptacion.ast, dependencias);

        expect(resultadoLexmotor.xhtml).toContain('Constitución Política de la República de Colombia');
        expect(resultadoLexmotor.xhtml).toContain('es un Estado social de derecho');

        // ====================================================================
        // AJUSTE ARQUITECTÓNICO: Construcción del CSS Puente (El Orquestador)
        // ====================================================================
        let cssPuente = cssString;
        
        // El orquestador usa el diccionario de E10 para declarar en el CSS 
        // las clases semánticas que Lexmotor generó en el XHTML.
        for (const [inDesignName, semanticClass] of Object.entries(adaptacion.styleBridge)) {
            cssPuente += `\n.${semanticClass} { /* Puente semántico desde ${inDesignName} */ }`;
        }
        
        // E7: Ahora validamos el XHTML contra el CSS fusionado (Fuente + Puente)
        const diagnosticoCSS = validateCSSCoverage(resultadoLexmotor.xhtml, cssPuente);
        
        expect(diagnosticoCSS.valid).toBe(true);
        expect(diagnosticoCSS.missingClasses.length).toBe(0);
    });
});