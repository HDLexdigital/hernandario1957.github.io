globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { f as renderHead, m as defineScriptVars, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/pages/buscar.astro
var buscar_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Buscar,
	file: () => $$file,
	url: () => $$url
});
var $$Buscar = createComponent(async ($$result, $$props, $$slots) => {
	let searchRaw = "{\"entries\": []}";
	try {
		const searchIndexPath = path.resolve(process.cwd(), `dist/indexes/search-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.json`);
		searchRaw = await fs.readFile(searchIndexPath, "utf8");
	} catch (e) {
		console.error("[ASTRO-ERROR] No se pudo leer el índice de búsqueda.");
	}
	return renderTemplate`<html lang="es" data-astro-cid-jm3jocdv><head><meta charset="utf-8"><title>Buscador Jurídico - LexDigitalHD</title>${renderHead($$result)}</head><body data-astro-cid-jm3jocdv><nav style="margin-bottom: 2rem;" data-astro-cid-jm3jocdv><a href="/" style="color: var(--accent); text-decoration: none;" data-astro-cid-jm3jocdv>← Volver al inicio</a></nav><h1 data-astro-cid-jm3jocdv>Buscador Semántico</h1><input type="text" id="searchInput" placeholder="Ingresa un término (ej. 'igualdad', 'artículo 13')..." autocomplete="off" data-astro-cid-jm3jocdv><div id="results" data-astro-cid-jm3jocdv><p style="color: #7f8c8d;" data-astro-cid-jm3jocdv>Esperando tu consulta...</p></div><!-- El script inyecta el JSON de búsqueda directamente en el cliente --><script>(function(){${defineScriptVars({ searchData: searchRaw })}
    const index = JSON.parse(searchData).entries;
    const input = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('results');

    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length < 3) {
        resultsDiv.innerHTML = '<p style="color: #7f8c8d;">Escribe al menos 3 letras para iniciar la búsqueda...</p>';
        return;
      }

      // Filtrar el índice en milisegundos
      const matches = index.filter(item => 
        item.content.includes(query) || item.title.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        resultsDiv.innerHTML = '<p style="color: #e74c3c;">No se encontraron resultados para esta consulta.</p>';
        return;
      }

      // Renderizar resultados con resaltado simple
      resultsDiv.innerHTML = matches.map(match => {
        // Un resaltado visual muy básico para el MVP
        const regex = new RegExp(\`(\${query})\`, 'gi');
        const highlightedContent = match.content.replace(regex, '<span class="highlight">$1</span>');
        
        return \`
          <div class="result-card">
            <h3><a href="\${match.href}">\${match.title}</a></h3>
            <p>\${highlightedContent.substring(0, 250)}...</p>
          </div>
        \`;
      }).join('');
    });
  })();<\/script></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/buscar.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/buscar.astro";
var $$url = "/buscar";
//#endregion
//#region \0virtual:astro:page:src/pages/buscar@_@astro
var page = () => buscar_exports;
//#endregion
export { page };
