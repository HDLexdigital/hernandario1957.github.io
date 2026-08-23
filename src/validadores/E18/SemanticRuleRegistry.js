/**
 * E18.2.x.2 — SemanticRuleRegistry
 * Registro normativo de reglas de clasificación semántica para LexDigitalHD.
 * Fuente única de verdad. Prohibida la heurística y la mutación.
 */

'use strict';

const RULES = [
    // --- Reglas de origen AST (Estilos InDesign / Tipos) ---
    {
        id: 'SEM-AST-001',
        source: 'AST',
        field: 'estiloParrafo',
        token: 'P02_TITLE_PART',
        semanticType: 'titulo_parte',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-AST-002',
        source: 'AST',
        field: 'estiloParrafo',
        token: 'P02_TITLE_MAIN',
        semanticType: 'titulo_principal',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-AST-003',
        source: 'AST',
        field: 'estiloParrafo',
        token: 'P03_CENTER_BOLD',
        semanticType: 'parrafo_destacado',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-AST-004',
        source: 'AST',
        field: 'estiloParrafo',
        token: 'P01_BODY_CONT',
        semanticType: 'parrafo',
        nodeKind: 'text'
    },

    // --- Reglas de origen XHTML (Clases CSS compiladas) ---
    {
        id: 'SEM-DOM-101',
        source: 'XHTML',
        field: 'class',
        token: 'p02_title_part',
        semanticType: 'titulo_parte',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-DOM-102',
        source: 'XHTML',
        field: 'class',
        token: 'p02_title_main',
        semanticType: 'titulo_principal',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-DOM-103',
        source: 'XHTML',
        field: 'class',
        token: 'p03_center_bold',
        semanticType: 'parrafo_destacado',
        nodeKind: 'semantic'
    },
    {
        id: 'SEM-DOM-104',
        source: 'XHTML',
        field: 'class',
        token: 'p01_body_cont',
        semanticType: 'parrafo',
        nodeKind: 'text'
    }
];

class SemanticRuleRegistry {
    /**
     * Busca una regla normativa exacta por origen, campo y token.
     * @param {string} sourceType - 'AST' o 'XHTML'
     * @param {string} field - Campo evaluado (ej. 'estiloParrafo', 'class')
     * @param {string} token - Valor exacto a buscar
     * @returns {Object|null} Regla normativa o nulo si no existe
     */
    static findRule(sourceType, field, token) {
        if (!sourceType || !field || !token) return null;
        const normalizedToken = String(token).trim();
        
        const found = RULES.find(r => 
            r.source === sourceType && 
            r.field === field && 
            r.token === normalizedToken
        );

        return found ? Object.freeze({ ...found }) : null;
    }

    /**
     * Retorna el conjunto completo de reglas inmutables (para auditoría).
     */
    static getAllRules() {
        return RULES.map(r => Object.freeze({ ...r }));
    }
}

module.exports = SemanticRuleRegistry;