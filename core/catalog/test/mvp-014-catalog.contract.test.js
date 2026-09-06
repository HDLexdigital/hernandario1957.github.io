'use strict';

const contract = require('../mvp-014-catalog.contract.json');

describe('MVP-014 Catalog and Versioning Contract', () => {
    test('El contrato define los principios de versionado, catálogo global y cero mutación de LEDM', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.deterministic).toBe(true);
        expect(contract.principles.versionedPublication).toBe(true);
        expect(contract.principles.globalCatalog).toBe(true);
        expect(contract.principles.perVersionManifest).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('La estructura define las rutas de entrada y salida del catálogo', () => {
        expect(contract.structure.inputDirectory).toBe('publicaciones/');
        expect(contract.structure.outputDirectory).toBe('public/');
        expect(contract.structure.catalogOutput).toBe('public/catalogo.json');
    });

    test('Los requerimientos exigen catálogo global, manifiestos e identificadores por versión', () => {
        expect(contract.requirements.requireGlobalCatalog).toBe(true);
        expect(contract.requirements.requireVersionedPath).toBe(true);
        expect(contract.requirements.requireVersionManifest).toBe(true);
        expect(contract.requirements.requireVersionIndex).toBe(true);
        expect(contract.requirements.requireUniqueVersionId).toBe(true);
    });

    test('El esquema de respuesta define una lista de documentos con arreglos de versiones', () => {
        expect(contract.responseSchema.catalog.type).toBe('array');
        expect(contract.responseSchema.catalog.items.type).toBe('object');
        expect(contract.responseSchema.catalog.items.properties.versions.type).toBe('array');
        expect(contract.responseSchema.catalog.items.required).toEqual(
            expect.arrayContaining(['documentId', 'versions'])
        );
    });
});
