# Estado del Proyecto — LexDigitalHD

## Última actualización
2026-09-03

## Contexto del hilo principal
- Chat principal: generador de código y decisiones definitivas.
- Chats de auditoría: ChatGPT normal y Gemini Pro extendido o normal.
- El chat principal recibe, evalúa y procesa las respuestas externas.

## Estado global
- MVP-001 a MVP-006: cerrados.
- MVP-007: PDF Accesible — **cerrado con validación PDF/UA-1 PASS reproducible**.
- MVP-008: planificado (Print-Ready PDF).

## Evidencias actuales
- `npm run ci:all` en verde en Linux.
- PDF WeasyPrint generado con 290 páginas A4.
- PDF con Tagged: yes y Metadata Stream: yes.
- Fidelidad textual casi exacta; diferencia de 1 guion decorativo.
- `npm run ci:pdf` finaliza con `✅ PDF/UA-1 PASS`.
- Tag `v0.4.0-pdf` alineado al commit final.

## Siguiente acción exacta
1. Revisar `ROADMAP.md` y docs para confirmar que MVP-007 figure como cerrado.
2. Planificar formalmente MVP-008.

## Decisiones vigentes
- Linux Mint como entorno principal para el core.
- Windows 11 solo para InDesign/extracción.
- WeasyPrint como motor PDF base.
- Economía monetaria como restricción.
- No abrir funcionalidad nueva sin contrato previo.
- Este chat es la fuente final de acciones definitivas.

## Archivos clave
- ROADMAP.md
- docs/LINUX_ENVIRONMENT.md
- docs/MVP008_CONTRACT_REQUIREMENTS.md
- core/pdf/mvp-007-pdf-publication.contract.json
- core/pdf/test/pdf-publication.contract.test.js
- scripts/build-pdf-weasyprint.js
- scripts/validate-pdfua.js
- scripts/compare-pdf-fidelity.js

## Evidencias actuales
- `npm run ci:all` en verde en Linux.
- PDF WeasyPrint generado con 290 páginas A4.
- PDF con Tagged: yes y Metadata Stream: yes.
- Fidelidad textual casi exacta; diferencia de 1 guion decorativo.
- Pendiente validación final con veraPDF.

## Siguiente acción exacta
1. Ubicar veraPDF:
   - `which verapdf`
   - o `find ~ -name "verapdf*.jar" 2>/dev/null | head -n 5`
2. Validar PDF/UA:
   - Si hay ejecutable:
     `verapdf --format text --profile pdfua-1 output/experiment-weasyprint-ua-full.pdf`
   - Si hay JAR:
     `java -jar /ruta/al/verapdf.jar --format text --profile pdfua-1 output/experiment-weasyprint-ua-full.pdf`
3. Registrar el resultado de la validación en este archivo.

## Reglas para retomar
- No repetir configuración ya resuelta.
- Leer primero PROJECT_STATE.md.
- Toda acción definitiva nace del chat principal.
- Al terminar una sesión, actualizar este archivo.
- No compartir tokens, claves privadas ni credenciales.

## Estado MVP-008
- Contrato creado: `core/print/mvp-008-print-publication.contract.json`
- Test contractual: `core/print/test/print-publication.contract.test.js`
- Flujo base implementado: WeasyPrint genera PDF base A4 con fuentes incrustadas.
- Conversión a PDF/X-1a mediante Ghostscript validada.
- Pendiente: certificación externa opcional y ajustes tipográficos finos.

## Estado MVP-008

- Contrato: `core/print/mvp-008-print-publication.contract.json`
- Test contractual: `core/print/test/print-publication.contract.test.js`
- Flujo base: WeasyPrint genera PDF base A4 con fuentes incrustadas.
- Conversión: Ghostscript produce PDF/X-1a correcto.
- Validación básica: `pdfinfo` y `pdffonts` confirman A4, CMYK y fuentes embebidas.
- Pendiente opcional: certificación externa PDF/X-1a y ajustes tipográficos finos.

## Estado MVP-008

