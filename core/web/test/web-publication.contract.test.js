'use strict';

const contract = require('../mvp-006-web-publication.contract.json');

describe('MVP-006 Web Publication Contract', () => {
    test('El contrato define todos los tipos LEDM conocidos', () => {
        const expectedBlockTypes = ['title', 'article', 'paragraph'];
        const expectedInlineTypes = ['strong', 'emphasis', 'text'];

        expect(contract.allowedBlockTypes.sort()).toEqual(expectedBlockTypes.sort());
        expect(contract.allowedInlineTypes.sort()).toEqual(expectedInlineTypes.sort());
    });

    test('Cada tipo permitido tiene un mapeo semántico definido', () => {
        const allTypes = [
            ...contract.allowedBlockTypes,
            ...contract.allowedInlineTypes
        ];
        allTypes.forEach(type => {
            expect(contract.semanticMapping[type]).toBeDefined();
            expect(contract.semanticMapping[type].tag).toBeDefined();
        });
    });

    test('Las reglas de identificadores son estrictas', () => {
        const { regex, unique, htmlAttribute } = contract.identifierRules;
        expect(htmlAttribute).toBe('id');
        expect(unique).toBe(true);
        const re = new RegExp(regex);
        expect(re.test('CO-CONST-T1-C1-ART1')).toBe(true);
        expect(re.test('CO-CONST-T1-C1-ART1-P1')).toBe(true);
        expect(re.test('123ABC')).toBe(false);
        expect(re.test('CO CONST ART1')).toBe(false);
    });

    test('La jerarquía prohíbe saltos de nivel sin títulos intermedios', () => {
        expect(contract.hierarchyRules.noLevelJumps).toBe(true);
        expect(contract.hierarchyRules.titleDefinesSection).toBe(true);
        expect(contract.hierarchyRules.sectionTag).toBe('section');
        expect(contract.hierarchyRules.ariaLabelledBy).toBe(true);
    });

    test('La exposición para búsqueda incluye metadatos y campos de índice', () => {
        expect(contract.searchExposure.metaTags).toContain('documentId');
        expect(contract.searchExposure.staticIndex).toEqual(
            expect.arrayContaining(['title', 'nodeId', 'text'])
        );
    });
});