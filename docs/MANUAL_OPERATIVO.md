# Manual Operativo — LexDigitalHD 2.0
**Motor Editorial Jurídico Determinista y Contract-First**

---

## 1. Arquitectura General

LexDigitalHD 2.0 opera bajo una filosofía estricta de **cero bases de datos, inmutabilidad y estado cero (*stateless*)**.

- **Core Tecnológico:** Linux Mint, Node.js, Express, Jest.
- **Entrada:** Corpus jurídico en formato LEDM 2.0.
- **Salida:** Artefactos estáticos compilados:
  - Web HTML
  - EPUB
  - PDF/UA-1
  - PDF/X-1a
  - JSON de catálogo y manifiestos

---

## 2. Flujo de Compilación y Publicación

El sistema no genera contenido dinámico desde bases de datos.  
Todo el corpus se procesa mediante scripts deterministas previos:

1. **Extracción:** Windows 11 / InDesign.
2. **Compilación Semántica:** Generación de árboles de nodos y manifiestos.
3. **Manifiestos y Checksums:** Cada versión compila un `manifest.json` con SHA-256.
4. **Catálogo Global:** `catalogo.json` centraliza normas, versiones y metadatos.

---

## 3. API de Consulta y Búsqueda Interna

El servidor expone rutas de solo lectura:

- `GET /api/v1/status`
- `GET /api/v1/index`
- `GET /api/v1/document/:id`
- `GET /api/v1/node/:nodeId`
- `GET /api/v1/search?q=...`
- `GET /api/v1/catalog`

---

## 4. Seguridad y Control de Acceso (API Keys)

Las rutas están protegidas mediante middleware estricto:

- **Cabecera requerida:** `x-api-key: <TOKEN>`
- **Validación:** contra variable de entorno `LEX_API_KEY`.
- **Respuesta no autorizada:** `401 { "error": "unauthorized" }`.

---

## 5. Panel de Administración

Permite supervisar la salud del corpus publicado:

- `GET /api/v1/admin/status` — JSON con estado del catálogo, integridad de manifiestos y timestamp UTC.
- `GET /admin` — Interfaz web ligera protegida por API Key.

---

## 6. Registro de Auditoría Append-Only

- **Mecanismo:** Eventos de acceso en `logs/audit/`.
- **Formato:** JSONL.
- **Seguridad:** API Key hasheada SHA-256, sin datos personales, sin bloqueo de la API en fallo de disco.

---

## 7. Despliegue y Producción

- **Automatización:** GitHub Actions `.github/workflows/deploy.yml`.
- **Destino:** GitHub Pages.
- **Dominio:** `digitalhd.com` con HTTPS forzado.

---

## 8. Documentos Relacionados

- `ROADMAP.md`
- `docs/PROJECT_STATE.md`
- `docs/AUDIT_SUMMARY.md`

Este manual es un documento vivo. Cualquier cambio en la arquitectura o en los contratos debe reflejarse aquí.
