'use strict';

const fs = require('fs');
const path = require('path');
const contract = require('../mvp-019-docs.contract.json');

describe('MVP-019 Documentation Contract', () => {
    test('Define un contrato puramente documental sin mutación de código', () => {
        expect(contract.principles.purelyDocumentary).toBe(true);
        expect(contract.principles.noCodeMutation).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.deterministicStructure).toBe(true);
    });

    test('Exige la existencia de los archivos documentales clave', () => {
        const rootDir = path.join(__dirname, '..', '..', '..');
        expect(contract.validation.requireAllFilesPresent).toBe(true);

        for (const relativePath of contract.requiredFiles) {
            const absolutePath = path.join(rootDir, relativePath);
            const exists = fs.existsSync(absolutePath);
            expect(exists).toBe(true);
        }
    });
});
