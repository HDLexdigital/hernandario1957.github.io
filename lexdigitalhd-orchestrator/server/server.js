'use strict';

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir frontend estático del orquestador
app.use(express.static(path.join(__dirname, '../public')));

// Inicialización resiliente de base de datos
let pool = null;
if (process.env.DATABASE_URL) {
    try {
        const { Pool } = require('pg');
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    } catch (_) {
        console.warn('⚠️ [Orquestador] Driver "pg" no disponible. Operando en modo sin base de datos.');
    }
}

// 0. Definición del Esquema Zod (Esquema Canónico para Astro)
const AstroNormaSchema = z.object({
    titulo: z.string().min(1, "El título no puede estar vacío"),
    descripcion: z.string().default("Generado vía orquestador LexDigitalHD"),
    formato: z.literal("XHTML"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe ser un formato válido de URL (kebab-case)"),
    contenidoHtml: z.string()
});

/**
 * Procesa el payload generado por StructuredDocumentExtractor.js para Astro/XHTML
 */
function procesarEvidenciaParaAstro(payload) {
    if (!payload || !payload.document || !Array.isArray(payload.document.nodes)) {
        throw new Error("Payload inválido: se requiere 'document.nodes'");
    }

    let htmlSalida = "";

    // 1. Iterar sobre los nodos extraídos por el UXP
    payload.document.nodes.forEach(nodo => {
        const textoLimpio = nodo.content ? nodo.content.replace(/\r\n|\r/g, "\n").trim() : "";
        if (!textoLimpio) return;
        const estilo = (nodo.attributes && nodo.attributes.styleName) ? nodo.attributes.styleName.toLowerCase() : "";

        // 2. Mapear el estilo de InDesign a etiquetas HTML
        switch (estilo) {
            case "p02-title-main":
            case "p02_title_main":
                htmlSalida += `<h1>${textoLimpio}</h1>\n`;
                break;
            case "titulo":
            case "p02_title_part":
                htmlSalida += `<h2>${textoLimpio}</h2>\n`;
                break;
            case "capitulo":
            case "p02_title_chapter":
                htmlSalida += `<h3>${textoLimpio}</h3>\n`;
                break;
            case "p01-body-cont":
            case "p01-body-base":
            case "p01_body_base":
                htmlSalida += `<p class="body-text">${textoLimpio}</p>\n`;
                break;
            case "glosario":
                htmlSalida += `<p class="glossary-item">${textoLimpio}</p>\n`;
                break;
            default: 
                htmlSalida += `<p>${textoLimpio}</p>\n`;
                break;
        }
    });

    // Validar nombre seguro para el documento
    const nombreDocumento = payload.metadata?.documentName || "documento";
    const slugGenerado = nombreDocumento.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'documento';

    // 3. Ensamblar el objeto base
    const datosCandidatos = {
        titulo: nombreDocumento,
        descripcion: "Generado vía orquestador LexDigitalHD",
        formato: "XHTML",
        slug: slugGenerado,
        contenidoHtml: htmlSalida
    };

    // 4. Validar rigurosamente con Zod
    const documentoAstro = AstroNormaSchema.parse(datosCandidatos);

    // 5. Guardar usando Escritura Atómica en la ruta de Astro
    const dirDestino = path.resolve(__dirname, '../../src/content/normas');
    if (!fs.existsSync(dirDestino)) {
        fs.mkdirSync(dirDestino, { recursive: true });
    }
    const rutaDestino = path.join(dirDestino, `${documentoAstro.slug}.json`);
    const rutaTemporal = `${rutaDestino}.tmp`;

    try {
        fs.writeFileSync(rutaTemporal, JSON.stringify(documentoAstro, null, 2), 'utf8');
        fs.renameSync(rutaTemporal, rutaDestino);
        console.log(`✅ Documento validado y guardado atómicamente en Astro: ${rutaDestino}`);

        // 6. Dual-Write: Guardar también en publicaciones/ para compatibilidad con Cloudflare Pages Legacy
        const dirPublicaciones = path.resolve(__dirname, '../../publicaciones', documentoAstro.slug);
        if (!fs.existsSync(dirPublicaciones)) {
            fs.mkdirSync(dirPublicaciones, { recursive: true });
        }
        const rutaPublicaciones = path.join(dirPublicaciones, `${documentoAstro.slug}.json`);
        const rutaPublicacionesTmp = `${rutaPublicaciones}.tmp`;
        
        fs.writeFileSync(rutaPublicacionesTmp, JSON.stringify(documentoAstro, null, 2), 'utf8');
        fs.renameSync(rutaPublicacionesTmp, rutaPublicaciones);
        console.log(`✅ Documento guardado en sistema Legacy (publicaciones/): ${rutaPublicaciones}`);
        
    } catch (fsError) {
        console.error(`❌ Error al escribir archivos:`, fsError.message);
        if (fs.existsSync(rutaTemporal)) fs.unlinkSync(rutaTemporal);
    }

    return documentoAstro;
}

// ============================================
// ENDPOINTS REST
// ============================================

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'lexdigitalhd-orchestrator',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Endpoint de Ingesta desde el Plugin UXP de InDesign
app.post('/api/ingest', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.document || !Array.isArray(payload.document.nodes)) {
            return res.status(400).json({ success: false, error: 'Payload de ingesta inválido: se requiere document.nodes' });
        }

        const evidenceId = 'hash-' + crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').substring(0, 16);
        const docAstro = procesarEvidenciaParaAstro(payload);

        // Reenviar también al pipeline principal si está activo en 8765
        try {
            fetch('http://127.0.0.1:8765/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch (_) {}

        return res.status(200).json({
            success: true,
            message: 'Evidencia aceptada y procesada por el orquestador',
            evidenceId: evidenceId,
            documento: docAstro.slug,
            totalNodos: payload.document.nodes.length
        });
    } catch (err) {
        console.error('Error en /api/ingest:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint para validar la autenticidad del documento
app.post('/api/validar-documento', async (req, res) => {
    const { contenidoTexto } = req.body;

    if (!contenidoTexto) {
        return res.status(400).json({ valido: false, mensaje: "El contenido del texto es requerido." });
    }

    try {
        const hashCalculado = crypto
            .createHash('sha256')
            .update(contenidoTexto.trim(), 'utf8')
            .digest('hex');

        if (pool) {
            const query = `
                SELECT id, titulo, tipo_norma, version, fecha_publicacion, hash_criptografico 
                FROM documentos 
                WHERE hash_criptografico = $1
            `;
            const resultado = await pool.query(query, [hashCalculado]);

            if (resultado.rows.length > 0) {
                return res.json({
                    valido: true,
                    mensaje: "Documento verificado con éxito: Oficial y auténtico.",
                    detalles: resultado.rows[0]
                });
            }
        }

        return res.json({
            valido: true,
            hash: hashCalculado,
            mensaje: "Hash criptográfico generado exitosamente.",
            modo: pool ? "database" : "hash-only"
        });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ valido: false, mensaje: "Error interno al procesar la validación." });
    }
});

const PORT = parseInt(process.env.PORT || 3000, 10);
if (require.main === module) {
    app.listen(PORT, '127.0.0.1', () => {
        console.log(`[Orquestador] Backend ejecutándose en http://127.0.0.1:${PORT}`);
    });
}

module.exports = { app, procesarEvidenciaParaAstro };
