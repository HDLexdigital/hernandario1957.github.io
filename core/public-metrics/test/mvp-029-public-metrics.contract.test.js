'use strict';

const contract = require('../mvp-029-public-metrics.contract.json');

describe('MVP-029 Public Metrics Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático', () => {
        expect(contract.output.dashboard).toBe('public/metrics.html');
    });

    test('Consume métricas y línea de tiempo global', () => {
        expect(contract.source.metrics).toBe('public/build-metrics.json');
        expect(contract.source.globalTimeline).toBe('public/global-timeline.json');
    });
});