- Contrato: `core/print/mvp-008-print-publication.contract.json`
- Test contractual: `core/print/test/print-publication.contract.test.js`
- Flujo base: WeasyPrint genera PDF base A4 con fuentes incrustadas.
- Conversión: Ghostscript produce PDF/X-1a correcto.
- Validación básica: `pdfinfo` y `pdffonts` confirman A4, CMYK y fuentes embebidas.
- Pendiente opcional: certificación externa PDF/X-1a y ajustes tipográficos finos.

## Estado MVP-009 (Design System Base)

- Contrato: `core/styles/mvp-009-design-system.contract.json`
- Versión: `0.2.0-draft`
- Test contractual: `core/styles/test/design-system.contract.test.js`
- Resultado: 8/8 tests passed
- Implementación CSS: aún no iniciada
- Decisiones incorporadas de auditoría:
  - separación tokens vs perfiles de salida
  - color dual sRGB/CMYK
  - negro puro K=100% para texto de imprenta
  - unidades por medio
  - fallbacks tipográficos y line-height
  - `paged-media.css` en kebab-case
  - invariantes de no mutación del LEDM

## Estado MVP-009 (v0.3.0-draft)

- Contrato: `core/styles/mvp-009-design-system.contract.json`
- Test contractual: `core/styles/test/design-system.contract.test.js`
- Resultado: 13/13 tests passed
- Incorpora recomendaciones de segunda auditoría:
  - separación `pdf-ua` vs `print`
  - bundles CSS por perfil
  - unidades por perfil y magnitud
  - reglas editoriales de paginación
  - política de clases semánticas
  - alcance anti-scope creep
- Implementación CSS: aún no iniciada.
- No se crea tag; sigue siendo borrador.

## Estado MVP-009 (v0.3.0-draft + taxonomía)

- Contrato: core/styles/mvp-009-design-system.contract.json
- Versión: 0.3.0-draft
- Taxonomía semántica: core/styles/SEMANTIC_TAXONOMY.md
- Test contractual: 13/13 passed
- Estado: diseño y especificación contractual.
- Implementación CSS: en pausa, no iniciada.
- Próxima acción: tercera auditoría y eventual v1.0.0

### Estado MVP-009 (v0.3.0-draft + taxonomía)

- Contrato: core/styles/mvp-009-design-system.contract.json
- Versión: 0.3.0-draft
- Taxonomía semántica: core/styles/SEMANTIC_TAXONOMY.md
- Test contractual: 13/13 passed
- Estado: diseño y especificación contractual.
- Implementación CSS: en pausa, no iniciada.
- Próxima acción: tercera auditoría y eventual v1.0.0
## Estado MVP-009 (v1.0.0 congelado)

- Contrato: core/styles/mvp-009-design-system.contract.json
- Versión: 1.0.0
- Taxonomía semántica: core/styles/SEMANTIC_TAXONOMY.md
- Test contractual: 13/13 passed
- Implementación CSS: pendiente.
- Fase: contrato congelado, listo para derivar implementación.

## Integración MVP-009 en EpubGenerator

- base.css inyectado en CSS del EPUB.
- Tokens --ld-* disponibles.
- Pruebas EPUB pasando.

## Integración MVP-009 en PDFs

- HTML plano para PDF/UA.
- Bundles CSS conectados correctamente.
- Validación PDF/UA: PASS ua1.
- Pendiente validación PDF/X-1a final con Ghostscript.

## Integración MVP-009 en PDFs

- HTML plano para PDF/UA.
- Bundles CSS conectados correctamente.
- Validación PDF/UA: PASS ua1.
- Pendiente validación PDF/X-1a final con Ghostscript.

## Validación PDF/X-1a

- PDF base regenerado sin bleed/marks conflictivos.
- Conversión Ghostscript exitosa.
- Página A4, PDF 1.3.
- Pendiente confirmación de fuentes embebidas.

## Cierre experimental MVP-009 en PDFs

