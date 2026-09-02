'use strict';
/**
 * Sistema de caché para compilaciones
 * Evita recompilar documentos idénticos
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
class CacheCompilacion {
    constructor(opciones = {}) {
        this.directorioCache = opciones.directorio || path.join(__dirname, '../cache');
        this.ttl = opciones.ttl || 3600000; // 1 hora por defecto
        this.stats = {
            aciertos: 0,
            fallos: 0,
            guardados: 0
        };
        this.inicializar();
    }
    inicializar() {
        if (!fs.existsSync(this.directorioCache)) {
            fs.mkdirSync(this.directorioCache, { recursive: true });
            console.log(`📁 Caché creada en: ${this.directorioCache}`);
        }
    }
    /**
     * Genera un hash único para los datos
     */
    generarHash(datos) {
        const contenido = JSON.stringify(datos);
        return crypto
            .createHash('sha256')
            .update(contenido)
            .digest('hex')
            .substring(0, 32);
    }
    /**
     * Obtiene un resultado desde la caché
     * @returns {any|null} Resultado cacheado o null si no existe/expirado
     */
    obtener(datos) {
        const hash = this.generarHash(datos);
        const archivoCache = path.join(this.directorioCache, `${hash}.json`);
        if (!fs.existsSync(archivoCache)) {
            this.stats.fallos++;
            return null;
        }
        try {
            const contenido = JSON.parse(fs.readFileSync(archivoCache, 'utf-8'));
            const edad = Date.now() - new Date(contenido.timestamp).getTime();
            // Verificar si expiró
            if (edad > this.ttl) {
                fs.unlinkSync(archivoCache);
                this.stats.fallos++;
                return null;
            }
            this.stats.aciertos++;
            console.log(`✅ Caché HIT (${edad}ms de antigüedad)`);
            return contenido.resultado;
        } catch (error) {
            this.stats.fallos++;
            return null;
        }
    }
    /**
     * Guarda un resultado en la caché
     */
    guardar(datos, resultado) {
        const hash = this.generarHash(datos);
        const archivoCache = path.join(this.directorioCache, `${hash}.json`);
        try {
            fs.writeFileSync(archivoCache, JSON.stringify({
                timestamp: new Date().toISOString(),
                hash: hash,
                resultado: resultado
            }, null, 2), 'utf-8');
            this.stats.guardados++;
            console.log(`💾 Caché guardada: ${hash.substring(0, 8)}...`);
            return hash;
        } catch (error) {
            console.warn(`⚠️ No se pudo guardar caché: ${error.message}`);
            return null;
        }
    }
    /**
     * Limpia toda la caché
     */
    limpiar() {
        if (fs.existsSync(this.directorioCache)) {
            const archivos = fs.readdirSync(this.directorioCache);
            for (const archivo of archivos) {
                try {
                    fs.unlinkSync(path.join(this.directorioCache, archivo));
                } catch (e) {}
            }
            console.log(`🧹 Caché limpiada (${archivos.length} archivos eliminados)`);
        }
    }
    /**
     * Obtiene estadísticas de uso
     */
    obtenerStats() {
        const archivos = fs.existsSync(this.directorioCache) 
            ? fs.readdirSync(this.directorioCache).length 
            : 0;
        return {
            ...this.stats,
            archivosEnCache: archivos,
            tasaAciertos: this.stats.aciertos + this.stats.fallos > 0
                ? Math.round((this.stats.aciertos / (this.stats.aciertos + this.stats.fallos)) * 100)
                : 0
        };
    }
}
module.exports = CacheCompilacion;