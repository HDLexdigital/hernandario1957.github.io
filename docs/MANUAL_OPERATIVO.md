# Manual Operativo — LexDigitalHD 2.0

## 1. Introducción
LexDigitalHD 2.0 es un sistema de compilación editorial que transforma documentos jurídicos desde Adobe InDesign a formatos digitales accesibles (HTML, EPUB, PDF/UA, XHTML). Este manual describe el uso del pipeline IPC y la interfaz gráfica.

## 2. Requisitos previos
- Linux Mint o equivalente
- Node.js 20.x
- npm 10.x
- Electron 31.x
- Git configurado

## 3. Instalación
git clone git@github.com:HDLexdigital/hernandario1957.github.io.git
cd hernandario1957.github.io
npm ci

## 4. Arranque del pipeline
Modo manual:
  node src/core/server.js

Como servicio systemd:
  systemctl --user start lexdigital-watchdog.service

## 5. Uso de la interfaz Electron
Abrir:
  npm run procesar:ui

Pasos:
1. Seleccionar un documento.
2. Pulsar OK.
3. Observar el log en vivo (SSE).
4. Guardar log si se desea.

Estado final esperado: Proceso finalizado con código 0.

## 6. Endpoints
- GET  /health
- POST /build
- GET  /build-stream (SSE)
- POST /render

## 7. Flujo de compilación
1. Selección de documento.
2. Ejecución del build público.
3. Generación de artefactos.
4. Validación de integridad.
5. Estado final OK.

## 8. Diagnóstico
  systemctl --user status lexdigital-watchdog.service
  journalctl --user -u lexdigital-watchdog.service -f
  cat public/integrity-report.json

## 9. Recuperación
- Reiniciar servicio:
    systemctl --user restart lexdigital-watchdog.service
- Liberar puerto 8765:
    fuser -k 8765/tcp
- Revisar integridad:
    cat public/integrity-report.json

## 10. Referencias
- ROADMAP.md
- docs/PROJECT_STATE.md
- docs/auditorias/
- src/core/server.js
- scripts/ui/
- scripts/build-public.js


---

## 11. Arquitectura modular consolidada (MVP-053)

A partir de v1.0.2-modular-consolidated, la logica canonica vive en src/core/.

### Estructura

src/core/
- compiladores/     Logica de compilacion
  - catalogo.js
  - timeline.js
  - metricas.js
  - global-timeline.js
  - exports.js
  - novedades.js
  - feed.js
  - sitemap.js
  - search-index.js
  - web.js
  - dashboards/   15 paneles publicos
  - pdf/          3 modulos PDF
- constructores/    XHTML, EPUB, notas
- validators/       Integridad, E18-E26, schemas
- utils/            Utilidades compartidas

### Wrappers

Los scripts en scripts/build-*.js son wrappers delgados.
Solo delegan en src/core/compiladores/ y no contienen logica sustantiva.

## 12. Test de unicidad

El test core/mvp-053/test/mvp-053-unicidad.test.js verifica que:

- Los wrappers en scripts/ importan desde src/core/.
- No contienen fs.readFileSync, fs.writeFileSync, JSON.parse ni JSON.stringify.

Si falla, indica que hay logica sustantiva en un wrapper que debe migrarse al core.

## 13. Auditoria MVP-053

- Reporte: docs/auditorias/mvp-053-audit-response.md
- Veredicto: APTO CON OBSERVACIONES
- Hallazgos: fachada, BOM centralizado, AST en test
- Plan: MVP-054-FIX tras la pausa