- PDF/UA: PASS ua1.
- PDF/X-1a: generación exitosa con Ghostscript.
- Fuentes embebidas: Noto-Serif y Noto-Serif-Bold.
- Geometría A4 correcta.
- Pendiente únicamente limpieza de advertencias MCID en revisión posterior.

## MVP-009 CERRADO

- Design System Base v1.0.0
- Integración definitiva por bundles
- v1.0.0-integration
- Nested MCID aceptado como no bloqueante

## Estado MVP-010 — Publicación y Distribución Web Automática

- Contrato: core/publishing/mvp-010-publishing.contract.json
- Versión: 0.1.0-draft
- Tests contractuales: 4/4 passed
- Tests de orquestador real: 3/3 passed
- Orquestador: scripts/publish.js
- Publicación de la Constitución: scripts/publish-constitucion.js
- Workflow de GitHub Pages: .github/workflows/pages.yml
- CI core: 151 tests passed localmente
- Estado: CI local verde, pendiente confirmación visual en Actions remoto.

## Estado MVP-011 — API de Consulta del Corpus Jurídico

- Contrato: core/api/mvp-011-api.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/api/test/mvp-011-api.contract.test.js
- Resultado: 5/5 tests passed
- Implementación del servidor HTTP: aún no iniciada
- Próxima acción: diseñar servidor API de solo lectura

## Implementación MVP-011 — API de Consulta del Corpus Jurídico

- Servidor: core/api/server.js (Express, solo lectura)
- Script: start:api
- Endpoints GET implementados:
  - /api/v1/status
  - /api/v1/index
  - /api/v1/document/:id
  - /api/v1/node/:nodeId
- Test de integración: core/api/test/mvp-011-api.server.test.js
- Resultado: 5/5 tests passed
- Persistencia: basada en indice.json y manifest.json, sin base de datos

## Implementación MVP-012 — Motor de Búsqueda Interna

- Generador de índice: scripts/build-search-index.js
- Índice: public/search-index.json
- Endpoint API: GET /api/v1/search?q=...
- Integrado en core/api/server.js
- API previa: 5/5 tests passed


## Consolidación final del ciclo de consulta

- MVP-010: Publicación y distribución automática.
- MVP-011: API de consulta de solo lectura.
- MVP-012: Motor de búsqueda interna estática.
- Estado: consolidado y etiquetado.


## Consolidación final del ciclo de consulta

- MVP-010: Publicación y distribución automática.
- MVP-011: API de consulta de solo lectura.
- MVP-012: Motor de búsqueda interna estática.
- Estado: consolidado y etiquetado.

## Estado MVP-013 — Publicación Multi-Documento Programática

- Contrato: core/multi-publish/mvp-013-multi-publish.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/multi-publish/test/mvp-013-multi-publish.contract.test.js
- Resultado: 5/5 tests passed
- Implementación: pendiente

## Implementación MVP-013 — Publicación Multi-Documento

- Orquestador: scripts/publish-multi.js
- Fixture: publicaciones/documento-a y documento-b
- Test de integración: core/multi-publish/test/multi-publish.orchestrator.test.js
- Resultado: 4/4 tests passed

## Estado MVP-014 — Catálogo y Versionado de Publicaciones

- Contrato: core/catalog/mvp-014-catalog.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/catalog/test/mvp-014-catalog.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-014 — Catálogo y Versionado

- Generador de catálogo: scripts/build-catalog.js
- Test de integración: core/catalog/test/catalog.builder.test.js
- Resultado: 3/3 tests passed
- Catálogo generado: public/catalogo.json

## Implementación MVP-015 — Control de acceso / API Keys

- Middleware de API Key en core/api/server.js
- Header: x-api-key
- Variable de entorno: LEX_API_KEY
- Respuesta 401: { error: "unauthorized" }
- Test de contrato: 4/4
- Test de middleware: 3/3

## Estado MVP-016 — Panel de Administración y Estado

- Contrato: core/admin/mvp-016-admin.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/admin/test/mvp-016-admin.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-016 — Panel de Administración y Estado

