globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { a as Fragment, f as renderHead, i as renderComponent, u as renderTemplate, x as unescapeHTML } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	let htmlContent = "<p>No se encontró ninguna compilación.</p>";
	let txId = "Ninguna";
	try {
		const indexPath = path.resolve(process.cwd(), `dist/indexes/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.json`);
		const indexRaw = await fs.readFile(indexPath, "utf8");
		txId = JSON.parse(indexRaw).currentTxId;
		const xhtmlPath = path.resolve(process.cwd(), `dist/builds/${txId}/xhtml/index.xhtml`);
		const rawXhtml = await fs.readFile(xhtmlPath, "utf8");
		const bodyMatch = rawXhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		if (bodyMatch) htmlContent = bodyMatch[1];
		else htmlContent = rawXhtml;
	} catch (err) {
		console.error("[ASTRO] Error leyendo el artefacto:", err);
		htmlContent = `<p style="color:red;">Error cargando el contrato C01-03: ${err.message}</p>`;
	}
	return renderTemplate`<html lang="es" data-astro-cid-lcdefpme><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LexDigitalHD - Visor del Contrato</title>${renderHead($$result)}</head><body data-astro-cid-lcdefpme><div class="status-bar" data-astro-cid-lcdefpme><strong data-astro-cid-lcdefpme>🟢 LEX-DIGITAL MOTOR ACTIVO</strong> | Renderizando Transacción: <code data-astro-cid-lcdefpme>${txId}</code></div><!-- Fase 3: Render SSR (Inyección del árbol transaccional) --><main data-astro-cid-lcdefpme>${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result) => renderTemplate`${unescapeHTML(htmlContent)}` })}</main></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/index.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
