const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Endpoint para validar la autenticidad del documento
app.post('/api/validar-documento', async (req, res) => {
    const { contenidoTexto } = req.body;

    if (!contenidoTexto) {
        return res.status(400).json({ valido: false, mensaje: "El contenido del texto es requerido." });
    }

    try {
        // 1. Generar hash SHA-256 del texto recibido
        const hashCalculado = crypto
            .createHash('sha256')
            .update(contenidoTexto.trim(), 'utf8')
            .digest('hex');

        // 2. Consultar en la base de datos si existe el hash
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
        } else {
            return res.json({
                valido: false,
                mensaje: "El documento no coincide con ningún registro oficial o ha sido alterado."
            });
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ valido: false, mensaje: "Error interno al procesar la validación." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Backend de validación ejecutándose en el puerto ${PORT}`);
});
