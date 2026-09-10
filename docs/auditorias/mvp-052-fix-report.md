# Reporte de Cierre de Auditoría: MVP-052-FIX

**Fecha de cierre:** 2026-09-10
**Tag:** v1.0.1-pipeline-hardened
**Decisión:** PASS / CLOSED

## 1. Contexto

Resolución de vulnerabilidades detectadas en el pipeline IPC de LexDigitalHD durante la evaluación externa de la arquitectura asíncrona. El FIX no introduce nuevas funcionalidades; endurece las garantías operacionales del IPC existente.

## 2. Matriz de Riesgos Mitigados

| Riesgo | Mitigación | Fase |
|--------|-----------|------|
| Inyección de BOM en JSON | Limpieza explícita en /render y Watchdog | 1, 2 |
| Condiciones de carrera I/O | Renombrado atómico .tmp → .json | 2, 3 |
| Procesos huérfanos | Shutdown centralizado con SIGINT/SIGTERM | 3 |
| Concurrencia en /build | Lock buildEnCurso con respuesta 409 | 1 |
| Lifecycle SSE no idempotente | Función finalizar() única | 1 |
| Falta spawn('error') | Handler explícito | 1 |
| CORS * | Restringido a http://127.0.0.1:8765 | 1 |
| Payload ilimitado en /render | MAX_BODY_SIZE_BYTES con 413 | 1 |
| JSON inválido → 500 | Separación semántica 400/500 | 1 |
| execSync sin timeout | WATCHDOG_TIMEOUT_MS = 30000 | 2 |
| Shell arbitrario en Watchdog | Whitelist de operaciones | 2 |
| Escritura heartbeat no atómica | .tmp → rename | 3 |
| Heartbeat tardío | Primer latido inmediato | 3 |
| Falta de estado forense | Política B: STOPPED atómico | 3 |

## 3. Evidencia de Pruebas

### Fase 1 — server.js
- /health sin integridad: OK
- /build simultáneo: segundo devuelve 409
- /render con body 6 MB: 413
- /render con JSON inválido: 400
- /render con LEDM inválido: 400
- CORS restringido: OK

### Fase 2 — watchdog.js
- Request válido build:public: procesado
- Request con BOM: procesado
- Operación no permitida rm -rf /: rechazado
- JSON inválido: rechazado
- UTF-8 en salida: OK

### Fase 3 — heartbeat.js
- Primer latido inmediato: OK
- Estado ALIVE con PID correcto: OK
- Escritura atómica: OK
- SIGTERM → estado STOPPED con mismo PID: OK
- Shutdown centralizado: OK
- Sin procesos huérfanos: OK

## 4. Lifecycle SSE

Estados: STARTED → RUNNING → FINISHED | FAILED | TERMINATED
Garantía: exactamente una transición terminal por sesión.

## 5. Shutdown

SIGINT/SIGTERM
  → detenerHeartbeat() → STOPPED atómico
  → detenerWatchdog() → clearInterval
  → server.close() → exit(0)

## 6. Conclusión

El núcleo IPC queda oficialmente apto y estable para iniciar la refactorización modular (MVP-053).

Decisión final: PASS / CLOSED.
