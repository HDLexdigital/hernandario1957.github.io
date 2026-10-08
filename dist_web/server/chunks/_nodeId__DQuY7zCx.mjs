globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { C as createAstro, a as Fragment, f as renderHead, i as renderComponent, p as addAttribute, u as renderTemplate, x as unescapeHTML } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/engine/CrossReferenceResolver.ts
var CrossReferenceResolver = class {
	/**
	* Analiza el texto plano y reemplaza menciones como "artículo 13" o "art. 86" 
	* por hipervínculos basados en el índice semántico (TOC).
	*/
	static resolve(text, toc) {
		if (!text) return text;
		return text.replace(/\b(art[ií]culo|art\.)\s+(\d+)\b/gi, (match, prefix, artNum) => {
			const targetSlug = `art-${artNum}`;
			const foundEntry = toc.entries.find((entry) => entry.href.includes(targetSlug));
			if (foundEntry) return `<a href="${foundEntry.href}" class="internal-xref" title="Ir a ${foundEntry.title}">${match}</a>`;
			return match;
		});
	}
};
//#endregion
//#region src/pages/[documentId]/[nodeId].astro
var _nodeId__exports = /* @__PURE__ */ __exportAll({
	default: () => $$NodeId,
	file: () => $$file,
	getStaticPaths: () => getStaticPaths,
	url: () => $$url
});
createAstro("https://astro.build");
async function getStaticPaths() {
	try {
		const tocPath = path.resolve(process.cwd(), `dist/indexes/toc-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.json`);
		console.log(`[ASTRO-DEBUG] Leyendo TOC desde: ${tocPath}`);
		const tocRaw = await fs.readFile(tocPath, "utf8");
		const tocData = JSON.parse(tocRaw);
		console.log(`[ASTRO-DEBUG] Entradas encontradas: ${tocData.entries.length}`);
		return tocData.entries.map((entry) => {
			const segments = entry.href.split("/").filter(Boolean);
			return {
				params: {
					documentId: segments[0],
					nodeId: segments[1]
				},
				props: {
					entry,
					toc: tocData
				}
			};
		});
	} catch (e) {
		console.error("[ASTRO-ERROR] Falló getStaticPaths:", e.message);
		return [];
	}
}
var $$NodeId = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$NodeId;
	const { entry, toc } = Astro.props;
	let contentHtml = `<p>Contenido no disponible.</p>`;
	try {
		let rawText = `El Estado promoverá las condiciones para que la igualdad sea real y efectiva, tal como se menciona en el artículo 13 y en concordancia con las normas superiores.`;
		if (entry.id === "art13") rawText = `Todas las personas nacen libres e iguales antes la ley, sin discriminación alguna. (Ver también el artículo 13).`;
		const resolvedText = CrossReferenceResolver.resolve(rawText, toc);
		contentHtml = `<h2>${entry.title}</h2><p>${resolvedText}</p>`;
	} catch (err) {
		contentHtml = `<p style="color:red">Error renderizando: ${err.message}</p>`;
	}
	return renderTemplate`<html lang="es" data-astro-cid-t7xlgfax><head><meta charset="utf-8"><title>${entry.title} - LexDigitalHD</title>${renderHead($$result)}</head><body data-astro-cid-t7xlgfax><aside data-astro-cid-t7xlgfax><h2 data-astro-cid-t7xlgfax>Índice Jurídico</h2><ul data-astro-cid-t7xlgfax>${toc.entries.map((item) => {
		const isActive = item.href === Astro.url.pathname;
		return renderTemplate`<li${addAttribute(`padding-left: ${(item.level - 1) * 12}px; list-style: none;`, "style")} data-astro-cid-t7xlgfax><a${addAttribute(item.href, "href")}${addAttribute(isActive ? "active" : "", "class")} data-astro-cid-t7xlgfax>${item.title}</a></li>`;
	})}</ul></aside><main data-astro-cid-t7xlgfax>${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result) => renderTemplate`${unescapeHTML(contentHtml)}` })}</main></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/[documentId]/[nodeId].astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/[documentId]/[nodeId].astro";
var $$url = "/[documentId]/[nodeId]";
//#endregion
//#region \0virtual:astro:page:src/pages/[documentId]/[nodeId]@_@astro
var page = () => _nodeId__exports;
//#endregion
export { page };
