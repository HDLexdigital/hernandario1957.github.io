# LexDigitalHD — Continuous Integration (CI)

Este documento define la política de validación automatizada para el core de LexDigitalHD.

## Infraestructura
El pipeline se ejecuta mediante GitHub Actions sobre un entorno `ubuntu-latest`, garantizando compatibilidad con el entorno de producción proyectado (Linux Mint).

## Criterios de Validación (MVP-005)
Cada push o pull request debe superar los siguientes bloqueos de calidad antes de ser integrado:

1. **Integridad Contractual (Jest):** Ejecución de la suite completa (`npm run test:all`), garantizando cero pérdida estructural entre CIDM y LEDM.
2. **Auditoría de Accesibilidad (axe-core):** Validación en memoria mediante JSDOM de todos los bloques XHTML extraídos, exigiendo **0 violaciones críticas o serias** bajo WCAG 2.2 AA.
3. **Certificación de Formato (EPUBCheck):** Validación formal del artefacto binario (`publication_full.epub`) para asegurar un parseo perfecto en lectores estándar.

## Comandos Locales
Para replicar el entorno de CI en tu máquina antes de hacer push, ejecuta:
```bash
npm run ci:all