cat << 'EOF' > docs/contracts/c01-03/C01-03-CONTRACT-001.md
# C01-03-CONTRACT-001 — Proyección UI de Estados Documentales

**Versión:** 0.3.0-draft
**Estado:** PROPUESTO PARA REVISIÓN — NO APROBADO
**Tipo:** Contrato de proyección semántica UI

**Dependencias:**
* C01-02-DATA-001 — Estado documental
* C01-02-CONTRACT-002 — Matriz de afirmaciones públicas y evidencia
* C01-02-CONTRACT-003 — Taxonomía de vigencia jurídica
* C01-02-CONTRACT-004 — Procedencia y región
* C01-02-SCHEMA-005 — Integración de vigencia jurídica
* C01-02-DESIGN-ACCESSIBILITY — Presentación accesible de estados documentales

---

## 1. Propósito
Garantizar que la interfaz de usuario de LexDigitalHD actúe como un proyector pasivo, determinista y restrictivo de estados contractuales previamente establecidos.
Este contrato define las reglas de traducción entre los estados contractuales y su representación: textual, semántica, accesible, visual y de capacidades autorizadas.
La interfaz no determina estados jurídicos, epistemológicos ni de procedencia. Tampoco puede aumentar, deducir, suavizar ni sustituir la certeza establecida por los contratos de dominio.

---

## 2. Principio epistemológico fundamental
Toda proyección UI debe respetar:
`certeza(UI) <= certeza(dato contractual) <= certeza(evidencia)`

La UI representa estados ya establecidos. No constituye, genera ni sustituye evidencia. No convierte una observación técnica en una afirmación jurídica o institucional, ni puede presentar como hecho una condición que no haya sido establecida por el contrato correspondiente.

---

## 3. Flujo contractual
La arquitectura debe mantener explícitamente esta separación:

```text
evidencia
    ↓
determinación contractual
    ↓
estado contractual
    ↓
ProjectionInput
    ↓
adaptador de proyección UI
    ↓
ProjectionOutput
    ↓
configuración UI
    ↓
Astro / DOM
