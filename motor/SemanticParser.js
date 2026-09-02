'use strict';

class SemanticParser {
  constructor(reglas) {
    this.reglas = reglas;
    this.pilaContenedores = [];
  }

  analizar(parrafos) {
    const eventos = [];

    for (let i = 0; i < parrafos.length; i++) {
      const parrafo = parrafos[i];
      const reglaContenedor = this.evaluarDisparadorContenedor(parrafo);

      if (reglaContenedor) {
        for (const tipoACerrar of reglaContenedor.cerrarAnteriores) {
          while (this.pilaContenedores.includes(tipoACerrar)) {
            const popped = this.pilaContenedores.pop();
            eventos.push({ tipo: 'CIERRE_CONTENEDOR', tag: popped });
          }
        }

        const idGenerado = this.generarId(reglaContenedor, parrafo);
        eventos.push({
          tipo: 'APERTURA_CONTENEDOR',
          tag: reglaContenedor.tipoContenedor,
          clase: reglaContenedor.claseContenedor,
          id: idGenerado,
          atributos: this.resolverAtributos(reglaContenedor.atributos, idGenerado)
        });
        this.pilaContenedores.push(reglaContenedor.tipoContenedor);
      }

      eventos.push({
        tipo: 'ELEMENTO_PARRAFO',
        parrafo: parrafo,
        reglaMapeo: this.reglas.mapeoEstilosParrafo[parrafo.estiloParrafo]
      });
    }

    while (this.pilaContenedores.length > 0) {
      eventos.push({ tipo: 'CIERRE_CONTENEDOR', tag: this.pilaContenedores.pop() });
    }

    return eventos;
  }

  evaluarDisparadorContenedor(parrafo) {
    return this.reglas.reglasContenedores.find(r => {
      if (r.estiloDisparador !== parrafo.estiloParrafo) return false;
      if (r.patronInicio) return new RegExp(r.patronInicio, 'i').test(parrafo.textoPlano);
      return true;
    });
  }

  generarId(regla, parrafo) {
    if (!regla.patronInicio) return `sec-${Date.now()}`;
    const match = parrafo.textoPlano.match(new RegExp(regla.patronInicio, 'i'));
    return match && match[2] ? `art-${match[2].toLowerCase()}` : `nodo-${parrafo.id}`;
  }

  resolverAtributos(atributos = {}, id) {
    const res = {};
    for (const [k, v] of Object.entries(atributos)) {
      res[k] = v.replace('$id', id).replace('art-$2', id);
    }
    return res;
  }
}

module.exports = SemanticParser;