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
