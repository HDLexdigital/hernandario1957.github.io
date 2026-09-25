const { z } = require('zod');

const ProfileStyleMapSchema = z.record(
    z.string(),
    z.object({
        tag: z.string().min(1).optional(),
        class: z.string().min(1).optional(),
        className: z.string().min(1).optional()
    })
);

const SemanticMapSchema = z.object({
    document: z.string().optional(),
    styles: z.array(z.object({
        originalName: z.string(),
        type: z.enum(['paragraph', 'character']).optional(),
        exportTagging: z.object({
            epub: z.object({
                tag: z.string().optional(),
                className: z.string().optional()
            }).optional()
        }).optional()
    })).optional()
});

const CharacterRunSchema = z.object({
    tipoNodo: z.literal('character'),
    texto: z.string().optional(),
    estiloCaracter: z.string().optional(),
    inDesignStyle: z.string().optional()
}).passthrough();

const ParagraphNodeSchema = z.object({
    tipoNodo: z.literal('paragraph'),
    inDesignStyle: z.string().optional(),
    estiloParrafo: z.string().optional(),
    texto: z.string().optional(),
    htmlContent: z.string().optional(),
    contenido: z.array(CharacterRunSchema).optional()
}).passthrough();

const RawJsonSchema = z.union([
    z.object({ tokens: z.array(ParagraphNodeSchema) }),
    z.array(ParagraphNodeSchema)
]);

function validarDatosEntrada(jsonCrudo, profileMap, semanticMap) {
    const resTokens = RawJsonSchema.safeParse(jsonCrudo);
    if (!resTokens.success) throw new Error(`[LexDigital Error] JSON de entrada inválido: ${resTokens.error.message}`);
    const resProfile = ProfileStyleMapSchema.safeParse(profileMap || {});
    if (!resProfile.success) throw new Error(`[LexDigital Error] style-map.json inválido: ${resProfile.error.message}`);
    return true;
}

module.exports = { validarDatosEntrada, RawJsonSchema, ProfileStyleMapSchema, SemanticMapSchema };
