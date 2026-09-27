# LexDigital Pipeline v2.0

Pipeline editorial y servidor autónomo HTTP REST y WebSocket para procesamiento, normalización y compilación de documentos normativos y jurídicos.

## Características Principales

- **Motor Autónomo de Compilación (`core/`):** Tubería editorial modular en 4 fases (Validación sintáctica, Clasificación jurídica GREP, Construcción XHTML y Post-procesamiento DOM).
- **Servidor Dual HTTP & WebSocket:**
  - Servidor web estático que expone la UI del Panel de Control (`public/index.html`).
  - Endpoint REST `POST /api/pipeline/procesar-json` con salida a XHTML, JSON o PDF.
  - Endpoint WebSocket bidireccional (`ws://127.0.0.1:8765`) con actualización de progreso en tiempo real.
- **Soporte Multiplataforma:** Rutas relativas y configurables mediante variables de entorno y `config.json` (100% compatible con Linux y Windows).
- **Soporte de Codificación Avanzado:** Detección automática y limpieza de UTF-8, UTF-16LE, UTF-16BE y BOM.
- **Suite de Pruebas Automatizadas:** 100% de tests unitarios y de integración pasando con Jest.

---

## Estructura del Repositorio

```text
LexDigital-Pipeline/
├── config.json                 # Configuración de red, rutas y timeouts
├── server.js                   # Servidor Express HTTP y WebSocket
├── index.js                    # Punto de entrada exportable de la librería
├── cli.js                      # Compilación rápida por terminal
├── procesar.js                 # Procesador por lotes e individual de archivos
├── watcher-ipc.js              # Puente IPC con Adobe InDesign (UXP)
├── watcher-automatico.js       # Watcher de auto-compilación para InDesign
├── core/                       # Motor canónico del Pipeline
│   ├── index.js                # Orquestador del pipeline (compilarLexmotor)
│   ├── jsonEditorialAdapter.js # Adaptador InDesign -> Modelo normativo
│   ├── auditarCSS.js           # Auditor de integridad CSS
│   ├── verificadorFidelidad.js # Verificador de conservación de propiedades
│   ├── core/                   # Clasificadores, constructores y motor GREP
│   ├── utils/                  # textUtils, cssPurifier, metricas, logger
│   └── assets/                 # Hojas de estilo canónicas (Lexdigital_Modular.css)
├── public/                     # Interfaz web del Panel de Control
├── test/                       # Suites de pruebas Jest (unitarias y de integración)
└── uxp-client/                 # Manifiesto y scripts cliente para Adobe InDesign UXP
```

---

## Instalación y Configuración

```bash
# Instalar dependencias
npm install
```

### Configuración de Entorno (Opcional)
Se pueden sobrescribir los valores por defecto de `config.json` mediante variables de entorno:
- `PORT`: Puerto del servidor HTTP/WS (por defecto: `8765`).
- `HOST`: Host de enlace (por defecto: `127.0.0.1`).
- `LEXMOTOR_SALIDA_XHTML`: Directorio de salida para archivos `.xhtml`.
- `LEXMOTOR_SALIDA_JSON`: Directorio de salida para archivos `.json`.

---

## Comandos Disponibles

```bash
# Iniciar servidor de producción
npm start

# Iniciar servidor en modo desarrollo (recarga automática con Node.js watch)
npm run dev

# Ejecutar la suite completa de pruebas unitarias e integración
npm test

# Compilar un documento directamente por terminal
npm run cli -- ruta/a/documento.txt

# Procesar y compilar archivos JSON, Markdown o texto plano
npm run procesar -- ruta/a/documento.json

# Iniciar el puente IPC con InDesign UXP
npm run watcher
```

---

## Endpoints de la API REST

- `GET /api/status`: Verifica el estado de salud, uptime y rutas activas del pipeline.
- `POST /api/pipeline/procesar-json`:
  - **Payload:**
    ```json
    {
      "datos": {
        "documento": { "titulo": "Ley 100 de 1993" },
        "contenido": [
          { "tipo": "P02_TITLE_MAIN", "texto": "LEY 100 DE 1993" },
          { "tipo": "P01_BODY_BASE", "texto": "Artículo 1. Sistema General de Seguridad Social." }
        ]
      },
      "outputFormat": "xhtml" // Opciones: "xhtml", "json", "pdf"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "success": true,
      "mensaje": "Compilación completada exitosamente en formato XHTML",
      "archivoSalida": "/ruta/a/salidas/xhtml/Ley_100_de_1993.xhtml",
      "formato": "xhtml",
      "bytes": 8340
    }
    ```