- Router de administración: core/admin/server-admin.js
- Endpoint de estado: GET /api/v1/admin/status
- Dashboard HTML: GET /admin
- Protegido por API Key
- Solo lectura, sin base de datos
- Tests: contrato 3/3, middleware 3/3


## Consolidación General MVP-010 → MVP-016

- Estado: ciclo completo cerrado.
- Validación: suite integral en verde.
- Tags individuales: publishing, api, search, multi-publish, catalog, auth, admin.
- Pendiente: tag maestro v1.0.0-consolidated-admin.

## Estado MVP-017 — Integración con Dominio Definitivo y Despliegue Público

- Contrato: core/deploy/mvp-017-deploy.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/deploy/test/mvp-017-deploy.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Estado MVP-017 — Integración con Dominio Definitivo y Despliegue Público

- Contrato: core/deploy/mvp-017-deploy.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/deploy/test/mvp-017-deploy.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-017 — Workflow de Despliegue Público

- Workflow: .github/workflows/deploy.yml
- Proveedor: GitHub Pages
- Rama: feat/mvp-004
- Directorio de artefactos: public
- Dominio configurable: digitalhd.com
- HTTPS requerido
- Despliegue estático, sin base de datos

## Cierre MVP-017 — Despliegue Público

- Workflow de GitHub Pages implementado.
- Integración con dominio configurable lista.
- HTTPS requerido por contrato.
- Estado: código completado; configuración DNS/PAGES pendiente en consola de GitHub.

## Estado MVP-018 — Registro de auditoría basado en archivos

- Contrato: core/audit/mvp-018-audit.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/audit/test/mvp-018-audit.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-018 — Registro de auditoría

- Logger: core/audit/audit-logger.js
- Formato: JSONL append-only
- Directorio: logs/audit
- API Key hasheada (SHA-256 truncado)
- Integrado en core/api/server.js
- Tests: contrato 4/4, logger 3/3

## Estado MVP-019 — Consolidación Final de Documentación

- Contrato: core/docs/mvp-019-docs.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/docs/test/mvp-019-docs.contract.test.js
- Resultado: 2/2 tests passed
- Implementación: pendiente de redacción completa del manual

## Cierre MVP-019 — Manual Operativo y Consolidación Documental

- Manual: docs/MANUAL_OPERATIVO.md
- Contrato: core/docs/mvp-019-docs.contract.json
- Test contractual: core/docs/test/mvp-019-docs.contract.test.js
- Resultado: 2/2 tests passed
- Estado: manual completo y versionado.

## Estado MVP-020 — Sitemap e indexación estática

- Contrato: core/sitemap/mvp-020-sitemap.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/sitemap/test/mvp-020-sitemap.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-020 — Sitemap e indexación estática

- Generador: scripts/build-sitemap.js
- Salidas: public/sitemap.xml y public/robots.txt
- Basado en catalogo.json
- Pruebas:
  - Contrato: 3/3
  - Builder: 2/2
- Estado: implementado y validado.

## Estado MVP-021 — API de metadatos públicos sin autenticación

- Contrato: core/public-api/mvp-021-public-api.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/public-api/test/mvp-021-public-api.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-021 — API de metadatos públicos

- Endpoints:
  - GET /api/v1/public/catalog
  - GET /api/v1/public/document/:id
- Sin autenticación, solo metadatos.
- Integrados en core/api/server.js
- Pruebas de API existentes: 17/17

## Estado MVP-022 — Healthcheck Público

- Contrato: core/health/mvp-022-health.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/health/test/mvp-022-health.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-022 — Healthcheck Público

- Endpoint: GET /api/v1/health
- Sin autenticación
- Respuesta: status, version, timestamp
- Integrado en core/api/server.js
- Pruebas de API/Auth existentes en verde

## Implementación MVP-023 — Búsqueda pública simplificada

- Endpoint: GET /api/v1/public/search?q=...
- Sin autenticación
- Consume search-index.json
- Integrado en core/api/server.js
- Pruebas de API/Auth existentes en verde

## Estado MVP-024 — API de novedades/actualizaciones

- Contrato: core/novedades/mvp-024-novedades.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/novedades/test/mvp-024-novedades.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-024 — API de novedades/actualizaciones

