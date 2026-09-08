'use strict';

const fs = require('fs');
const path = require('path');
// Importamos la Raíz de Composición
const { procesarDocumentoIPC } = require('../../src/index');

describe('E12.6-C.50.5 — Composition Root para Flujo UXP/IPC', () => {

    test('El Composition Root debe exponer la función procesarDocumentoIPC', () => {
        expect(typeof procesarDocumentoIPC).toBe('function');
    });

    test('procesarDocumentoIPC debe orquestar el pipeline puro y responder por el canal IPC', async () => {
        // 1. Preparamos un JSON real como si viniera directamente de la memoria de InDesign
        const rutaEntrada = path.resolve(__dirname, '../../test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaEntrada, 'utf8'));

        // 2. Mockeamos el cliente IPC (nuestra conexión de vuelta a InDesign)
        const mockClienteIPC = {
            send: jest.fn().mockResolvedValue({ status: 'ok', id: 'uxp_123' })
        };

        const opciones = { nombreBase: 'prueba_ipc_c50' };

        // 3. Ejecutamos el Composition Root
        const resultado = await procesarDocumentoIPC(jsonCrudo, mockClienteIPC, opciones);

        // 4. Verificaciones de orquestación
        expect(resultado).toBeDefined();
        expect(resultado.exito).toBe(true);
        expect(resultado.txId).toBe('uxp_123');

        // Verificamos que el transporte realmente haya sido invocado con un payload serializado
        expect(mockClienteIPC.send).toHaveBeenCalledTimes(1);
        const payloadEnviado = JSON.parse(mockClienteIPC.send.mock.calls[0][0]);
        
        expect(payloadEnviado.tipo).toBe('ARTEFACTO_C46');
        expect(payloadEnviado.payload.xhtml.includes('Constitución Política de Colombia')).toBe(true);
        expect(payloadEnviado.payload.metadatos.nombre).toBe('prueba_ipc_c50');
    });

});