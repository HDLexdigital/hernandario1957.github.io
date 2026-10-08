globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { f as renderHead, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/services/DiffEngineService.ts
var DiffEngineService = class {
	diffsBaseDir;
	constructor() {
		this.diffsBaseDir = path.resolve(process.cwd(), "dist/indexes/diffs");
	}
	/**
	* Algoritmo de diff simple a nivel de palabras para textos normativos.
	*/
	computeWordDiff(oldText, newText) {
		const oldWords = oldText.split(/\s+/);
		const newWords = newText.split(/\s+/);
		const changes = [];
		let i = 0, j = 0;
		while (i < oldWords.length || j < newWords.length) if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
			changes.push({
				type: "unchanged",
				text: oldWords[i]
			});
			i++;
			j++;
		} else {
			if (i < oldWords.length) {
				changes.push({
					type: "removed",
					text: oldWords[i]
				});
				i++;
			}
			if (j < newWords.length) {
				changes.push({
					type: "added",
					text: newWords[j]
				});
				j++;
			}
		}
		return changes;
	}
	/**
	* Genera, persiste y devuelve el diff entre dos versiones de un nodo.
	*/
	async compareAndPersist(nodeId, fromVersion, oldText, toVersion, newText) {
		const result = {
			nodeId,
			fromVersion,
			toVersion,
			changes: this.computeWordDiff(oldText, newText),
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		const nodeDiffDir = path.resolve(this.diffsBaseDir, nodeId);
		await fs.mkdir(nodeDiffDir, { recursive: true });
		const diffFilePath = path.resolve(nodeDiffDir, `${fromVersion}-${toVersion}.json`);
		await fs.writeFile(diffFilePath, JSON.stringify(result, null, 2), "utf8");
		console.log(`[DIFF-ENGINE] Diff generado para [${nodeId}] (${fromVersion} -> ${toVersion})`);
		return result;
	}
};
//#endregion
//#region src/pages/admin/diff.astro
var diff_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Diff,
	file: () => $$file,
	url: () => $$url
});
var $$Diff = createComponent(($$result, $$props, $$slots) => {
	const diffResult = new DiffEngineService().computeWordDiff("Artículo 13. Todas las personas nacen libres e iguales ante la ley y recibirán protección temporal.", "Artículo 13. Todas las personas nacen libres e iguales ante la ley y recibirán protección especial.");
	return renderTemplate`<html lang="es" data-astro-cid-nmnnc5iq><head><meta charset="utf-8"><title>LexDigitalHD - Comparador Jurídico (Diff Engine)</title>${renderHead($$result)}</head><body data-astro-cid-nmnnc5iq><aside data-astro-cid-nmnnc5iq><h2 data-astro-cid-nmnnc5iq>LexDigitalHD<br data-astro-cid-nmnnc5iq><span style="font-size: 0.8rem; color: #95a5a6;" data-astro-cid-nmnnc5iq>Control Plane</span></h2><a href="/admin" style="text-decoration: none;" data-astro-cid-nmnnc5iq><button class="nav-btn" data-astro-cid-nmnnc5iq>📊 Historial y Estado</button></a><button class="nav-btn active" data-astro-cid-nmnnc5iq>⚖️ Comparador Jurídico (Diff)</button><a href="/" style="color: #bdc3c7; text-decoration: none; font-size: 0.9rem; margin-top: auto;" data-astro-cid-nmnnc5iq>← Volver al sitio público</a></aside><main data-astro-cid-nmnnc5iq><div style="margin-bottom: 2rem;" data-astro-cid-nmnnc5iq><h1 style="margin: 0;" data-astro-cid-nmnnc5iq>Comparador Normativo</h1><p style="color: #666; margin-top: 0.5rem;" data-astro-cid-nmnnc5iq>Análisis de metamorfosis legislativa entre versiones (Artículo 13)</p></div><div class="card" data-astro-cid-nmnnc5iq><div class="meta" data-astro-cid-nmnnc5iq><div data-astro-cid-nmnnc5iq><strong data-astro-cid-nmnnc5iq>Nodo:</strong> art-13</div><div data-astro-cid-nmnnc5iq><strong data-astro-cid-nmnnc5iq>Versión Base:</strong> v1991 (1991-07-04)</div><div data-astro-cid-nmnnc5iq><strong data-astro-cid-nmnnc5iq>Versión Destino:</strong> v2026 (2026-01-15)</div></div><h3 style="border-bottom: 1px solid #eee; padding-bottom: 0.5rem;" data-astro-cid-nmnnc5iq>Resultado del Diff Estructurado</h3><div class="diff-container" data-astro-cid-nmnnc5iq>${diffResult.map((change) => {
		if (change.type === "added") return renderTemplate`<span class="added" data-astro-cid-nmnnc5iq>+${change.text} </span>`;
		else if (change.type === "removed") return renderTemplate`<span class="removed" data-astro-cid-nmnnc5iq>-${change.text} </span>`;
		else return renderTemplate`<span class="unchanged" data-astro-cid-nmnnc5iq>${change.text} </span>`;
	})}</div></div></main></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/admin/diff.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/admin/diff.astro";
var $$url = "/admin/diff";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/diff@_@astro
var page = () => diff_exports;
//#endregion
export { page };
