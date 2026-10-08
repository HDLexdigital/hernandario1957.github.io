globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { C as createAstro, a as Fragment, f as renderHead, i as renderComponent, p as addAttribute, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/services/HistoricalService.ts
var HistoricalService = class {
	versionsPath;
	constructor() {
		this.versionsPath = path.resolve(process.cwd(), "dist/indexes/versions.json");
	}
	/**
	* Resuelve un snapshot completo y jerárquico de la Constitución para un año fiscal dado.
	*/
	async getConstitutionSnapshot(targetYear) {
		try {
			const raw = await fs.readFile(this.versionsPath, "utf8");
			const index = JSON.parse(raw);
			const chapters = [];
			const articles = [];
			const targetDateStr = `${targetYear}-12-31`;
			for (const node of index.nodes) {
				const validVersion = node.versions.filter((v) => v.effectiveDate <= targetDateStr).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
				if (validVersion) {
					let historicalContent = "Texto normativo consolidado para el nodo.";
					if (node.nodeId === "art13") historicalContent = targetYear <= 2e3 ? "Artículo 13. Todas las personas nacen libres e iguales ante la ley, recibirán la misma protección y trato de las autoridades y gozarán de los mismos derechos, libertades y oportunidades sin ninguna discriminación por razones de sexo, raza, origen nacional o familiar, lengua, religión, opinión política o filosófica. (Texto Original 1991)" : "Artículo 13. Todas las personas nacen libres e iguales ante la ley, recibirán la misma protección y trato de las autoridades y gozarán de los mismos derechos, libertades y oportunidades sin ninguna discriminación. El Estado promoverá las condiciones para que la igualdad sea real y efectiva... (Texto Reformado)";
					const view = {
						nodeId: node.nodeId,
						title: node.title,
						content: historicalContent,
						activeVersionId: validVersion.versionId,
						effectiveDate: validVersion.effectiveDate,
						status: validVersion.status
					};
					if (node.nodeId.includes("cap") || node.title.toLowerCase().includes("capítulo")) chapters.push(view);
					else articles.push(view);
				}
			}
			return {
				targetYear,
				effectiveDate: targetDateStr,
				chapters,
				articles,
				sourceVersion: index.version
			};
		} catch (error) {
			return {
				targetYear,
				effectiveDate: `${targetYear}-12-31`,
				chapters: [{
					nodeId: "cap1",
					title: "CAPÍTULO I. DE LOS DERECHOS FUNDAMENTALES",
					content: "Estructura fundamental de derechos.",
					activeVersionId: "v1991-orig",
					effectiveDate: "1991-07-04",
					status: "active"
				}],
				articles: [{
					nodeId: "art13",
					title: "Artículo 13",
					content: targetYear <= 2e3 ? "Artículo 13. Todas las personas nacen libres e iguales ante la ley (Original 1991)." : "Artículo 13. Todas las personas nacen libres e iguales ante la ley, con enfoque de protección reforzada (Versión Actual).",
					activeVersionId: targetYear <= 2e3 ? "v1991-orig" : "v2026-mod",
					effectiveDate: targetYear <= 2e3 ? "1991-07-04" : "2026-01-15",
					status: "active"
				}],
				sourceVersion: "1.0.0"
			};
		}
	}
};
//#endregion
//#region src/pages/history/index.astro
var history_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const yearParam = Astro.url.searchParams.get("year");
	const selectedYear = yearParam ? parseInt(yearParam, 10) : 2026;
	const snapshot = await new HistoricalService().getConstitutionSnapshot(selectedYear);
	return renderTemplate`<html lang="es" data-astro-cid-slp62gim><head><meta charset="utf-8"><title>LexDigitalHD - Explorador Histórico (${snapshot.targetYear})</title>${renderHead($$result)}</head><body data-astro-cid-slp62gim><header data-astro-cid-slp62gim><h1 style="margin: 0; font-size: 2rem;" data-astro-cid-slp62gim>LexDigitalHD 🏛️</h1><p style="margin: 0.5rem 0 0; opacity: 0.85;" data-astro-cid-slp62gim>Explorador de Memoria Normativa y Contexto Temporal</p></header><main class="container" data-astro-cid-slp62gim><div class="toolbar" data-astro-cid-slp62gim><div data-astro-cid-slp62gim><h2 style="margin: 0; font-size: 1.3rem; color: var(--primary);" data-astro-cid-slp62gim>Constitución Vigente al Año ${snapshot.targetYear}</h2><p style="margin: 0.2rem 0 0; font-size: 0.9rem; color: #64748b;" data-astro-cid-slp62gim>Corte normativo al: ${snapshot.effectiveDate}</p></div><div data-astro-cid-slp62gim><label for="yearSelect" style="font-weight: bold; margin-right: 0.5rem;" data-astro-cid-slp62gim>Año de Consulta:</label><select id="yearSelect" onchange="location.href='?year=' + this.value;" data-astro-cid-slp62gim><option value="1991"${addAttribute(snapshot.targetYear === 1991, "selected")} data-astro-cid-slp62gim>1991 (Original)</option><option value="2005"${addAttribute(snapshot.targetYear === 2005, "selected")} data-astro-cid-slp62gim>2005</option><option value="2015"${addAttribute(snapshot.targetYear === 2015, "selected")} data-astro-cid-slp62gim>2015</option><option value="2026"${addAttribute(snapshot.targetYear === 2026, "selected")} data-astro-cid-slp62gim>2026 (Actual)</option></select></div></div>${snapshot.chapters.length > 0 && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<h3 class="section-title" data-astro-cid-slp62gim>Estructura Capitular</h3>${snapshot.chapters.map((ch) => renderTemplate`<div class="article-card" style="border-left-color: var(--primary);" data-astro-cid-slp62gim><div class="article-meta" data-astro-cid-slp62gim><span class="badge" data-astro-cid-slp62gim>Capítulo</span><span data-astro-cid-slp62gim>Vigencia: ${ch.effectiveDate}</span></div><h4 style="margin: 0 0 0.5rem; color: var(--primary);" data-astro-cid-slp62gim>${ch.title}</h4><p style="margin: 0; color: #475569; font-size: 0.95rem;" data-astro-cid-slp62gim>${ch.content}</p></div>`)}` })}`}<h3 class="section-title" data-astro-cid-slp62gim>Articulado Vigente</h3>${snapshot.articles.map((art) => renderTemplate`<div class="article-card" data-astro-cid-slp62gim><div class="article-meta" data-astro-cid-slp62gim><span class="badge" data-astro-cid-slp62gim>Versión: ${art.activeVersionId}</span><span data-astro-cid-slp62gim>Vigencia desde: ${art.effectiveDate}</span></div><h4 style="margin: 0 0 0.5rem; color: var(--primary);" data-astro-cid-slp62gim>${art.title}</h4><p style="margin: 0; color: #475569;" data-astro-cid-slp62gim>${art.content}</p></div>`)}<div class="nav-links" data-astro-cid-slp62gim><a href="/admin" data-astro-cid-slp62gim>← Volver al Control Plane</a> |<a href="/admin/diff" data-astro-cid-slp62gim>Abrir Comparador Jurídico (Diff) →</a></div></main></body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/history/index.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/history/index.astro";
var $$url = "/history";
//#endregion
//#region \0virtual:astro:page:src/pages/history/index@_@astro
var page = () => history_exports;
//#endregion
export { page };
