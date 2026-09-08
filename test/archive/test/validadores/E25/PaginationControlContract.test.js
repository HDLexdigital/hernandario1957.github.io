/**
 * E25.6 — Overflow & Pagination Control Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Control Geométrico y Paginación Determinista:
 * - P1. DETERMINISTIC PAGE CREATION: Mismo estado y overset producen idéntica operación geométrica.
 * - P2. CANONICAL FRAME GEOMETRY: Los nuevos frames usan exclusivamente las dimensiones certificadas.
 * - P3. STORY CONTINUITY: El nuevo frame se adjunta al Story existente sin duplicar flujos.
 * - P4. ATOMIC THREADING: Página, frame y enlace actúan como una unidad transaccional atómica.
 * - P5. TEXT INTEGRITY: Resolver el overset no altera, duplica ni trunca el contenido textual.
 * - P6. MONOTONIC PAGINATION: Prohibido crear ciclos tipográficos en el encadenamiento de frames.
 * - P7. OVERSET READ-BACK: Verificación física posterior para certificar si el overset persistió o se resolvió.
 */

'use strict';

const PaginationControllerEngine = require('../../../src/validadores/E25/PaginationControllerEngine');

describe('E25.6 — Overflow & Pagination Control Contract', () => {

    let mockDom;
    const templateConfig = Object.freeze({
        standardWidth: 210,
        standardHeight: 297,
        standardMargin: 20
    });

    beforeEach(() => {
        mockDom = {
            pages: [
                { id: 'PAGE_1', frames: ['FRAME_A'] }
            ],
            frames: {
                'FRAME_A': { id: 'FRAME_A', parentStory: 'STORY_MAIN', nextFrame: null, capacity: 50, contentSize: 70 } // Overset activo (70 > 50)
            },
            stories: {
                'STORY_MAIN': { id: 'STORY_MAIN', contents: 'A'.repeat(70) }
            }
        };
    });

    test('P1 & P2. CANONICAL CREATION & GEOMETRY: Crea página y frame usando exclusivamente la plantilla certificada', () => {
        const resolution = PaginationControllerEngine.resolveOverset('FRAME_A', 'STORY_MAIN', mockDom, templateConfig);

        expect(resolution.status).toBe('SUCCESS');
        expect(mockDom.pages.length).toBe(2); // Nueva página creada
        
        const newFrameId = resolution.createdFrameId;
        expect(mockDom.frames[newFrameId].geometry).toEqual({
            width: 210,
            height: 297,
            margin: 20
        });
    });

    test('P3 & P4. STORY CONTINUITY & ATOMIC THREADING: El frame se enhebra atómicamente al Story existente', () => {
        const resolution = PaginationControllerEngine.resolveOverset('FRAME_A', 'STORY_MAIN', mockDom, templateConfig);
        
        const newFrameId = resolution.createdFrameId;
        
        // Verificación de enhebrado atómico (F4)
        expect(mockDom.frames['FRAME_A'].nextFrame).toBe(newFrameId);
        expect(mockDom.frames[newFrameId].parentStory).toBe('STORY_MAIN');
    });

    test('P5. TEXT INTEGRITY: La resolución geométrica preserva íntegramente el contenido textual', () => {
        const originalContent = mockDom.stories['STORY_MAIN'].contents;
        
        PaginationControllerEngine.resolveOverset('FRAME_A', 'STORY_MAIN', mockDom, templateConfig);

        expect(mockDom.stories['STORY_MAIN'].contents).toBe(originalContent);
    });

    test('P6. MONOTONIC PAGINATION: Impide la creación de ciclos tipográficos circulares', () => {
        // Simulamos un intento de reasignar un frame ya encadenado en bucle
        mockDom.frames['FRAME_A'].nextFrame = 'FRAME_A'; // Ciclo prohibido

        const resolution = PaginationControllerEngine.resolveOverset('FRAME_A', 'STORY_MAIN', mockDom, templateConfig);

        expect(resolution.status).toBe('ERROR');
        expect(resolution.reason).toBe('CYCLIC_THREADING_PROHIBITED');
    });

    test('P7. OVERSET READ-BACK: Evalúa mediante lectura posterior si el overset fue mitigado o continúa', () => {
        // Ampliamos la capacidad del nuevo frame para que absorba el overset de forma limpia
        const resolution = PaginationControllerEngine.resolveOverset('FRAME_A', 'STORY_MAIN', mockDom, templateConfig);
        
        // Simulamos que tras el enhebrado, el contenido cabe holgadamente en el total combinado
        mockDom.frames['FRAME_A'].contentSize = 30;
        mockDom.frames[resolution.createdFrameId].contentSize = 40; // Total 70 <= capacidad combinada (100)

        const readBackStatus = PaginationControllerEngine.verifyOverset('STORY_MAIN', mockDom);

        expect(readBackStatus.oversetResolved).toBe(true);
        expect(readBackStatus.remainingOverset).toBe(0);
    });
});