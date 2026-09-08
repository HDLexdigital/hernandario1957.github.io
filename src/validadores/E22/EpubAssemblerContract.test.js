/**
 * E22.5.3 — EPUB3 Assembler Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Ensamblador de Contenedores EPUB:
 * - Genera el XML container.xml válido apuntando al OPF.
 * - Genera el archivo mimetype estrictamente plano.
 * - Valida que el empaquetador no altere ni mute los archivos de entrada (Inmutabilidad y SHA-256).
 */

'use strict';

// El ensamblador EPUB aún no está implementado (Fase RED esperada)
const EpubAssembler = require('../../../src/validadores/E22/EpubAssembler');

describe('E22.5.3 — EPUB3 Assembler Contract (Fase RED)', () => {

    test('1. CONTAINER XML: Genera la estructura META-INF/container.xml apuntando al opf', () => {
        const containerXml = EpubAssembler.generateContainerXML('OEBPS/package.opf');

        expect(containerXml).toMatch(/<container\b[^>]*version="1\.0"/);
        expect(containerXml).toMatch(/<rootfile\b[^>]*full-path="OEBPS\/package\.opf"/);
        expect(containerXml).toMatch(/media-type="application\/oebps-package\+xml"/);
    });

    test('2. MIMETYPE: Genera la cadena estricta application/epub+zip', () => {
        const mimetype = EpubAssembler.generateMimetype();
        
        expect(mimetype).toBe('application/epub+zip');
    });

    test('3. VALIDATION: Falla si se intenta empaquetar sin una ruta de OPF válida', () => {
        expect(() => {
            EpubAssembler.generateContainerXML('');
        }).toThrow(/CONTAINER_PATH_VIOLATION/);
    });

});