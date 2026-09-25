/**
 * src/compiladores/compilarLexmotor.js
 * Capa Anticorrupción (ACL) - Orquestador C01-04 / C01-05
 */
const fs = require('fs');
const path = require('path');
const { LexDigitalContractError } = require('../errores/LexDigitalContractError.js');
const { SemanticTokenSchema } = require('../validadores/semanticSchema.js');
const { construirNodoXHTML } = require('../constructores/constructorXHTML.js');

// Carga en memoria del contrato de mapeo (Falla duro si el archivo no existe)
const mapPath = path.join(__dirname, '../../config/semantic-accessibility.json');
const configLexDigital = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

function compilarLexmotor(nodoInDesign, perfilSalida) {
    // 1. Validación de Perfil (Fallo Estricto C01-05 ERR-003)
    if (perfilSalida !== 'WEB' && perfilSalida !== 'EPUB') {
        throw new LexDigitalContractError({
            code: 'ERR-003_OUTPUT_PROFILE_INVALID',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: `Perfil de salida inválido o no provisto: ${perfilSalida}`,
            details: { perfil: perfilSalida }
        });
    }

    // 2. Lookup Exacto (Fallo Estricto C01-05 ERR-001)
    const styleName = nodoInDesign.styleName;
    const mapping = configLexDigital.mappings[styleName];

    if (!mapping) {
        throw new LexDigitalContractError({
            code: 'ERR-001_STYLE_NOT_REGISTERED',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: `Violación contractual: El estilo '${styleName}' no está registrado en el mapa semántico.`,
            details: { styleName: styleName }
        });
    }

    // 3. Ensamblaje del Token Estructural
    // Nota: Separamos la estructura del contenido textual para respetar el .strict() de Zod
    const tokenEstructural = {
        ...mapping,
        sourceStyle: styleName,
        lang: nodoInDesign.lang !== undefined ? nodoInDesign.lang : null
    };

    // 4. Validación Contractual Gatekeeper (Fallo Estricto C01-05 ERR-002)
    let tokenValidado;
    try {
        tokenValidado = SemanticTokenSchema.parse(tokenEstructural);
    } catch (error) {
        throw new LexDigitalContractError({
            code: 'ERR-002_TOKEN_CONTRACT_INVALID',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: 'Violación contractual: El token ensamblado no cumple con la Unión Discriminada.',
            details: { zodError: error.errors || error }
        });
    }

    // 5. Rehidratación de Payload y Proyección Pasiva
    // El constructor sí necesita el texto para interpolarlo dentro de las etiquetas
    const tokenParaProyector = {
        ...tokenValidado,
        texto: nodoInDesign.texto || "",
        contenido: nodoInDesign.contenido || null
    };

    return construirNodoXHTML(tokenParaProyector, { perfil: perfilSalida });
}

module.exports = { compilarLexmotor };
