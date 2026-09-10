# Auditoría técnica — Pipeline IPC LexDigitalHD 2.0 (MVP-052)

## Contexto

LexDigitalHD 2.0 es un sistema de compilación editorial que transforma documentos jurídicos desde InDesign hacia formatos digitales accesibles. El proyecto sigue una metodología estricta de contratos, implementación, auditoría, documentación y validación.

## Objetivo de la auditoría

Evaluar la solidez arquitectónica del pipeline IPC recién implementado y validado en entorno nativo Linux Mint.

## Componentes a auditar

### 1. Servidor HTTP (`src/core/server.js`)
- Escucha en `127.0.0.1:8765`.
- Endpoints: `/health`, `/build`, `/build-stream`.
- Cabeceras CORS abiertas (`Access-Control-Allow-Origin: *`).
- Uso de `spawn` para streaming en vivo (SSE).
- Limpieza de procesos huérfanos al cerrar conexión (`req.on('close')`).

### 2. Heartbeat (`src/core/heartbeat.js`)
- Intervalo: 3 s.
- Escribe `~/.lexdigital/active-ipc-root.json`.
- Contiene `pid`, `timestamp`, `status`.

### 3. Watchdog (`src/core/watchdog.js`)
- Observa `ipc/requests/`.
- Procesa archivos `request-*.json`.
- Ejecuta comandos con `execSync`.
- Escribe `ipc/responses/response-*.json`.
- Elimina el request tras procesarlo.

### 4. Interfaz Electron (`scripts/ui/`)
- `main.js`: ventana nativa, IPC entre renderer y main.
- `preload.js`: expone `listarDocumentos`.
- `index.html`: usa `EventSource` contra `/build-stream`.
- Log en vivo con auto-scroll.

### 5. Script de build (`scripts/build-public.js`)
- Orquesta catálogo, métricas, timelines, exportaciones y dashboards.
- Valida integridad final.

## Preguntas clave para el auditor

1. ¿El uso de `spawn` y SSE es robusto frente a builds largos o fallidos?
2. ¿La limpieza con `req.on('close')` previene correctamente procesos huérfanos?
3. ¿El diseño del Watchdog basado en archivos es seguro frente a condiciones de carrera?
4. ¿El Heartbeat cumple con su propósito de detectar bloqueos silenciosos?
5. ¿Hay riesgo de inyección de BOM o caracteres invisibles en los logs o archivos generados?
6. ¿Las cabeceras CORS amplias representan un riesgo real dado que escucha solo en `127.0.0.1`?
7. ¿Qué mejoras recomendarías antes de exponerlo como base para MVP-053?

## Entregables esperados

- Diagnóstico de robustez.
- Lista priorizada de riesgos.
- Recomendaciones concretas de mejora.
- Veredicto: apto / apto con observaciones / no apto.
