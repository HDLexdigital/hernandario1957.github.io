# Gobernanza del Proyecto — LexDigitalHD 2.0

## 1. Principio base

LexDigitalHD 2.0 es un proyecto de automatización editorial dirigido por un diseñador profesional de InDesign, asistido por agentes IA con roles complementarios.

El objetivo no es acumular código, sino **traducir la calidad editorial profesional a un sistema automatizado, estable y multiplataforma**, con Linux Mint como entorno principal de ejecución.

## 2. Roles reales

| Rol | Agente | Autoridad |
|-----|--------|-----------|
| Diseño editorial | Humano (Hernán) | Criterio profesional final |
| Ejecución | Humano | Terminal real, Windows y Linux Mint |
| Decisión arquitectónica IA | DeepSeek (modo experto) | Última palabra entre agentes IA |
| Auditoría principal | ChatGPT | Auditor de referencia (limitado por plan free) |
| Auditoría secundaria | Gemini PRO | Auditor complementario |

## 3. Regla operativa

> DeepSeek propone. Tú ejecutas. ChatGPT audita (hasta donde puede). Gemini PRO complementa. El repositorio registra.

## 4. Reglas específicas

1. Toda decisión de DeepSeek debe quedar registrada en el repositorio.
2. Cuando ChatGPT se agota (plan free), Gemini PRO cubre sin perder contexto.
3. El criterio editorial es siempre humano.
4. La ejecución en terminal es siempre humana.
5. Nada se compila sin validación editorial previa.
6. Toda decisión relevante se documenta en `docs/PROJECT_STATE.md`.
7. La pausa de estabilidad no se levanta sin razón concreta.
8. El objetivo no es más código, es más calidad editorial automatizada.

## 5. Fases del flujo editorial

### Fase A — Extracción (Windows + InDesign + Plugin UXP)

- Humano: abre InDesign, ejecuta el plugin, valida.
- ChatGPT: coordina y documenta.
- Gemini PRO: explora alternativas del flujo.
- DeepSeek: audita el JSON generado.

### Fase B — Conversión (Windows o Linux)

- Humano: convierte CIDM a LEDM.
- DeepSeek: verifica estructura.
- ChatGPT: documenta el paso.

### Fase C — Compilación (Linux Mint)

- Humano: ejecuta `npm run build:public` o `npm run procesar:ui`.
- DeepSeek: verifica integridad.
- ChatGPT: audita resultado.
- Gemini PRO: propone mejoras.

### Fase D — Publicación (Cloudflare Pages)

- Humano: autoriza el despliegue.
- ChatGPT: documenta el estado público.
- DeepSeek: verifica consistencia con el baseline.

## 6. Reglas de decisión

- **Propuesta:** cualquier agente IA puede proponer.
- **Validación:** ChatGPT o Gemini PRO auditan.
- **Decisión final entre agentes IA:** DeepSeek.
- **Decisión final del proyecto:** humano.
- **Ejecución:** humano.
- **Registro:** repositorio Git.

## 7. Reglas de pausa de estabilidad

- El repositorio puede congelarse en cualquier baseline.
- Durante la pausa, solo se permite:
  - Auditoría.
  - Documentación.
  - Configuración de infraestructura.
- No se levanta la pausa para "pagar deuda" de manera preventiva.
- Se levanta solo por:
  - Incidente real de producción.
  - Necesidad concreta de funcionalidad.
  - Integración con InDesign/UXP.

## 8. Objetivo editorial

Replicar, sobre Linux Mint, la calidad profesional que InDesign permite en Windows, sin perder criterio editorial humano y sin depender de herramientas propietarias para la operación diaria.

## 9. Objetivo técnico

Mantener un núcleo modular, auditable y documentado, con:

- Compiladores canónicos en `src/core/compiladores/`.
- Wrappers delgados en `scripts/`.
- Test de unicidad automatizado.
- Suite completa en verde antes de cualquier cierre.

## 10. Objetivo humano

Reducir la carga cognitiva del integrador humano:

- Menos decisiones repetitivas.
- Más claridad sobre qué agente decide qué.
- Menos pérdida de contexto entre hilos.
- Más foco en criterio editorial.

