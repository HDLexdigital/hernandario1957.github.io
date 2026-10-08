globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { f as renderHead, m as defineScriptVars, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import { t as renderScript } from "./script_m2MhA6i2.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/pages/grafo.astro
var grafo_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Grafo,
	file: () => $$file,
	url: () => $$url
});
var $$Grafo = createComponent(async ($$result, $$props, $$slots) => {
	let graphRaw = "{\"nodes\":[],\"edges\":[]}";
	try {
		const graphPath = path.resolve(process.cwd(), `dist/indexes/graph-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.json`);
		graphRaw = await fs.readFile(graphPath, "utf8");
	} catch (e) {
		console.error("[ASTRO-ERROR] No se pudo leer el artefacto del grafo.");
	}
	return renderTemplate`<html lang="es" data-astro-cid-fnpjrn2u><head><meta charset="utf-8"><title>Grafo Jurídico - LexDigitalHD</title>${renderScript($$result, "/home/donache/hernandario1957.github.io/src/pages/grafo.astro?astro&type=script&index=0&lang.ts")}${renderHead($$result)}</head><body data-astro-cid-fnpjrn2u><header data-astro-cid-fnpjrn2u><div data-astro-cid-fnpjrn2u><h1 style="margin: 0; font-size: 1.2rem;" data-astro-cid-fnpjrn2u>Topología Normativa <span class="badge" data-astro-cid-fnpjrn2u>BETA</span></h1><span style="font-size: 0.8rem; color: #718093;" data-astro-cid-fnpjrn2u>Mapa de dependencias y referencias cruzadas</span></div><a href="/" data-astro-cid-fnpjrn2u>← Volver al inicio</a></header><div id="cy" data-astro-cid-fnpjrn2u></div><script>(function(){${defineScriptVars({ graphData: graphRaw })}
    const elements = JSON.parse(graphData);

    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#00a8ff',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'font-size': '10px',
            'width': 20,
            'height': 20
          }
        },
        {
          selector: 'node[type="section"]',
          style: {
            'background-color': '#9c88ff',
            'shape': 'square',
            'width': 25,
            'height': 25
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#353b48',
            'target-arrow-color': '#353b48',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8
          }
        }
      ],
      layout: {
        name: 'cose', // Layout de fuerzas para distribuir los nodos orgánicamente
        padding: 50,
        nodeRepulsion: 4000,
        idealEdgeLength: 100
      }
    });

    // Evento de clic: Navegar al artículo al tocar un nodo
    cy.on('tap', 'node', function(evt){
      const node = evt.target;
      window.location.href = node.data('href');
    });
  })();<\/script></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/grafo.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/grafo.astro";
var $$url = "/grafo";
//#endregion
//#region \0virtual:astro:page:src/pages/grafo@_@astro
var page = () => grafo_exports;
//#endregion
export { page };
