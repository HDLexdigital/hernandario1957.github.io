'use strict';
/**
 * Sistema de métricas de rendimiento
 * Registra tiempos y estadísticas de compilación
 */
class MetricasRendimiento {
    constructor() {
        this.metricas = {
            compilaciones: [],
            cacheHits: 0,
            cacheMisses: 0,
            errores: 0,
            tiempoTotal: 0
        };
        this.inicio = Date.now();
    }
    registrarCompilacion(tiempo, exito, metadatos = {}) {
        this.metricas.compilaciones.push({
            timestamp: new Date().toISOString(),
            tiempo: tiempo,
            exito: exito,
            ...metadatos
        });
        this.metricas.tiempoTotal += tiempo;
        if (!exito) {
            this.metricas.errores++;
        }
    }
    registrarCacheHit() {
        this.metricas.cacheHits++;
    }
    registrarCacheMiss() {
        this.metricas.cacheMisses++;
    }
    obtenerResumen() {
        const compilaciones = this.metricas.compilaciones;
        const exitosas = compilaciones.filter(c => c.exito);
        const fallidas = compilaciones.filter(c => !c.exito);
        return {
            uptime: Date.now() - this.inicio,
            totalCompilaciones: compilaciones.length,
            exitosas: exitosas.length,
            fallidas: fallidas.length,
            tasaExito: compilaciones.length > 0 
                ? Math.round((exitosas.length / compilaciones.length) * 100) 
                : 0,
            tiempoPromedio: compilaciones.length > 0 
                ? Math.round(this.metricas.tiempoTotal / compilaciones.length) 
                : 0,
            cacheHits: this.metricas.cacheHits,
            cacheMisses: this.metricas.cacheMisses,
            tasaCache: this.metricas.cacheHits + this.metricas.cacheMisses > 0
                ? Math.round((this.metricas.cacheHits / (this.metricas.cacheHits + this.metricas.cacheMisses)) * 100)
                : 0
        };
    }
    imprimirResumen() {
        const resumen = this.obtenerResumen();
        console.log('');
        console.log('============================================================');
        console.log('   MÉTRICAS DE RENDIMIENTO');
        console.log('============================================================');
        console.log(`Uptime: ${Math.round(resumen.uptime / 1000)}s`);
        console.log(`Compilaciones: ${resumen.totalCompilaciones} (${resumen.exitosas} exitosas, ${resumen.fallidas} fallidas)`);
        console.log(`Tasa de éxito: ${resumen.tasaExito}%`);
        console.log(`Tiempo promedio: ${resumen.tiempoPromedio}ms`);
        console.log(`Caché: ${resumen.cacheHits} hits, ${resumen.cacheMisses} misses (${resumen.tasaCache}%)`);
        console.log('============================================================');
    }
}
module.exports = MetricasRendimiento;