'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

const RAIZ = path.join(__dirname, '..', '..');
const INDICE_PATH = process.env.API_INDICE_PATH || path.join(RAIZ, 'public', 'indice.json');
const MANIFEST_PATH = process.env.API_MANIFEST_PATH || path.join(RAIZ, 'public', 'manifest.json');
const SEARCH_INDEX_PATH = process.env.API_SEARCH_INDEX_PATH || path.join(RAIZ, 'public', 'search-index.json');

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

app.use(express.json());

app.get('/api/v1/status', (req, res) => {
    const manifest = leerJson(MANIFEST_PATH);
    res.json({
        status: 'ok',
        corpusVersion: manifest?.version || 'unknown',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/index', (req, res) => {
    const indice = leerJson(INDICE_PATH);
    if (!indice) {
        return res.status(404).json({ error: 'index_not_found' });
    }
    res.json(indice);
});

app.get('/api/v1/document/:id', (req, res) => {
    const manifest = leerJson(MANIFEST_PATH);
    if (!manifest || manifest.documentId !== req.params.id) {
        return res.status(404).json({ error: 'document_not_found' });
    }
    res.json({
        documentId: manifest.documentId,
        title: manifest.documentId,
        artifacts: manifest.artifacts || []
    });
});

app.get('/api/v1/node/:nodeId', (req, res) => {
    const indice = leerJson(INDICE_PATH);
    if (!indice) {
        return res.status(404).json({ error: 'index_not_found' });
    }
    const nodo = indice.find(entry => entry.nodeId === req.params.nodeId);
    if (!nodo) {
        return res.status(404).json({ error: 'node_not_found' });
    }
    res.json({
        nodeId: nodo.nodeId,
        content: nodo
    });
});

app.get('/api/v1/search', (req, res) => {
    const q = normalizar(req.query.q || '');
    const limit = parseInt(req.query.limit, 10) || 20;

    if (q.length < 2) {
        return res.status(400).json({ error: 'query_too_short' });
    }

    const searchIndex = leerJson(SEARCH_INDEX_PATH);
    if (!searchIndex) {
        return res.status(404).json({ error: 'search_index_not_found' });
    }

    const resultados = searchIndex
        .filter(item => item.text.includes(q))
        .slice(0, limit);

    res.json({
        query: req.query.q,
        count: resultados.length,
        results: resultados
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'resource_not_found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
});

if (require.main === module) {
    const PORT = process.env.API_PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 API MVP-011+MVP-012 escuchando en http://localhost:${PORT}`);
    });
}

module.exports = app;
