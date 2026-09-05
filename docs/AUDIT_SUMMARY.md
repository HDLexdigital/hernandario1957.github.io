# Resumen de Auditoría — LexDigitalHD 2.0

## 1. Contexto

LexDigitalHD es un motor editorial jurídico que parte de un modelo semántico central (LEDM 2.0) para generar publicaciones en múltiples formatos: HTML, EPUB y PDF.

Actualmente el desarrollo se realiza en Linux Mint para el core, mientras que Windows 11 se reserva exclusivamente para Adobe InDesign/extracción.

Este documento resume el estado del proyecto para fines de auditoría externa.

---

## 2. Estado general

| MVP | Título | Estado |
|---|---:|---|
| MVP-001 | CIDM 1.0 | ✅ Cerrado |
| MVP-002 | LEDM 2.0 | ✅ Cerrado |
| MVP-003 | Semantic Compiler | ✅ Cerrado |
| MVP-004 | Constitución completa + EPUB | ✅ Cerrado |
| MVP-005 | CI/CD + EPUBCheck + axe-core | ✅ Cerrado |
| MVP-006 | Publicación Web | ✅ Cerrado |
| MVP-007 | PDF Accesible PDF/UA-1 | ✅ Cerrado |
| MVP-008 | Print-Ready PDF PDF/X-1a | ✅ Cerrado |
| MVP-009 | Design System Base | 📋 Propuesto |

---

## 3. Decisiones arquitectónicas vigentes

- Linux Mint como entorno principal del core.
- Windows 11 solo para InDesign/extracción.
- WeasyPrint como motor PDF base.
- Economía monetaria considerada **restricción temporal**.
- Ghostscript como herramienta de conversión a PDF/X-1a.
- Contratos por MVP antes de implementar.
- Separación estricta entre estructura semántica y presentación visual.
- Este chat principal es la fuente final de acciones definitivas.

---

## 4. Evidencias técnicas alcanzadas

### MVP-006 — Web

- `npm run ci:web` en verde.
- 25 pruebas de contrato y renderizado aprobadas.
- HTML semántico con `nodeId` canónicos y navegación interna.
- Build reproducible: `npm run build:web`.

### MVP-007 — PDF Accesible

- PDF generado con WeasyPrint: 290 páginas A4.
- `Tagged: yes`, `Metadata Stream: yes`.
- Validación final con veraPDF CLI 1.30.1:
  - `PASS ua1`
- `npm run ci:pdf` en verde.
- Fidelidad textual casi exacta:
  - LEDM: 512.680 caracteres
  - PDF extraído: 512.673 caracteres
  - Única diferencia: 1 guion decorativo

### MVP-008 — Print-Ready PDF

- PDF base generado con WeasyPrint:
  - A4 correcto
  - Fuentes `Noto-Serif` y `Noto-Serif-Bold` incrustadas
- Conversión a PDF/X-1a con Ghostscript:
  - PDF versión 1.3
  - Página A4
  - Fuentes incrustadas
  - CMYK configurado
- Tamaño final: 580 KB para 290 páginas
- `npm run ci:print` en verde

---

## 5. Contratos y pruebas

| Contrato | Ruta | Prueba |
|---|---|---|
| Web Publication | `core/web/mvp-006-web-publication.contract.json` | `core/web/test/` |
| PDF Accessible | `core/pdf/mvp-007-pdf-publication.contract.json` | `core/pdf/test/` |
| Print-Ready PDF | `core/print/mvp-008-print-publication.contract.json` | `core/print/test/` |

---

## 6. Pendientes y riesgos

### Pendientes

- Certificación externa PDF/X-1a opcional.
- Ajustes tipográficos finos para imprenta.
- Definición formal de MVP-009 Design System Base.
- Posible evaluación futura de Prince si la economía lo permite.

### Riesgos identificados

- Dependencia de Python y bibliotecas nativas para WeasyPrint.
- Ghostscript no certifica PDF/X-1a por sí solo; solo valida criterios mínimos.
- Diferencias visuales finas frente a InDesign.
- Necesidad de mantener scripts multiplataforma si alguien vuelve a Windows.

---

## 7. Reglas para auditoría

- No pedir credenciales, tokens ni claves privadas.
- No modificar código directamente.
- Toda acción definitiva nace del chat principal.
- Las observaciones se reciben como insumo, no como control.
- Si se propone un cambio, debe evaluarse contra:
  - contratos existentes
  - reproducibilidad
  - compatibilidad Linux
  - economía vigente

---

## 8. Documentos relevantes

- `ROADMAP.md`
- `docs/PROJECT_STATE.md`
- `docs/LINUX_ENVIRONMENT.md`
- `docs/MVP008_CONTRACT_REQUIREMENTS.md`
EOF

# 2. Verificar que solo se añade el resumen
git add docs/AUDIT_SUMMARY.md
git status --short
git diff --cached --name-only

## MVP-009 — Design System Base

- Estado: borrador `v0.3.0-draft` validado (13/13 tests).
- Taxonomía semántica definida.
- Implementación CSS pendiente.
- No congelado a `v1.0.0`.
## Orquestador MVP-010 — Advertencia Ghostscript

- TrimBox/BleedBox: Ghostscript revierte a PDF normal.
- No bloquea la distribución programática.
- La conformidad estricta PDF/X-1a sigue siendo responsabilidad de MVP-008.

## MVP-010 — Publicación y Distribución Web Automática

- Contrato validado: 0.1.0-draft.
- Orquestador real implementado.
- Artefactos generados: Web, EPUB, PDF/UA y PDF/X-1a.
- Manifiesto e índice generados con checksums.
- Workflow de GitHub Pages preparado.
- Nota: advertencia de Ghostscript sobre TrimBox/BleedBox documentada como no bloqueante.
