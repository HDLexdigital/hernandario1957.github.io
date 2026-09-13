# Roadmap del proyecto

Estado actual del sitio y próximos pasos planificados.

## Estado actual

### Completado

- Estructura base del sitio con Astro v4 + TailwindCSS v3
- Layout principal (LayoutBase) con header, footer, logo y toggle de tema
- Sistema de temas claro/oscuro/auto con tokens semánticos
- Paleta cobalto (#0047AB) como color de marca
- Colección normas con 10 normas ficticias de prueba
- Página /normativa con buscador en vivo y filtro por tipo
- Página /normativa/[slug] con TOC lateral, barra de progreso,
  breadcrumbs, cita copiable y controles de lectura
- Componentes reutilizables: NormaCard, Breadcrumbs, ReadingProgress,
  TocSidebar, CiteButton, ControlesLectura, ThemeToggle
- Home con cards clickeables y hover claro/oscuro
- Layout alternativo (LayoutNorma) para la ruta antigua /normas/[slug]
- Sin warnings en el build

### Pendiente

- Catálogo comercial de publicaciones
- Schema de publicaciones (sku, precio, portada, formatos)
- Integración de pasarela de pago
- Generación automática de EPUB, PDF accesible y PDF fijo
- PWA instalable con lectura offline
- Verificación pública de autenticidad por hash
- Búsqueda full-text real (no solo client-side)
- Migración de contenido real (las 10 normas son ficticias)

## Fases planificadas

### Fase 1 — Base del sitio

Estado: COMPLETADA

- Astro + Tailwind + Content Collections
- Layout principal, temas, tokens semánticos
- Normativa con listado y detalle

### Fase 2 — Documentación

Estado: COMPLETADA

- README.md
- docs/ARQUITECTURA.md
- docs/TEMAS.md
- docs/COMPONENTES.md
- docs/CONTENIDO.md
- docs/ROADMAP.md

### Fase 3 — Catálogo comercial

Estado: COMPLETADA (base)

Objetivo: convertir el sitio en un e-commerce de publicaciones jurídicas.

Tareas:

- Schema publicaciones con Zod (sku, precio, moneda, formatos)
- Página /catalogo como grilla de productos
- Página /publicaciones/[slug] con ficha de producto
- Carrito y checkout
- Integración con MercadoPago / Stripe
- Área "Mi biblioteca" para el comprador

### Fase 4 — Formatos de entrega

Estado: PENDIENTE

Objetivo: generar los 5 formatos de cada publicación.

Formatos:

- HTML (lectura online)
- EPUB (e-reader reflowable)
- PDF accesible (PDF/UA)
- PDF fijo (PDF/A)
- PWA (offline instalable)

Herramientas previstas:

- Pandoc para EPUB y PDF/UA
- WeasyPrint o LaTeX para PDF fijo
- Service Worker + manifest para PWA

### Fase 5 — Trazabilidad

Estado: PENDIENTE

Objetivo: garantizar integridad y autenticidad de cada documento.

Tareas:

- Hash SHA-256 de cada publicación
- Firma digital con GPG
- Sello temporal (RFC 3161 o similar)
- Página /verificar/[hash] pública
- QR en cada PDF descargado

### Fase 6 — Deploy

Estado: PENDIENTE

Tareas:

- Configurar dominio
- Hosting (Netlify, Vercel o Cloudflare Pages)
- SSL automático
- CI/CD con GitHub Actions
- Backup de contenido

## Decisiones tomadas

- Estático por defecto (sin SSR ni base de datos)
- Content Collections con validación Zod
- Tokens semánticos en lugar de colores fijos
- Paleta cobalto como color de marca
- Interfaz oscura por defecto con opción clara
- Componentes Astro, sin framework JS adicional (React/Vue/etc.)
- JavaScript solo cuando es imprescindible (toggle, búsqueda, controles)

## Notas

- Las 10 normas actuales son ficticias, generadas con scripts/seed-normas.mjs
- El contenido real se cargará en la Fase 3 o antes si es necesario
- La ruta antigua /normas/[slug] se conserva por compatibilidad
- El modo sepia está definido en CSS pero no expuesto en el toggle
