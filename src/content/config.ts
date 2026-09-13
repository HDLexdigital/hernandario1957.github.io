import { defineCollection, z } from 'astro:content';

const publicaciones = defineCollection({
  type: 'content',
  schema: z.object({
    sku: z.string(),
    titulo: z.string(),
    subtitulo: z.string().optional(),
    autores: z.array(z.string()),
    editorial: z.string().default('LexDigitalHD'),
    coleccion: z.string().optional(),
    materia: z.array(z.string()),
    idioma: z.enum(['es', 'en', 'pt']).default('es'),
    publico: z.enum(['profesional', 'academico', 'general']).default('profesional'),
    tags: z.array(z.string()).default([]),
    tipoAcceso: z.enum(['gratis', 'pago', 'suscripcion']).default('pago'),
    precioCOP: z.number().nonnegative().default(0),
    precioUSD: z.number().nonnegative().optional(),
    precioEUR: z.number().nonnegative().optional(),
    monedaBase: z.enum(['COP', 'USD', 'EUR']).default('COP'),
    precioPromocionalCOP: z.number().optional(),
    descuentoPorcentaje: z.number().min(0).max(100).optional(),
    iva: z.enum(['exento', '19']).default('19'),
    disponible: z.boolean().default(true),
    stockIlimitado: z.boolean().default(true),
    formatos: z.array(z.enum(['html', 'epub', 'pdf-accesible', 'pdf-fijo', 'pwa'])).min(1),
    portada: z.string(),
    portadaAlt: z.string(),
    mockup: z.string().optional(),
    paginas: z.number().int().positive().optional(),
    isbn: z.string().optional(),
    doi: z.string().optional(),
    fechaPublicacion: z.coerce.date(),
    fechaActualizacion: z.coerce.date().optional(),
    edicion: z.number().int().positive().default(1),
    version: z.string().default('1.0.0'),
    hash: z.string().optional(),
    firmaDigital: z.string().optional(),
    selloTemporal: z.coerce.date().optional(),
    resumenCorto: z.string().max(280),
    resumenLargo: z.string().optional(),
    palabrasClave: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
    novedad: z.boolean().default(false),
    relacionados: z.array(z.string()).default([]),
    normasCitadas: z.array(z.string()).default([]),
    jurisprudenciaCitada: z.array(z.string()).default([]),
  }),
});

const normas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
 materia: z.string().optional(),
    tipo: z.enum(['ley', 'decreto', 'resolucion', 'ordenanza']).optional(),
    numero: z.string().optional(),
    fecha: z.coerce.date().optional(),
    resumen: z.string().optional(),
    vigente: z.boolean().default(true),
  }),
});

const normasData = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    tipo: z.string().optional(),
    numero: z.string().optional(),
    fecha: z.coerce.date().optional(),
    vigente: z.boolean().default(true),
  }),
});

export const collections = { publicaciones, normas, normasData };
