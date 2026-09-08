'use strict';

const contract = require('../mvp-031-global-timeline-html.contract.json');

describe('MVP-031 Global Timeline HTML Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático y fuente de datos', () => {
        expect(contract.output.dashboard).toBe('public/global-timeline.html');
        expect(contract.output.data).toBe('public/global-timeline.json');
    });

    test('Consume global-timeline.json', () => {
        expect(contract.source.globalTimeline).toBe('public/global-timeline.json');
    });
});
