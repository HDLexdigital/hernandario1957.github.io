/**
 * E25.4 — Text Flow & Frame Management Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Flujo de Texto y Encadenamiento:
 * - F1. STORY CONTINUATION: Nodos de un flujo lógico van a un único Story.
 * - F2. MONOTONIC INSERTION: Inserción exclusiva al final del Story.
 * - F3. DETERMINISTIC OVERSET: Desbordamiento genera OVERSET_DETECTED explícito.
 * - F4. FRAME THREADING: Conexión estructural DOM validada (nextTextFrame).
 * - F5. PAYLOAD INTEGRITY: Conservación absoluta de caracteres.
 * - F6. STORY ORDER PRESERVATION: AST Order === Story Node Order, sin importar saltos de caja.
 * - PROTECCIÓN: E25.4 jamás toma decisiones de paginación por su cuenta.
 */

'use strict';

const TextFlowEngine = require('../../../src/validadores/E25/TextFlowEngine');

describe('E25.4 — Text Flow Contract', () => {

    let mockDom;

    beforeEach(() => {
        // Simulador estructural del DOM de InDesign para TextFlow
        mockDom = {
            stories: {
                'STORY_MAIN': { id: 'STORY_MAIN', contents: '', nodes: [] }
            },
            frames: {
                // Frame A soporta 50 caracteres
                'FRAME_A': { id: 'FRAME_A', parentStory: 'STORY_MAIN', nextFrame: null, capacity: 50 },
                // Frame B (nueva página) soporta 50 caracteres, desconectado inicialmente
                'FRAME_B': { id: 'FRAME_B', parentStory: null, nextFrame: null, capacity: 50 }
            }
        };
    });

    test('F1, F2 & F5: Inserción monotónica, un único story y payload íntegro', () => {
        const n1 = { nodeId: 'N1', text: 'Artículo 1: Colombia es.' }; // 24 chars
        
        const result = TextFlowEngine.injectNode(n1, 'STORY_MAIN', 'FRAME_A', mockDom);
        
        expect(result.status).toBe('SUCCESS');
        expect(mockDom.stories['STORY_MAIN'].contents).toBe(n1.text);
        expect(mockDom.stories['STORY_MAIN'].nodes).toEqual(['N1']);
    });

    test('F3: Desbordamiento determinista genera OVERSET_DETECTED sin fallar silenciosamente', () => {
        const n1 = { nodeId: 'N1', text: 'Art 1. '.repeat(5) }; // 35 chars
        const n2 = { nodeId: 'N2', text: 'Art 2. '.repeat(5) }; // 35 chars (Total 70 > 50 capacity)
        
        TextFlowEngine.injectNode(n1, 'STORY_MAIN', 'FRAME_A', mockDom);
        const result2 = TextFlowEngine.injectNode(n2, 'STORY_MAIN', 'FRAME_A', mockDom);
        
        expect(result2.status).toBe('OVERSET_DETECTED');
        expect(result2.overflowAmount).toBe(20); // 70 - 50
        // E25.4 reporta, pero NO añade páginas por iniciativa propia
        expect(mockDom.frames['FRAME_A'].nextFrame).toBeNull(); 
    });

    test('F4 & F6: Frame Threading y Preservación de Orden a través de los saltos', () => {
        const n1 = { nodeId: 'N1', text: 'A1'.repeat(10) }; // 20 chars
        const n2 = { nodeId: 'N2', text: 'A2'.repeat(20) }; // 40 chars (Cruza el límite de 50)
        const n3 = { nodeId: 'N3', text: 'A3'.repeat(10) }; // 20 chars
        
        // 1. Inyectamos N1
        TextFlowEngine.injectNode(n1, 'STORY_MAIN', 'FRAME_A', mockDom);
        
        // 2. Inyectamos N2 -> Causa Overset
        const res2 = TextFlowEngine.injectNode(n2, 'STORY_MAIN', 'FRAME_A', mockDom);
        expect(res2.status).toBe('OVERSET_DETECTED');
        
        // 3. Resolución: E25.4 expone el método para que el Orquestador(E25.6) conecte los frames
        TextFlowEngine.threadFrames('FRAME_A', 'FRAME_B', 'STORY_MAIN', mockDom);
        
        // Verificación de integridad estructural del Thread (F4)
        expect(mockDom.frames['FRAME_A'].nextFrame).toBe('FRAME_B');
        expect(mockDom.frames['FRAME_B'].parentStory).toBe('STORY_MAIN');
        
        // 4. Inyectamos N3 en la cadena ya resuelta
        const res3 = TextFlowEngine.injectNode(n3, 'STORY_MAIN', 'FRAME_B', mockDom);
        expect(res3.status).toBe('SUCCESS'); // Capacidad combinada: 100. Usada: 80.
        
        // Verificación Suprema (F6): El orden semántico sobrevive al salto físico
        expect(mockDom.stories['STORY_MAIN'].nodes).toEqual(['N1', 'N2', 'N3']);
        expect(mockDom.stories['STORY_MAIN'].contents).toBe(n1.text + n2.text + n3.text);
    });
});