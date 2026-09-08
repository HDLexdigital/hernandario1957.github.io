const { NIVELES_SEVERIDAD } = require('./DiagnosticModel');

const JERARQUIA_SEVERIDAD = {
    [NIVELES_SEVERIDAD.DEBUG]: 0,
    [NIVELES_SEVERIDAD.INFO]: 1,
    [NIVELES_SEVERIDAD.WARNING]: 2,
    [NIVELES_SEVERIDAD.ERROR]: 3
};

class Logger {
    constructor({ transporte = { escribir: () => {} }, nivelMinimo = NIVELES_SEVERIDAD.DEBUG } = {}) {
        this.transporte = transporte;
        this.nivelMinimo = nivelMinimo;
    }

    registrar(evento) {
        try {
            const nivelConfigurado = JERARQUIA_SEVERIDAD[this.nivelMinimo] ?? 0;
            const nivelEvento = JERARQUIA_SEVERIDAD[evento.nivel] ?? 0;

            if (nivelEvento >= nivelConfigurado) {
                if (this.transporte && typeof this.transporte.escribir === 'function') {
                    this.transporte.escribir(evento);
                }
            }
        } catch (error) {
            // Tolerancia estricta a fallos: un error en el transporte periférico 
            // nunca debe propagarse ni alterar el núcleo de compilación.
        }
    }
}

module.exports = {
    Logger
};