- Generador: scripts/build-novedades.js
- Salida: public/novedades.json
- Endpoint: GET /api/v1/public/novedades
- Orden descendente por createdAt, límite 20
- Integrado en core/api/server.js
- Pruebas de API/Auth en verde

## Estado MVP-025 — Línea de tiempo de versiones por documento

- Contrato: core/timeline/mvp-025-timeline.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/timeline/test/mvp-025-timeline.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-025 — Línea de tiempo de versiones por documento

- Generador: scripts/build-timeline.js
- Salida: public/timeline/<documentId>.json
- Endpoint: GET /api/v1/public/timeline/:documentId
- Orden ascendente por createdAt
- Integrado en core/api/server.js
- Pruebas de API/Auth en verde

## Estado MVP-026 — Feed RSS/Atom estático

- Contrato: core/feed/mvp-026-feed.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/feed/test/mvp-026-feed.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-026 — Feed RSS/Atom estático

- Generador: scripts/build-feed.js
- Salida: public/feed.xml
- Formato: RSS 2.0
- Basado en public/novedades.json
- Tests: contrato 4/4, builder 2/2


---

## Pausa de Estabilidad Definitiva — post MVP-026

- Estado: repositorio congelado en v1.0.0-feed.
- Actividad: solo documentación y auditoría externa.
- Próximo retorno: apertura de MVP-027 o ajuste externo de infraestructura.

## Estado MVP-027 — Métricas públicas de compilación

- Contrato: core/build-metrics/mvp-027-build-metrics.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/build-metrics/test/mvp-027-build-metrics.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

## Implementación MVP-027 — Métricas públicas de compilación

- Generador: scripts/build-metrics.js
- Salida: public/build-metrics.json
- Endpoint: GET /api/v1/public/build-metrics
- Basado en catalogo.json
- Pruebas de API/Auth en verde

## Cierre MVP-027 — Métricas públicas de compilación

- Generador implementado y endpoint público verificado.
- Métricas estáticas basadas en catálogo.
- Tag v1.0.0-build-metrics aplicado.

## Estado MVP-028 — Línea de tiempo global consolidada

- Contrato: core/global-timeline/mvp-028-global-timeline.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/global-timeline/test/mvp-028-global-timeline.contract.test.js
- Resultado: 5/5 tests passed
- Implementación: pendiente

## Implementación MVP-028 — Línea de tiempo global consolidada

