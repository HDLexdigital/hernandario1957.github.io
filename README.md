# LexDigitalHD

Plataforma de publicación y validación jurídica con trazabilidad digital.

## ¿Qué es?

Sitio web para publicar normativa, jurisprudencia y doctrina con metadatos
estructurados, control de versiones y sellado de autenticidad. Incluye un
catálogo comercial de publicaciones en múltiples formatos (HTML, EPUB, PDF
accesible, PDF fijo, PWA).

## Stack

- Astro v4 — framework estático con islas de interactividad
- TailwindCSS v3 — utilidades + tokens semánticos
- Content Collections — normas y publicaciones en Markdown con schema Zod
- Node.js 18 o superior — para scripts de generación

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

Clonar el repositorio y entrar en la carpeta:

    git clone <repo-url>
    cd LexDigitalHD-web
    npm install

## Comandos

| Comando | Descripción |
|---|---|
| npm run dev | Servidor de desarrollo en http://localhost:4321 |
| npm run build | Build de producción en dist/ |
| npm run preview | Previsualiza el build de producción |
| node scripts/seed-normas.mjs | Regenera las 10 normas ficticias de prueba |

## Estructura del proyecto

    src/
      components/   Componentes reutilizables (Astro)
      content/      Colecciones de contenido (normas, publicaciones)
      data/         Datos JSON auxiliares
      layouts/      Layouts base y específicos
      pages/        Rutas del sitio (file-based routing)
      styles/       CSS global con tokens semánticos
    public/         Assets estáticos (logo, favicon)
    scripts/        Scripts Node para generar contenido
    docs/           Documentación adicional del proyecto

## Más documentación

- docs/ARQUITECTURA.md — decisiones técnicas
- docs/TEMAS.md — sistema claro/oscuro/auto
- docs/COMPONENTES.md — catálogo de componentes
- docs/CONTENIDO.md — cómo agregar normas y publicaciones
- docs/ROADMAP.md — estado actual y próximos pasos
