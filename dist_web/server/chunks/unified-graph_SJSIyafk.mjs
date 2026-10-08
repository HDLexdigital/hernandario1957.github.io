globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { f as renderHead, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import fs from "node:fs";
import path from "node:path";
//#region src/pages/admin/unified-graph.astro
var unified_graph_exports = /* @__PURE__ */ __exportAll({
	default: () => $$UnifiedGraph,
	file: () => $$file,
	url: () => $$url
});
var $$UnifiedGraph = createComponent(($$result, $$props, $$slots) => {
	const publicDir = path.resolve(process.cwd(), "public");
	const centralityRaw = fs.readFileSync(path.join(publicDir, "api/v1/metrics/centrality.json"), "utf8");
	const corporaRaw = fs.readFileSync(path.join(publicDir, "api/v1/corpora.json"), "utf8");
	const art86ImpactRaw = fs.readFileSync(path.join(publicDir, "api/v1/impact/co/constitucion/art/86.json"), "utf8");
	const centrality = JSON.parse(centralityRaw);
	JSON.parse(corporaRaw);
	JSON.parse(art86ImpactRaw);
	return renderTemplate`<html lang="es" data-astro-cid-ovvitu7z><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin: Grafo Legal Unificado — LexDigitalHD</title>${renderHead($$result)}</head><body data-astro-cid-ovvitu7z><div class="container" data-astro-cid-ovvitu7z><header style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5rem;" data-astro-cid-ovvitu7z><h1 data-astro-cid-ovvitu7z>Grafo Legal Unificado (Admin)</h1><span class="badge" data-astro-cid-ovvitu7z>API v${centrality.meta.apiVersion}</span></header><div class="disclaimer" role="note" data-astro-cid-ovvitu7z><strong data-astro-cid-ovvitu7z>⚠️ Descargo Computacional de Métricas de Red:</strong><br data-astro-cid-ovvitu7z>${centrality.meta.computationalDisclaimer}</div><div class="card" data-astro-cid-ovvitu7z><h3 data-astro-cid-ovvitu7z>Trazabilidad Criptográfica</h3><p data-astro-cid-ovvitu7z>SHA-256 del Grafo Origen: <span class="code" data-astro-cid-ovvitu7z>${centrality.meta.sourceGraphSha256}</span></p><p data-astro-cid-ovvitu7z>Generado en: <span class="code" data-astro-cid-ovvitu7z>${centrality.meta.generatedAt}</span></p></div><div class="card" data-astro-cid-ovvitu7z><h3 data-astro-cid-ovvitu7z>Centralidad Topológica Global (PageRank)</h3><table data-astro-cid-ovvitu7z><thead data-astro-cid-ovvitu7z><tr data-astro-cid-ovvitu7z><th data-astro-cid-ovvitu7z>Rank</th><th data-astro-cid-ovvitu7z>ID Global</th><th data-astro-cid-ovvitu7z>Denominación</th><th data-astro-cid-ovvitu7z>In-Degree</th><th data-astro-cid-ovvitu7z>Puntaje</th></tr></thead><tbody data-astro-cid-ovvitu7z>${centrality.topCentralNodes.map((n) => renderTemplate`<tr data-astro-cid-ovvitu7z><td data-astro-cid-ovvitu7z><span class="badge" data-astro-cid-ovvitu7z>#${n.rank}</span></td><td class="code" data-astro-cid-ovvitu7z>${n.globalId}</td><td data-astro-cid-ovvitu7z>${n.title}</td><td data-astro-cid-ovvitu7z>${n.inDegree}</td><td data-astro-cid-ovvitu7z>${(n.authorityScore * 100).toFixed(4)}%</td></tr>`)}</tbody></table></div></div></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/admin/unified-graph.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/admin/unified-graph.astro";
var $$url = "/admin/unified-graph";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/unified-graph@_@astro
var page = () => unified_graph_exports;
//#endregion
export { page };
