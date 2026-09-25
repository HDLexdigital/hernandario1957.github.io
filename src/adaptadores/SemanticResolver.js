const reAccentMap = {'á':'a', 'é':'e', 'í':'i', 'ó':'o', 'ú':'u', 'ñ':'n', 'Á':'a', 'É':'e', 'Í':'i', 'Ó':'o', 'Ú':'u', 'Ñ':'n'};

function _sanitizeSelector(name) {
    if (!name) return "estilo";
    let str = String(name).replace(/\[\vert{}\]/g, "");
    for (let k in reAccentMap) {
        if (Object.prototype.hasOwnProperty.call(reAccentMap, k)) {
            str = str.split(k).join(reAccentMap[k]);
        }
    }
    str = str.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    if (!str) return "estilo";
    if (/^[0-9]/.test(str)) str = "estilo-" + str;
    return str;
}

function indexSemanticMap(semanticMap) {
    const index = {};
    if (!semanticMap || !Array.isArray(semanticMap.styles)) return index;
    for (let i = 0; i < semanticMap.styles.length; i++) {
        const item = semanticMap.styles[i];
        if (item && item.originalName) {
            const epub = (item.exportTagging && item.exportTagging.epub) ? item.exportTagging.epub : {};
            index[item.originalName] = {
                tag: (epub.tag && epub.tag !== "") ? epub.tag : null,
                className: (epub.className && epub.className !== "") ? epub.className : null
            };
        }
    }
    return index;
}

function resolveStyleName(styleName, isCharacter, profileStyleMap, indexedSemanticMap) {
    if (!styleName || styleName === "[Ninguno]" || styleName === "None") {
        return { styleName, resolvedTag: null, resolvedClass: null };
    }
    const profileEntry = (profileStyleMap && profileStyleMap[styleName]) ? profileStyleMap[styleName] : null;
    const semanticEntry = (indexedSemanticMap && indexedSemanticMap[styleName]) ? indexedSemanticMap[styleName] : null;

    let resolvedTag = (profileEntry && profileEntry.tag) ? profileEntry.tag : ((semanticEntry && semanticEntry.tag) ? semanticEntry.tag : (isCharacter ? "span" : "p"));
    let resolvedClass = (profileEntry && (profileEntry.class || profileEntry.className)) ? (profileEntry.class || profileEntry.className) : ((semanticEntry && semanticEntry.className) ? semanticEntry.className : _sanitizeSelector(styleName));

    return { styleName, resolvedTag, resolvedClass };
}

module.exports = { indexSemanticMap, resolveStyleName, _sanitizeSelector };
