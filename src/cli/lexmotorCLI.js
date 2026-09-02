const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../core/compiladores/compilarLexmotor');
const { validateCSSCoverage } = require('../validadores/validarCSSCoverage');

/**
 * Adaptador de EjecuciÃ³n CLI de Lexmotor (F11) - VersiÃ³n Industrial Blindada
 * Traduce argumentos estrictos e interfaces de archivo a llamadas controladas 
 * del nÃºcleo, blindando los cÃ³digos de salida y previniendo colisiones o path traversal.
 */
async function ejecutarCLI(args) {
    try {
        // 1. Parsing y validaciÃ³n estricta de argumentos (F11.4 -> CÃ³digo 1)
        if (!args || args[0] !== 'compile') {
            return 1;
        }

        const params = {};
        const allowedFlags = ['--input', '--semantic-map', '--css', '--output', '--name'];
        
        for (let i = 1; i < args.length; i += 2) {
            const key = args[i];
            const val = args[i + 1];

            // Rechaza flags desconocidos o valores faltantes
            if (!allowedFlags.includes(key) || !val || val.startsWith('--')) {
                return 1;
            }
            // Rechaza flags duplicados
            if (params[key]) {
                return 1;
            }
            params[key] = val;
        }

        const inputFlag = params['--input'];
        const mapFlag = params['--semantic-map'];
        const cssFlag = params['--css'];
        const outputFlag = params['--output'];
        const nameFlag = params['--name'];

        if (!inputFlag || !mapFlag || !cssFlag || !outputFlag) {
            return 1;
        }

        // ProtecciÃ³n 1: SanitizaciÃ³n estricta contra Path Traversal en --name
        if (nameFlag && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(nameFlag)) {
            return 1;
        }

        // ResoluciÃ³n del nombre base de salida
        const nombreBase = nameFlag || path.parse(inputFlag).name;

        // 2. ValidaciÃ³n de lectura y parseo de entrada (F11.2, F11.3 -> CÃ³digo 2)
        if (!fs.existsSync(inputFlag) || !fs.existsSync(mapFlag) || !fs.existsSync(cssFlag)) {
            return 2;
        }

        let jsonCrudo, semanticMap, cssContent;
        try {
            jsonCrudo = JSON.parse(fs.readFileSync(inputFlag, 'utf8'));
            semanticMap = JSON.parse(fs.readFileSync(mapFlag, 'utf8'));
            cssContent = fs.readFileSync(cssFlag, 'utf8');
        } catch (err) {
            return 2;
        }

        // 3. InvocaciÃ³n y Gatekeeper de la Capa AnticorrupciÃ³n E10 (CÃ³digo 3)
        let adaptacion;
        try {
            adaptacion = adaptarInDesign({ jsonCrudo, semanticMap });
            
            if (!adaptacion || !adaptacion.ast || !adaptacion.diagnostics || !adaptacion.diagnostics.valid) {
                return 3;
            }
        } catch (adapterErr) {
            return 3;
        }

        // Preparar entorno de salida
        if (!fs.existsSync(outputFlag)) {
            fs.mkdirSync(outputFlag, { recursive: true });
        }

        // ProtecciÃ³n 2: Aislamiento por nombreBase para evitar colisiones concurrentes
        const mapOutput = path.join(outputFlag, `${nombreBase}.semantic_map.json`);
        const profilePath = path.join(outputFlag, `${nombreBase}.profile_map.json`);
        fs.writeFileSync(mapOutput, JSON.stringify(adaptacion.semanticMap));
        fs.writeFileSync(profilePath, '{}');

        // 4. CompilaciÃ³n del NÃºcleo E1â€“E9 (CÃ³digo 4)
        let resultadoLexmotor;
        try {
            resultadoLexmotor = await compilarLexmotor(adaptacion.ast, {
                outputFolder: outputFlag,
                semanticMapPath: mapOutput,
                profileStyleMapPath: profilePath
            });
        } catch (coreErr) {
            return 4;
        }

        // 5. ValidaciÃ³n de XHTML y Cobertura contra el CSS REAL (CÃ³digo 5)
        try {
            const diagnosticoCSS = validateCSSCoverage(resultadoLexmotor.xhtml, cssContent);
            if (!diagnosticoCSS.valid || diagnosticoCSS.missingClasses.length > 0) {
                return 5;
            }
        } catch (valErr) {
            return 5;
        }

        // 6. Persistencia Nominal CanÃ³nica (Garantiza --name o fallback al nombre de entrada)
        try {
            const rutaSalida = path.join(outputFlag, `${nombreBase}.xhtml`);
            fs.writeFileSync(rutaSalida, resultadoLexmotor.xhtml, 'utf8');
        } catch (ioErr) {
            return 5;
        }

        return 0;
    } catch (unexpectedErr) {
        return 5;
    }
}

module.exports = { ejecutarCLI };