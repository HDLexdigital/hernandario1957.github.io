'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const RAIZ = path.join(__dirname, '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');

function createAdminRouter(authMiddleware) {
    const router = express.Router();

    router.use(authMiddleware);

    router.get('/api/v1/admin/status', (req, res) => {
        try {
            const catalogPath = path.join(PUBLIC_DIR, 'catalogo.json');
            const searchIndexPath = path.join(PUBLIC_DIR, 'search-index.json');

            const catalog = fs.existsSync(catalogPath)
                ? JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
                : null;

            const searchIndex = fs.existsSync(searchIndexPath)
                ? JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'))
                : null;

            const documentsStatus = [];

            if (catalog && Array.isArray(catalog)) {
                for (const doc of catalog) {
                    const manifestPath = path.join(PUBLIC_DIR, doc.documentId, 'manifest.json');
                    const hasManifest = fs.existsSync(manifestPath);
                    const manifest = hasManifest ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;

                    documentsStatus.push({
                        documentId: doc.documentId,
                        versions: doc.versions || [],
                        hasManifest,
                        artifactsCount: manifest ? manifest.artifacts.length : 0
                    });
                }
            }

            return res.status(200).json({
                catalog: {
                    present: !!catalog,
                    totalDocuments: catalog ? catalog.length : 0
                },
                documents: documentsStatus,
                searchIndex: {
                    present: !!searchIndex,
                    totalEntries: Array.isArray(searchIndex) ? searchIndex.length : 0
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return res.status(500).json({
                error: 'internal_error',
                message: error.message
            });
        }
    });

    router.get('/admin', (req, res) => {
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>LexDigitalHD 2.0 — Panel de Administración</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .card { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        pre { background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>LexDigitalHD 2.0 — Panel de Control</h1>
        <div class="card">
            <p><strong>Estado del Corpus:</strong> Operativo (Modo Estricto Contract-First)</p>
            <p>Endpoint de diagnóstico disponible en: <code>/api/v1/admin/status</code></p>
        </div>
        <h3>Estado en tiempo real</h3>
        <pre id="status-data">Cargando métricas del corpus...</pre>
    </div>
    <script>
        fetch('/api/v1/admin/status', {
            headers: { 'x-api-key': localStorage.getItem('lex_api_key') || '' }
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('status-data').textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            document.getElementById('status-data').textContent = 'Error al cargar el estado (verifique la API Key).';
        });
    </script>
</body>
</html>`;
        return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(html);
    });

    return router;
}

module.exports = { createAdminRouter };
