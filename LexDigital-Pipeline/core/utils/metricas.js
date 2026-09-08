const { performance } = require('perf_hooks');

class Metricas {
    constructor(nombreExperimento) {
        this.nombreExperimento = nombreExperimento;
        this.fases = new Map();
        this.tiempoInicio = performance.now();
    }

    registrarFase(nombreFase, duracionMs) {
        if (!this.fases.has(nombreFase)) {
            this.fases.set(nombreFase, []);
        }
        this.fases.get(nombreFase).push(duracionMs);
    }

    registrarFaseTotal(duracionMs) {
        this.duracionTotal = duracionMs;
    }

    obtenerDuracionFase(nombreFase) {
        if (!this.fases.has(nombreFase)) {
            return 0;
        }
        const duraciones = this.fases.get(nombreFase);
        return duraciones.reduce((a, b) => a + b, 0) / duraciones.length;
    }

    obtenerResumen() {
        const resumen = {
            experimento: this.nombreExperimento,
            timestamp: new Date().toISOString(),
            duracionTotal: this.duracionTotal || 0,
            fases: {}
        };

        for (const [fase, duraciones] of this.fases.entries()) {
            resumen.fases[fase] = {
                promedio: (duraciones.reduce((a, b) => a + b, 0) / duraciones.length).toFixed(2),
                minimo: Math.min(...duraciones).toFixed(2),
                maximo: Math.max(...duraciones).toFixed(2),
                intentos: duraciones.length
            };
        }

        return resumen;
    }

    imprimir() {
        const resumen = this.obtenerResumen();
        console.log('\n=== MÉTRICAS DE RENDIMIENTO ===');
        console.log(`Experimento: ${resumen.experimento}`);
        console.log(`Duración total: ${resumen.duracionTotal.toFixed(2)}ms\n`);
        
        console.log('Fases:');
        for (const [fase, stats] of Object.entries(resumen.fases)) {
            console.log(`  ${fase}:`);
            console.log(`    Promedio: ${stats.promedio}ms`);
            console.log(`    Min/Max: ${stats.minimo}ms / ${stats.maximo}ms`);
            console.log(`    Intentos: ${stats.intentos}`);
        }
    }
}

module.exports = { Metricas };