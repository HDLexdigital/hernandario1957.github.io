'use strict';

const { TransporteArtefactoPort } = require('../../src/core/ports/transporteArtefacto');
const { TransporteUXPAdapter } = require('../../src/infra/adaptadores/transporteUXPAdapter');

describe('E12.6-C.50.1 — Adaptador de Transporte UXP/IPC', () => {

    test('TransporteUXPAdapter debe heredar de TransporteArtefactoPort e implementar enviar()', () => {
        const adaptador = new TransporteUXPAdapter();
        
        expect(adaptador).toBeInstanceOf(TransporteArtefactoPort);
        expect(typeof adaptador.enviar).toBe('function');
    });

    test('enviar() debe empaquetar y serializar el artefacto atómicamente (Invariante T.2 y T.3)', async () => {
        // Mock del cliente de red/IPC (WebSocket, HTTP, etc.) para aislar la prueba de la I/O real
        const mockClienteIPC = {
            send: jest.fn().mockResolvedValue({ status: 'ok', id: 'tx_999' })
        };

        // Inyectamos el cliente en el adaptador
        const adaptador = new TransporteUXPAdapter(mockClienteIPC);

        const artefactoMock = {
            jsonOficial: { documento: 'ley_test.indd' },
            xhtml: '<html xmlns="http://www.w3.org/1999/xhtml"></html>',
            metadatos: { nombre: 'ley_test', tiempoTotal: 5.5 }
        };

        const resultado = await adaptador.enviar(artefactoMock);

        // Verificamos que el adaptador devuelva un resultado de infraestructura explícito
        expect(resultado.exito).toBe(true);
        expect(resultado.txId).toBe('tx_999');
        expect(mockClienteIPC.send).toHaveBeenCalledTimes(1);

        // Auditoría de Serialización (T.3) y No Mutación (T.5)
        const payloadEnviado = mockClienteIPC.send.mock.calls[0][0];
        expect(typeof payloadEnviado).toBe('string');

        const payloadParseado = JSON.parse(payloadEnviado);
        
        // El protocolo de transporte debe envolver el artefacto (Metadata de Envoltorio)
        expect(payloadParseado.tipo).toBe('ARTEFACTO_C46');
        expect(payloadParseado.timestamp).toBeDefined();
        
        // El payload interno debe ser exactamente el artefacto inmutado
        expect(payloadParseado.payload.xhtml).toBe(artefactoMock.xhtml);
        expect(payloadParseado.payload.jsonOficial).toEqual(artefactoMock.jsonOficial);
        expect(payloadParseado.payload.metadatos).toEqual(artefactoMock.metadatos);
    });

    test('Debe rechazar artefactos inválidos protegiendo la integridad de la red', async () => {
        const adaptador = new TransporteUXPAdapter({});

        await expect(adaptador.enviar(null)).rejects.toThrow('ERR_INVALID_ARTEFACTO');
        await expect(adaptador.enviar({ jsonOficial: {} })).rejects.toThrow('ERR_INVALID_ARTEFACTO');
    });

});