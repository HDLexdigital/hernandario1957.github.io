'use strict';

const contract = require('../mvp-008-print-publication.contract.json');

describe('MVP-008 Print Publication Contract', () => {
    test('El estándar de salida permite PDF/X-1a y PDF/X-4', () => {
        expect(contract.outputStandard.profiles).toEqual(
            expect.arrayContaining(['pdfx1a', 'pdfx4'])
        );
        expect(contract.outputStandard.default).toBe('pdfx1a');
    });

    test('La geometría define sangrado y marcas de preprensa', () => {
        expect(contract.pageGeometry.bleedBox.margin).toBe('3mm');
        expect(contract.pageGeometry.marks.crop).toBe(true);
        expect(contract.pageGeometry.marks.cross).toBe(true);
    });

    test('La gestión cromática exige CMYK y negro puro para texto', () => {
        expect(contract.colorManagement.targetProfile).toBe('FOGRA39');
        expect(contract.colorManagement.textBlack.k).toBe(100);
        expect(contract.colorManagement.textBlack.c).toBe(0);
    });

    test('La resolución mínima es 300 dpi para tono continuo', () => {
        expect(contract.resolution.continuousTone).toBeGreaterThanOrEqual(300);
        expect(contract.resolution.lineArt).toBeGreaterThanOrEqual(1200);
    });

    test('Las fuentes deben incrustarse y no se permiten Type1', () => {
        expect(contract.fonts.embed).toBe(true);
        expect(contract.fonts.forbidden).toContain('Type1');
    });

    test('La validación mínima exige CMYK y fuentes incrustadas', () => {
        expect(contract.validation.minimum.colorMode).toBe('cmyk');
        expect(contract.validation.minimum.fontsEmbedded).toBe(true);
    });
});
