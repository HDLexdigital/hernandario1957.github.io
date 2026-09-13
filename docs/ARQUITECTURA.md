# Arquitectura del proyecto

Documento con las decisiones técnicas del sitio LexDigitalHD.

## Visión general

Sitio estático generado con Astro v4, sin backend propio. Todo el contenido
vive en Content Collections (Markdown + JSON) y se compila a HTML/CSS/JS puro.

### Principios de diseño

- Estático por defecto: máxima performance, mínimo costo de hosting
- Contenido estructurado: cada norma y publicación valida contra un schema Zod
- Temas claros/oscuros/auto: tokens semánticos, no colores hardcodeados
- Accesibilidad WCAG 2.2 AA: contraste, foco, lectores de pantalla

## Estructura de carpetas

    src/
      components/     Componentes Astro reutilizables
      content/        Content Collections (normas, publicaciones)
        config.ts     Schemas Zod de cada colección
        normas/       Markdown de normas (una por archivo)
        normas-data/  JSON de datos auxiliares de normas
      data/           JSONs sueltos que no encajan en colecciones
      layouts/        Layouts base y específicos
      pages/          Rutas del sitio (file-based routing)
      styles/         CSS global con tokens semánticos
    public/           Assets estáticos servidos tal cual
    scripts/          Scripts Node para generar contenido
    docs/             Documentación del proyecto

## Decisiones técnicas

### Astro en modo estático

Se usa `output: 'static'`. No hay SSR ni API routes propias. Todas las
páginas se generan en build time. Ventajas: hosting gratuito (Netlify,
Vercel, Cloudflare Pages), carga instantánea, sin costos de servidor.

### Content Collections con Zod

Cada norma y publicación valida contra un schema Zod. Si un archivo no
cumple el schema, el build falla con un error claro. Esto evita publicar
contenido con metadatos incompletos.

### Sin base de datos

No hay DB. Todo el contenido vive en archivos versionados con git. Esto
permite auditar cambios, hacer rollback y mantener trazabilidad completa
de cada edición de cada norma.

## Flujo de contenido

### Normas

1. Se crea un archivo `.md` en `src/content/normas/` con frontmatter YAML
2. Zod valida que tenga título, tipo, número, fecha, vigente
3. Astro expone la colección vía `getCollection('normas')`
4. Se renderiza en `/normativa` (listado) y `/normativa/[slug]` (detalle)

### Scripts de generación

- `scripts/seed-normas.mjs` — genera N normas ficticias para desarrollo
- `scripts/build-public.js` — pipeline de compilación (WIP)

### Datos auxiliares

Los JSON que no encajan en colecciones van a `src/data/`. No se procesan
con Zod, se importan directamente desde los componentes que los necesiten.

## Limitaciones conocidas

- Los backends de pago (MercadoPago) están pendientes de integración
- El catálogo comercial todavía no está implementado
- La colección `publicaciones` aún no existe en el schema
- La búsqueda es client-side (JS puro), no hay índice full-text real
- Los PDFs/EPUBs todavía no se generan automáticamente

## Próximos pasos

Ver `docs/ROADMAP.md` para el plan por etapas.
