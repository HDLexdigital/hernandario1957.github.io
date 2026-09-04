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
