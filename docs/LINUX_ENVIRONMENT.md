# Entorno Linux Mint — LexDigitalHD

A partir de v0.3.x, el pipeline de compilación es multiplataforma.
La migración elimina la dependencia de PowerShell y centraliza la orquestación en Node.js.

## Requisitos

- Linux Mint
- Node.js 20.x
- npm 10.x
- Java JRE 17
- unzip
- git

## Comandos principales

| Acción | Comando |
| --- | --- |
| Instalar dependencias | npm ci |
| Auditoría arquitectónica | npm run audit:core |
| Tests del core | npm run test:core:all |
| Validación EPUB | npm run ci:epub |
| Build web estático | npm run build:web |
| Tests web | npx jest core/web/test --runInBand |
| Flujo completo | npm run ci:all |

## Artefactos fuera de Git

node_modules/
public/
coverage/
epubcheck-5.2.1/
*.epub
*.zip
*.log

## Criterio de reproducibilidad

npm ci
npm run ci:all