# Manual Operativo del Pipeline LexDigitalHD

Version: 1.0
Fecha: 2026-09-10

## 1. Arquitectura

Pipeline que procesa documentos juridicos desde JSON hasta artefactos publicos.

Flujo:
1. Interfaz Electron lista documentos.
2. Usuario selecciona documento y hace clic en OK.
3. Servidor ejecuta npm run build:public.
4. Log se transmite en vivo via SSE.
5. Se consulta integridad en public/integrity-report.json.
6. Interfaz muestra estado OK o ERROR.

## 2. Componentes

- Servidor HTTP: src/core/server.js puerto 8765
- Heartbeat: src/core/heartbeat.js cada 3 segundos
- Watchdog: src/core/watchdog.js
- Compiladores: src/core/compiladores/
- Validadores: src/core/validators/
- Constructores: src/core/constructores/
- Utilidades: src/core/utils/

## 3. Interfaz Electron

Ejecutar: npm run procesar:ui

Uso:
1. Seleccionar documento.
2. Clic en OK.
3. Observar log en vivo.
4. Verificar estado final.

## 4. Servicio systemd

Crear archivo ~/.config/systemd/user/lexdigital-watchdog.service

Contenido:
[Unit]
Description=LexDigitalHD IPC Watchdog
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/donache/hernandario1957.github.io
ExecStart=/usr/bin/env node src/core/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target

Activar:
systemctl --user daemon-reload
systemctl --user enable lexdigital-watchdog.service
systemctl --user start lexdigital-watchdog.service

## 5. Endpoints

- GET /health
- GET /modular
- POST /build
- GET /build-stream

## 6. Diagnostico

- systemctl --user status lexdigital-watchdog.service
- journalctl --user -u lexdigital-watchdog.service -f
- ss -ltnp | grep 8765
- cat public/integrity-report.json
- npm run build:public

## 7. Solucion de problemas

- 522 en dominio: registrar Custom Domain en Pages
- Certificado no valido: chronyc makestep
- Error CORS: anadir cabecera en server.js
- Build falla: ejecutar npm run build:public
- SSE no conecta: reiniciar servicio systemd

## 8. Flujo de recuperacion

1. Verificar systemd
2. Verificar puerto 8765
3. Ejecutar build
4. Verificar integridad
5. Abrir interfaz

Fin del manual.

---

## 9. Instalacion desde cero

Requisitos:
- Node.js 20 o superior
- npm 10 o superior
- Git

Pasos:

1. Clonar repositorio:

   git clone git@github.com:HDLexdigital/hernandario1957.github.io.git

2. Entrar al directorio:

   cd hernandario1957.github.io

3. Instalar dependencias:

   npm install

4. Verificar pipeline:

   node src/core/server.js

5. Probar health:

   curl -s http://127.0.0.1:8765/health

## 10. Variables de entorno

LEXDIGITAL_PORT: puerto del servidor (por defecto 8765)
LEX_API_KEY: clave para endpoints privados (opcional)

## 11. Estructura de publicaciones

Cada documento debe estar en:

publicaciones/<nombre-documento>/

Y contener al menos:

- Un archivo .json con metadata y contenido

Ejemplo:

publicaciones/constitucion_co_cidm/
  constitucion_co_cidm.json
  constitucion_co_cidm.css

## 12. Pipeline modular en detalle

Etapas:

1. Catalogo:
   scripts/build-public.js llama a generarCatalogo() desde src/core/compiladores/catalogo.js

2. Metricas:
   generarMetricas() desde src/core/compiladores/metricas.js

3. Timeline:
   generarTimeline() desde src/core/compiladores/timeline.js

4. Dashboards:
   generarDashboard() desde src/core/compiladores/dashboards.js

Fallback:
Si el modulo falla, se ejecuta el script antiguo en scripts/.

## 13. Pruebas automatizadas

Ejecutar todas:

  npm test

Ejecutar una suite:

  npx jest core/mvp-053/test --runInBand

Ejecutar suite estresante:

  node tests-estres/generar-documentos-defectuosos.js
  node tests-estres/ejecutar-pruebas.js

## 14. Despliegue con Cloudflare Pages

Configuracion:

- Repositorio: HDLexdigital/hernandario1957.github.io
- Rama: main
- Build command: bash cloudflare-pages-build.sh
- Output directory: public

Custom domains:

- www.lexdigitalhd.com
- lexdigitalhd.com

Estado esperado:

- HTTP/2 200 en ambos

## 15. Registro de auditoria

Archivo: logs/audit/audit-YYYY-MM-DD.jsonl

Formato: JSONL append-only

Cada entrada incluye:

- timestamp
- endpoint
- apiKeyHash
- resultado

## 16. Referencia rapida de comandos

- npm run build:public   → build completo
- npm run preflight      → validacion previa
- npm run test:all       → build + preflight
- npm run procesar:ui    → interfaz Electron
- node src/core/server.js → servidor manual
- systemctl --user status lexdigital-watchdog.service
- journalctl --user -u lexdigital-watchdog.service -f
- curl -s http://127.0.0.1:8765/health
- curl -N http://127.0.0.1:8765/build-stream

Fin de la ampliacion.
