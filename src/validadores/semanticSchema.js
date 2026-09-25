/**
 * src/validadores/semanticSchema.js
 * Implementación en Zod del Contrato C01-04 (Unión Discriminada Estricta)
 */
const { z } = require('zod');

// Validador nativo y riguroso para BCP 47 usando Node.js Intl API
const bcp47Validator = z.string().nullable().refine((val) => {
    if (val === null) return true;
    try {
        Intl.getCanonicalLocales(val);
        return true;
    } catch (error) {
        return false;
    }
}, { message: "Violación de contrato: El idioma provisto no cumple con el estándar BCP 47." });

const baseTraceability = {
    sourceStyle: z.string().min(1)
};

// Se construyen los esquemas puros para que discriminatedUnion pueda leerlos
const RawTitleTokenSchema = z.object({
    ...baseTraceability,
    semanticClass: z.literal('title'),
    headingLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    htmlElement: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    ariaRole: z.null(),
    epubType: z.literal('title'),
    ariaHidden: z.null(),
    lang: bcp47Validator
}).strict();

const ChapterTokenSchema = z.object({
    ...baseTraceability,
    semanticClass: z.literal('chapter'),
    headingLevel: z.null(),
    htmlElement: z.literal('section'),
    ariaRole: z.literal('doc-chapter'),
    epubType: z.literal('chapter'),
    ariaHidden: z.null(),
    lang: bcp47Validator
}).strict();

const ArticleTokenSchema = z.object({
    ...baseTraceability,
    semanticClass: z.literal('article'),
    headingLevel: z.null(),
    htmlElement: z.literal('section'),
    ariaRole: z.null(),
    epubType: z.literal('division'),
    ariaHidden: z.null(),
    lang: bcp47Validator
}).strict();

const BodyTokenSchema = z.object({
    ...baseTraceability,
    semanticClass: z.literal('body'),
    headingLevel: z.null(),
    htmlElement: z.literal('p'),
    ariaRole: z.null(),
    epubType: z.null(),
    ariaHidden: z.null(),
    lang: bcp47Validator
}).strict();

const DecorativeTokenSchema = z.object({
    ...baseTraceability,
    semanticClass: z.literal('decorative'),
    headingLevel: z.null(),
    htmlElement: z.enum(['span', 'div']),
    ariaRole: z.null(),
    epubType: z.null(),
    ariaHidden: z.literal(true),
    lang: bcp47Validator
}).strict();

// El Token Final es estrictamente UNA de estas firmas (Discriminated Union)
const BaseSemanticTokenSchema = z.discriminatedUnion("semanticClass", [
    RawTitleTokenSchema,
    ChapterTokenSchema,
    ArticleTokenSchema,
    BodyTokenSchema,
    DecorativeTokenSchema
]);

// Aplicamos la Validación Relacional (SEM-08) al final, sobre la unión completa
const SemanticTokenSchema = BaseSemanticTokenSchema.superRefine((val, ctx) => {
    if (val.semanticClass === 'title') {
        if (val.htmlElement !== `h${val.headingLevel}`) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Violación SEM-08: Equivalencia biunívoca fallida entre headingLevel y htmlElement."
            });
        }
    }
});

module.exports = {
    SemanticTokenSchema,
    TitleTokenSchema: RawTitleTokenSchema,
    ChapterTokenSchema,
    ArticleTokenSchema,
    BodyTokenSchema,
    DecorativeTokenSchema
};
