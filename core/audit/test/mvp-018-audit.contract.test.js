'use strict';

const contract = require('../mvp-018-audit.contract.json');

describe('MVP-018 Audit Contract', () => {
    test('Define registro de auditoría sin base de datos y sin mutación LEDM', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.appendOnly).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
        expect(contract.principles.noPII).toBe(true);
    });

    test('Define formato JSONL y rotación diaria', () => {
        expect(contract.log.format).toBe('jsonl');
        expect(contract.log.rotation).toBe('daily');
        expect(contract.log.directory).toBe('logs/audit');
    });

    test('Los campos obligatorios incluyen timestamp, event, apiKeyHash y status', () => {
        expect(contract.log.fields.required).toEqual(
            expect.arrayContaining(['timestamp', 'event', 'resource', 'apiKeyHash', 'status'])
        );
    });

    test('La validación exige logs append-only, sin mutación y con requestId único', () => {
        expect(contract.validation.requireAppendOnly).toBe(true);
        expect(contract.validation.requireNoLedmMutation).toBe(true);
        expect(contract.validation.requireUniqueRequestId).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});
