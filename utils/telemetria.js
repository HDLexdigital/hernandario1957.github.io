'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class Telemetria {
  constructor() {
    this.fases = [];
    this.inicioGlobal = null;
  }

  iniciar(nombreFase) {
    if (this.inicioGlobal === null) {
      this.inicioGlobal = performance.now();
    }
    const memoriaInicial = process.memoryUsage();
    this._faseActual = {
      nombre: nombreFase,
      tiempoInicio: performance.now(),
      memoriaInicial: {
        rss: memoriaInicial.rss,
        heapUsed: memoriaInicial.heapUsed,
        heapTotal: memoriaInicial.heapTotal,
        external: memoriaInicial.external
      }
    };
  }

  finalizar(nombreFase = null) {
    if (!this._faseActual) return;
    const fase = this._faseActual;
    if (nombreFase && fase.nombre !== nombreFase) {
      console.warn(`Advertencia: fase actual "${fase.nombre}" no coincide con "${nombreFase}"`);
    }
    const memoriaFinal = process.memoryUsage();
    const tiempoTotal = performance.now() - fase.tiempoInicio;
    const memoriaUsada = {
      rss: memoriaFinal.rss - fase.memoriaInicial.rss,
      heapUsed: memoriaFinal.heapUsed - fase.memoriaInicial.heapUsed,
      heapTotal: memoriaFinal.heapTotal - fase.memoriaInicial.heapTotal,
      external: memoriaFinal.external - fase.memoriaInicial.external
    };
    this.fases.push({
      nombre: fase.nombre,
      tiempoMs: tiempoTotal,
      memoriaInicial: fase.memoriaInicial,
      memoriaFinal: {
        rss: memoriaFinal.rss,
        heapUsed: memoriaFinal.heapUsed,
        heapTotal: memoriaFinal.heapTotal,
        external: memoriaFinal.external
      },
      memoriaUsada
    });
    this._faseActual = null;
  }

  guardarReporte(rutaSalida = null) {
    if (!rutaSalida) {
      rutaSalida = path.join(__dirname, 'telemetria_reporte.json');
    }
    const tiempoGlobal = performance.now() - this.inicioGlobal;
    const reporte = {
      fecha: new Date().toISOString(),
      tiempoTotalMs: tiempoGlobal,
      fases: this.fases,
      memoriaPico: process.memoryUsage().rss
    };
    fs.writeFileSync(rutaSalida, JSON.stringify(reporte, null, 2), 'utf8');
    console.log(`\n📊 Reporte de telemetría guardado en: ${rutaSalida}`);
    return reporte;
  }

  imprimirResumen() {
    console.log('\n========================================');
    console.log('   RESUMEN DE TELEMETRÍA');
    console.log('========================================');
    this.fases.forEach(fase => {
      console.log(`\n🔹 Fase: ${fase.nombre}`);
      console.log(`   Tiempo: ${fase.tiempoMs.toFixed(2)} ms`);
      console.log(`   Memoria usada (heap): ${(fase.memoriaUsada.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Memoria usada (rss): ${(fase.memoriaUsada.rss / 1024 / 1024).toFixed(2)} MB`);
    });
    console.log('\n========================================');
  }
}

module.exports = Telemetria;