- Generador: scripts/build-global-timeline.js
- Salida: public/global-timeline.json
- Endpoint: GET /api/v1/public/global-timeline
- Basado en public/timeline/*.json
- Pruebas de API/Auth en verde

## Estado MVP-029 — Panel público de métricas

- Contrato: core/public-metrics/mvp-029-public-metrics.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/public-metrics/test/mvp-029-public-metrics.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-029 — Panel público de métricas

- Dashboard: public/metrics.html
- Consume build-metrics.json y global-timeline.json
- Sin acceso a rutas privadas
- Pruebas: contrato 3/3, dashboard 3/3


---

## Pausa de Estabilidad Definitiva — post MVP-029

- Estado: repositorio congelado en v1.0.0-public-metrics.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-030 o ajuste de producción.

## Estado MVP-030 — Panel público de novedades en HTML

- Contrato: core/public-novedades/mvp-030-public-novedades.contract.json
- Versión: 0.1.0-draft
- Dashboard: public/novedades.html
- Consume: public/novedades.json
- Resultado: 5/5 tests passed
- Implementación: pendiente de tag final

## Estado MVP-031 — Línea de tiempo global en HTML

- Contrato: core/global-timeline-html/mvp-031-global-timeline-html.contract.json
- Versión: 0.1.0-draft
- Dashboard: public/global-timeline.html
- Consume: public/global-timeline.json
- Resultado: 5/5 tests passed

## Estado MVP-032 — Panel público de búsqueda en HTML

- Contrato: core/public-search-html/mvp-032-public-search-html.contract.json
- Versión: 0.1.0-draft
- Dashboard: public/search.html
- Consume: public/search-index.json
- Resultado: 4/4 tests passed

---

## Pausa de Estabilidad Definitiva — post MVP-032

- Estado: repositorio congelado en v1.0.0-public-search-html.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-033 o ajuste de producción.

## Estado MVP-033 — Exportación de colección pública en JSON

- Contrato: core/collection-export/mvp-033-collection-export.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/collection-export/test/mvp-033-collection-export.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente

---

## Pausa de Estabilidad Definitiva — post MVP-033

- Estado: repositorio congelado en v1.0.0-collection-export.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-034 o ajuste de producción.

## Implementación MVP-034 — Exportación de colección en CSV

- Generador: scripts/build-collection-export-csv.js
- Salida: public/collection-export.csv
- Consume: public/catalogo.json
- URLs con barra final
- Pruebas: contrato 3/3, builder 2/2

---

## Pausa de Estabilidad Definitiva — post MVP-034

- Estado: repositorio congelado en v1.0.0-collection-csv.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-035 o ajuste de producción.

## Estado MVP-035 — Panel público de búsqueda avanzada en HTML

- Contrato: core/public-search-advanced/mvp-035-public-search-advanced.contract.json
- Versión: 0.1.0-draft
- Dashboard: public/search-advanced.html
- Consume: public/search-index.json
- Filtros: documentId, versionId, text
- Resultado: 5/5 tests passed

---

## Pausa de Estabilidad Definitiva — post MVP-035

- Estado: repositorio congelado en v1.0.0-public-search-advanced.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-036 o ajuste de producción.


---

## Pausa de Estabilidad Definitiva — post MVP-035

- Estado: repositorio congelado en v1.0.0-public-search-advanced.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-036 o ajuste de producción.

## Estado MVP-036 — Exportación de colección en formato NDJSON

- Contrato: core/collection-ndjson/mvp-036-collection-ndjson.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/collection-ndjson/test/mvp-036-collection-ndjson.contract.test.js
- Resultado: 4/4 tests passed
- Implementación: pendiente


---

## Pausa de Estabilidad Definitiva — post MVP-036

- Estado: repositorio congelado en v1.0.0-collection-ndjson.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-037 o ajuste de producción.

## Estado MVP-037 — Panel público de búsqueda con relevancia

- Contrato: core/public-search-relevance/mvp-037-public-search-relevance.contract.json
- Versión: 0.1.0-draft
- Test contractual: core/public-search-relevance/test/mvp-037-public-search-relevance.contract.test.js
- Resultado: 3/3 tests passed
- Implementación: pendiente

## Implementación MVP-037 — Panel público de búsqueda con relevancia

- Generador: scripts/build-public-search-relevance.js
- Dashboard: public/search-relevance.html
- Consume: public/search-index.json
- Relevancia: frecuencia de términos, insensible a mayúsculas y acentos
- Pruebas: contrato 3/3, builder 1/1


---

## Pausa de Estabilidad Definitiva — post MVP-037

- Estado: repositorio congelado en v1.0.0-public-search-relevance.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-038 o ajuste de producción.

## Implementación MVP-038 — Panel público de exportaciones

- Generador: scripts/build-public-exports.js
- Dashboard: public/exports.html
- Centraliza: JSON, CSV, NDJSON, feed, sitemap, build-metrics
- Pruebas: contrato 4/4, builder 1/1


---

## Pausa de Estabilidad Definitiva — post MVP-038

- Estado: repositorio congelado en v1.0.0-public-exports.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-039 o ajuste de producción.

## Implementación MVP-039 — Panel público de colección

- Generador: scripts/build-public-collection.js
- Dashboard: public/collection.html
- Consume: public/collection-export.json
- Pruebas: contrato 3/3, builder 1/1


---

## Pausa de Estabilidad Definitiva — post MVP-039

- Estado: repositorio congelado en v1.0.0-public-collection.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-040 o ajuste de producción.

## Implementación MVP-040 — Panel público de navegación

- Generador: scripts/build-public-nav.js
- Dashboard: public/nav.html
- Centraliza enlaces a todos los dashboards públicos
- Pruebas: contrato 3/3, builder 1/1


---

## Pausa de Estabilidad Definitiva — post MVP-040

- Estado: repositorio congelado en v1.0.0-public-nav.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-041 o ajuste de producción.

## Implementación MVP-041 — Panel público de portada (Home estático)

- Generador: scripts/build-public-home.js
- Dashboard: public/index.html
- Integra navegación y métricas resumidas
- Pruebas: contrato 4/4, builder 1/1


---

## Pausa de Estabilidad Definitiva — post MVP-041

- Estado: repositorio congelado en v1.0.1-public-home.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en digitalhd.com.
- Próximo retorno: apertura de MVP-042 o ajuste de producción.


---

## Ajuste de producción post MVP-041

- Dominio personalizado: https://www.lexdigitalhd.com
- DNS CNAME: hernandario1957.github.io
- HTTPS: operativo
- Apex redirige a www mediante 301
- Core sin cambios


---

## Cierre MVP-042 — Validador de integridad de artefactos públicos

- Contrato: core/integrity/mvp-042-integrity.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Reporte: public/integrity-report.json
- Endpoint: GET /api/v1/public/integrity


---

## Cierre MVP-043 — Panel público de integridad y auditoría

- Contrato: core/public-integrity/mvp-043-public-integrity.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Dashboard: public/integrity.html
- Enlace añadido en public/nav.html


---

## Cierre MVP-044 — Panel público de estado del despliegue

- Contrato: core/deploy-status/mvp-044-deploy-status.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Dashboard: public/deploy-status.html
- Endpoint: GET /api/v1/public/deploy-status


---

## Cierre MVP-045 — Validador de enlaces externos en artefactos públicos

- Contrato: core/external-links/mvp-045-external-links.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Reporte: public/external-links-report.json
- Endpoint: GET /api/v1/public/external-links


---

## Cierre MVP-046 — Panel público de enlaces externos

- Contrato: core/public-external-links/mvp-046-public-external-links.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Dashboard: public/external-links.html
- Enlace añadido en public/nav.html


---

## Apertura MVP-047 — Validador de anclas internas en artefactos públicos

- Contrato: core/anchors/mvp-047-anchors.contract.json
- Versión: 0.1.0-draft
- Test contractual: 6/6 passed
- Estado: contrato creado, implementación pendiente
- Pausa de estabilidad suspendida temporalmente.

## Estado MVP-047 — Anchors

- Contrato: core/anchors/mvp-047-anchors.contract.json
- Versión: 0.1.0-draft → 1.0.0
- Test contractual: 6/6 passed
- Generador: scripts/build-anchors.js
- Salida: public/anchors.json
- Endpoint público: GET /api/v1/public/anchors (pendiente de integrar)
- Estado: implementado y validado

## Estado MVP-047 — Anchors

- Contrato: core/anchors/mvp-047-anchors.contract.json
- Versión: 0.1.0-draft → 1.0.0
- Test contractual: 6/6 passed
- Generador: scripts/build-anchors.js
- Salida: public/anchors.json
- Endpoint público: GET /api/v1/public/anchors (pendiente de integrar)
- Estado: implementado y validado


---

## Cierre MVP-049 — Endpoint de resumen ejecutivo de auditoría

- Contrato: core/audit-summary/mvp-049-audit-summary.contract.json
- Versión: 1.0.0
- Test contractual: 6/6 passed
- Test del generador: 4/4 passed
- Estado: implementado y validado
- Resumen: public/audit-summary.json
- Endpoint: GET /api/v1/public/audit-summary


---

## Pausa de Estabilidad Definitiva — post MVP-049

- Estado: repositorio congelado en v1.0.0-audit-summary.
- Actividad permitida: solo auditoría externa y configuración de infraestructura.
- Pendientes externos: DNS, HTTPS, despliegue en www.lexdigitalhd.com.
- Próximo retorno: apertura de MVP-050 o ajuste de producción.
