'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const semanticMapPath = path.join(__dirname, '..', 'mappings', 'semantic-map.json');
if (!fs.existsSync(semanticMapPath)) {
    throw new Error(`No se encontró semantic-map.json en ${semanticMapPath}`);
}
const semanticMap = JSON.parse(fs.readFileSync(semanticMapPath, 'utf8'));

const UNKNOWN_STYLE_POLICY = 'reject';   // <-- importante

function mapParagraphStyle(styleId) {
    const rule = semanticMap.paragraphStyles?.[styleId];
    if (!rule) {
        if (UNKNOWN_STYLE_POLICY === 'reject') {
            throw new Error(`Estilo de párrafo no soportado: ${styleId}`);
        }
        return { semanticType: 'paragraph' };
    }
    return { semanticType: rule.semanticType || rule.type || 'paragraph' };
}

function mapCharacterStyle(styleId) {
    if (styleId === null || styleId === undefined) return null;
    const rule = semanticMap.characterStyles?.[styleId];
    if (!rule) {
        if (UNKNOWN_STYLE_POLICY === 'reject') {
            throw new Error(`Estilo de carácter no soportado: ${styleId}`);
        }
        return { semanticType: 'text' };
    }
    return { semanticType: rule.semanticType || rule.type || 'text' };
}

function sha256(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function extractNodeText(node) {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    return (node.children || []).map(extractNodeText).join('');
}

function compile(cidm) {
    if (!cidm || cidm.meta?.model !== 'CIDM-1.0') {
        throw new Error('El documento de entrada no es un CIDM-1.0 válido');
    }

    const extractorObj = cidm.meta?.provenance?.extractor;
    const extractorName =
        typeof extractorObj === 'object' && extractorObj !== null
            ? extractorObj.name || 'LexCore_Extract.jsx'
            : extractorObj || 'LexCore_Extract.jsx';
    const extractorVersion =
        typeof extractorObj === 'object' && extractorObj !== null
            ? extractorObj.version || '1.0.0'
            : cidm.meta?.provenance?.version || '1.0.0';

    const ledm = {
        meta: {
            model: 'LEDM-2.0',
            jurisdiction: 'CO',
            corpusId: cidm.meta?.source?.id || 'UNKNOWN',
            documentId: cidm.meta?.source?.id || 'UNKNOWN',
            version: {
                id: cidm.meta?.provenance?.version || 'v1',
                number: 1,
                status: 'CURRENT'
            }
        },
        provenance: {
            sourceType: cidm.meta?.source?.type || 'UNKNOWN',
            sourceId: cidm.meta?.source?.id || 'UNKNOWN',
            retrievedAt: cidm.meta?.createdAt || cidm.meta?.extractedAt || '',
            transformationsApplied: [
                { id: extractorName, version: extractorVersion },
                { id: 'SemanticCompiler', version: '2.0.0' }
            ]
        },
        integrity: {
            sourceHash: { algorithm: 'SHA-256', value: '' },
            contentHash: { algorithm: 'SHA-256', value: '' },
            ledmHash: { algorithm: 'SHA-256', value: '' }
        },
        structure: {
            type: 'constitution',
            title: cidm.meta?.source?.id || 'Documento',
            blocks: []
        }
    };

    for (const story of cidm.stories) {
        // Acepta blocks o paragraphs (por compatibilidad con tests antiguos)
        const items = story.blocks || story.paragraphs || [];
        for (const item of items) {
            const blockType = mapParagraphStyle(item.styleId).semanticType;
            const children = [];

            for (const frag of item.fragments || []) {
                // Acepta styleId (real) o characterStyleId (histórico)
                const fragStyleId = frag.styleId || frag.characterStyleId;
                const charRule = mapCharacterStyle(fragStyleId);
                const inlineType = charRule ? charRule.semanticType : 'text';

                if (inlineType === 'text') {
                    children.push({ type: 'text', text: frag.text });
                } else {
                    children.push({
                        type: inlineType,
                        children: [{ type: 'text', text: frag.text }]
                    });
                }
            }

            if (children.length === 0) {
                children.push({ type: 'text', text: item.text });
            }

            // Invariante forense
            const reconstructed = children.map(extractNodeText).join('');
            if (reconstructed !== item.text) {
                throw new Error(`Pérdida de fidelidad textual en bloque ${item.blockId || item.paragraphId}`);
            }

            ledm.structure.blocks.push({
                nodeId: item.blockId || item.paragraphId,
                type: blockType,
                children: children
            });
        }
    }

    // Hashes de integridad
    const sourceHashValue = sha256(cidm);
    const contentHashValue = sha256(ledm.structure);
    const ledmForHash = {
        meta: ledm.meta,
        provenance: ledm.provenance,
        structure: ledm.structure
    };
    const ledmHashValue = sha256(ledmForHash);

    ledm.integrity.sourceHash.value = sourceHashValue;
    ledm.integrity.contentHash.value = contentHashValue;
    ledm.integrity.ledmHash.value = ledmHashValue;

    return ledm;
}

module.exports = {
    compileCIDMToLEDM: compile,
    compile,
    semanticMap,
    UNKNOWN_STYLE_POLICY,
    extractNodeText
};