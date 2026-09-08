'use strict';

const contract = require('../mvp-028-global-timeline.contract.json');

describe('MVP-028 Global Timeline Contract', () => {
    test('Define línea de tiempo global pública, estática y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida estática y endpoint público', () => {
        expect(contract.output.static).toBe('public/global-timeline.json');
        expect(contract.output.endpoint).toBe('/api/v1/public/global-timeline');
        expect(contract.output.method).toBe('GET');
        expect(contract.output.auth).toBe(false);
    });

    test('Define fuente desde timelines individuales', () => {
        expect(contract.source.timelines).toBe('public/timeline/*.json');
    });

    test('Define orden descendente por createdAt', () => {
        expect(contract.sort.field).toBe('createdAt');
        expect(contract.sort.order).toBe('desc');
    });

    test('Define campos públicos esperados', () => {
        expect(contract.fields).toEqual(
            expect.arrayContaining(['documentId', 'versionId', 'createdAt', 'title', 'url'])
        );
    });
});
