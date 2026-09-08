# Arquitectura y Funcionamiento General del Compilador LexDigitalHD
**Estado:** 🟢 CERTIFIED / FROZEN (Baseline E18–E26 + Régimen Operacional O1–O6)  
**Dominio:** Procesamiento automatizado de textos jurídicos y maquetación editorial estructurada (Adobe InDesign / EPUB3 / PDF / XHTML)  
**Sistemas Operativos Compatibles:** Windows 11 (Desarrollo) ➔ Linux Mint (Producción)

---

## 1. Visión General: ¿Qué es el Compilador LexDigitalHD?

El compilador de LexDigitalHD no es un procesador de textos tradicional ni un script de maquetación visual. Es un **sistema determinista y auditable de compilación editorial**, diseñado específicamente para transformar textos normativos crudos (como la *Constitución Política de Colombia* o códigos sustantivos) en artefactos de publicación profesional altamente estructurados (INDD, PDF, EPUB3, XHTML).

Su principio rector es la **soberanía de la evidencia**: el compilador no solo produce un archivo visualmente correcto, sino que genera una **cadena de custodia criptográfica** que demuestra matemáticamente por qué cada elemento tipográfico, salto de página, sangría y estructura semántica fue colocado exactamente donde se encuentra.

---

## 2. Diagrama Arquitectónico del Pipeline

```text
 ╔════════════════════════════════════════════════════════════════╗
 ║                CORPUS JURÍDICO CRUDO (Entrada)                 ║
 ╚════════════════════════════════════════════════════════════════╝
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASES E18–E23: SEMANTIC TRUTH & AST                           ║
 ║  • Parsing normativo (Artículos, numerales, literales)         ║
 ║  • Construcción del Árbol de Sintaxis Abstracta (AST)          ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASE E24: ORCHESTRATION & PROJECTION PLAN                     ║
 ║  • Cálculo de estrategias de paginación y flujos tipográficos  ║
 ║  • Emisión de Job & Execution Identities (O1.2)                ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASE E25: PHYSICAL RENDERING (Adobe InDesign / UXP)           ║
 ║  • Ejecución de comandos IPC y mutación de recursos físicos    ║
 ║  • Aplicación de estilos de párrafo, carácter y cajas de texto   ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASE E25.8: READ-BACK & INSPECTION                            ║
 ║  • Lectura de control posterior del estado físico real         ║
 ║  • Verificación de overset, saltos de marco y geometría        ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASES E26.1–E26.7: GOVERNANCE & CERTIFICATION                 ║
 ║  • Validación multi-formato (EPUB3 / PDF / WCAG Accesibilidad) ║
 ║  • Emisión de Release Gates y ProductionCorpusCertificate      ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ┌────────────────────────────────────────────────────────────────┐
 ║  FASE O1.1: EVIDENCE PERSISTENCE ENGINE                        ║
 ║  • Normalización de rutas canónicas (Windows 11 ➔ Linux Mint)  ║
 ║  • Escritura atómica (.tmp ➔ Sello SHA-256 ➔ Rename Read-Only) ║
 └──────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
 ╔════════════════════════════════════════════════════════════════╗
 ║          REPOSITORIO DE EVIDENCIA SOBERANA & PRODUCCIÓN        ║
 ╚════════════════════════════════════════════════════════════════╝