// target indesign

// Helper para formatear fecha ISO 8601 sin milisegundos (determinista en formato)
function getIsoDate() {
    var d = new Date();
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getUTCFullYear() + "-" +
        pad(d.getUTCMonth() + 1) + "-" +
        pad(d.getUTCDate()) + "T" +
        pad(d.getUTCHours()) + ":" +
        pad(d.getUTCMinutes()) + ":" +
        pad(d.getUTCSeconds()) + "Z";
}

function padZero(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// Normalización de nombres de estilo para generar IDs estables
function createStyleId(prefix, nativeName) {
    var normalized = String(nativeName)
        .replace(/^\s+|\s+$/g, "")   // trim
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-");
    return prefix + "-" + normalized;
}

// 1. Configuración inicial
var doc = app.activeDocument;
var docName = doc.name;
var extractionDate = getIsoDate();

var cidm = {
    "meta": {
        "model": "CIDM-1.0",
        "source": {
            "type": "INDESIGN",
            "id": docName
        },
        "createdAt": extractionDate,
        "provenance": {
            "extractor": "LexCore_Extract.jsx",
            "version": "1.0.0"
        }
    },
    "styleDictionary": {},
    "stories": []
};

// 2. Recolector Topográfico (observador ciego)
var storyCounter = 1;

for (var i = 0; i < doc.stories.length; i++) {
    var currentStory = doc.stories[i];

    // Ignorar historias vacías o irrelevantes (ej. folios)
    if (currentStory.paragraphs.length === 0 || currentStory.contents === "") {
        continue;
    }

    var storyObj = {
        "storyId": "story-" + padZero(storyCounter, 3),
        "order": storyCounter,
        "blocks": []
    };

    var blockCounter = 1;

    for (var j = 0; j < currentStory.paragraphs.length; j++) {
        var currentPara = currentStory.paragraphs[j];

        // Eliminar solo el terminador de párrafo nativo de InDesign (\r)
        var rawText = currentPara.contents.replace(/\r$/, "");
        if (rawText === "") continue;

        // Registro de estilo nativo (observación, no interpretación)
        var pStyleName = currentPara.appliedParagraphStyle.name;
        var pStyleId = createStyleId("style-p", pStyleName);

        // Añadir al styleDictionary si no existe
        if (!cidm.styleDictionary[pStyleId]) {
            cidm.styleDictionary[pStyleId] = {
                "id": pStyleId,
                "name": pStyleName,
                "type": "paragraph",
                "properties": {
                    "nativeName": pStyleName
                }
            };
        }

        var blockObj = {
            "blockId": storyObj.storyId + "-b" + padZero(blockCounter, 4),
            "order": blockCounter,
            "text": rawText,
            "styleId": pStyleId,
            "fragments": []
        };

        // 3. Extracción de fragmentos (textStyleRanges)
        var ranges = currentPara.textStyleRanges;
        for (var k = 0; k < ranges.length; k++) {
            var range = ranges[k];
            // CORRECCIÓN FORENSE: Cortamos el desbordamiento nativo de InDesign
// tomando estrictamente la cadena hasta el primer salto de párrafo (\r)
		var rangeText = String(range.contents).split("\r")[0];
            if (rangeText === "") continue;

            var cStyleName = range.appliedCharacterStyle.name;
            var cStyleId = null;

            // Ignorar estilos nulos de InDesign
            if (cStyleName !== "[None]" && cStyleName !== "[Ninguno]") {
                cStyleId = createStyleId("style-c", cStyleName);

                if (!cidm.styleDictionary[cStyleId]) {
                    cidm.styleDictionary[cStyleId] = {
                        "id": cStyleId,
                        "name": cStyleName,
                        "type": "character",
                        "properties": {
                            "nativeName": cStyleName
                        }
                    };
                }
            }

            blockObj.fragments.push({
                "text": rangeText,
                "characterStyleId": cStyleId
            });
        }

        storyObj.blocks.push(blockObj);
        blockCounter++;
    }

    if (storyObj.blocks.length > 0) {
        cidm.stories.push(storyObj);
        storyCounter++;
    }
}

// 4. Serialización y guardado
var jsonString = JSON.stringify(cidm, null, 2);
var outputPath = Folder.desktop + "/" + docName.replace(/\.indd$/i, "") + "_CIDM.json";
var outFile = new File(outputPath);

outFile.encoding = "UTF-8";
outFile.open("w");
outFile.write(jsonString);
outFile.close();

alert("Auténtica Ingestión completada.\nCIDM guardado en:\n" + outputPath);