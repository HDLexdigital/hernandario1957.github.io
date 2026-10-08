globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { C as createAstro, f as renderHead, p as addAttribute, u as renderTemplate } from "./server_BPsUEsWZ.mjs";
import { t as createComponent } from "./compiler_Cd_eSXBY.mjs";
import { t as renderScript } from "./script_m2MhA6i2.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/services/corpora/CorpusRegistryService.ts
var CorpusRegistryService = class {
	registryPath = path.resolve(process.cwd(), "dist/corpora/registry.json");
	async getRegistry() {
		try {
			const raw = await fs.readFile(this.registryPath, "utf8");
			return JSON.parse(raw);
		} catch {
			return {
				version: "1.0.0",
				defaultCorpusId: "co-constitucion-1991",
				corpora: { "co-constitucion-1991": {
					corpusId: "co-constitucion-1991",
					slug: "constitucion",
					title: "Constitución Política de Colombia",
					shortTitle: "CP 1991",
					jurisdiction: "CO",
					type: "constitution",
					promulgationDate: "1991-07-04",
					activeRelease: null,
					status: "active",
					createdAt: (/* @__PURE__ */ new Date()).toISOString(),
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				} }
			};
		}
	}
	async saveRegistry(schema) {
		await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
		await fs.writeFile(this.registryPath, JSON.stringify(schema, null, 2), "utf8");
	}
	async registerCorpus(corpus) {
		const registry = await this.getRegistry();
		registry.corpora[corpus.corpusId] = {
			...corpus,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		await this.saveRegistry(registry);
	}
	async resolveCorpus(identifier) {
		const registry = await this.getRegistry();
		return registry.corpora[identifier] || Object.values(registry.corpora).find((c) => c.slug === identifier) || null;
	}
};
//#endregion
//#region src/services/corpora/CorporaPathResolver.ts
var CorporaPathResolver = class {
	static defaultSlug = "constitucion";
	static getCorpusDir(slugOrId = this.defaultSlug) {
		const cleanSlug = slugOrId.replace(/^co-/, "").replace(/-\d{4}$/, "");
		return path.resolve(process.cwd(), `dist/corpora/${cleanSlug}`);
	}
	static getBuildsDir(corpusSlug) {
		return path.resolve(this.getCorpusDir(corpusSlug), "builds");
	}
	static getHistoryPath(corpusSlug) {
		return path.resolve(this.getBuildsDir(corpusSlug), "history.json");
	}
	static getReleasesDir(corpusSlug) {
		return path.resolve(this.getCorpusDir(corpusSlug), "releases");
	}
	static getIndexesDir(corpusSlug) {
		return path.resolve(this.getCorpusDir(corpusSlug), "indexes");
	}
	static getVersionsPath(corpusSlug) {
		return path.resolve(this.getIndexesDir(corpusSlug), "versions.json");
	}
	static getImpactPath(corpusSlug) {
		return path.resolve(this.getIndexesDir(corpusSlug), "impact-metrics.json");
	}
	static getSearchPath(corpusSlug) {
		return path.resolve(this.getIndexesDir(corpusSlug), "search.json");
	}
	static getGraphPath(corpusSlug) {
		return path.resolve(this.getIndexesDir(corpusSlug), "graph.json");
	}
};
//#endregion
//#region src/pages/admin/index.astro
var admin_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	async function safeReadJson(absolutePath) {
		try {
			const raw = await fs.readFile(absolutePath, "utf8");
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}
	const registry = await new CorpusRegistryService().getRegistry();
	const corporaList = Object.values(registry.corpora);
	const selectedSlug = Astro.url.searchParams.get("corpus") || "constitucion";
	const activeCorpus = corporaList.find((c) => c.slug === selectedSlug) || corporaList[0];
	CorporaPathResolver.getBuildsDir(activeCorpus.slug);
	const corpusReleasesDir = CorporaPathResolver.getReleasesDir(activeCorpus.slug);
	const corpusIndexesDir = CorporaPathResolver.getIndexesDir(activeCorpus.slug);
	const historyPath = CorporaPathResolver.getHistoryPath(activeCorpus.slug);
	const currentReleasePath = path.resolve(corpusReleasesDir, "current.json");
	const previousReleasePath = path.resolve(corpusReleasesDir, "previous.json");
	const impactPath = path.resolve(corpusIndexesDir, "impact-metrics.json");
	const versionsPath = path.resolve(corpusIndexesDir, "versions.json");
	const remoteMirrorPath = path.resolve(process.cwd(), `dist/cloud-mirror/releases/${activeCorpus.slug}/current.json`);
	const currentRelease = await safeReadJson(currentReleasePath);
	const previousRelease = await safeReadJson(previousReleasePath);
	await safeReadJson(remoteMirrorPath);
	const impactData = await safeReadJson(impactPath);
	const historyData = await safeReadJson(historyPath);
	const versionsData = await safeReadJson(versionsPath);
	const transactions = Array.isArray(historyData) ? historyData : historyData?.transactions || [];
	const latestTxs = transactions.slice(-6).reverse();
	const totalBuilds = transactions.length;
	const failedBuilds = transactions.filter((tx) => tx.status === "failed").length;
	const successRate = totalBuilds === 0 ? 0 : Math.round((totalBuilds - failedBuilds) / totalBuilds * 100);
	const mutatedArticles = impactData?.mostMutatedArticles?.slice(0, 5) || [];
	const totalNodes = versionsData?.nodes?.length || 0;
	return renderTemplate`<html lang="es" data-astro-cid-nsou3le4><head><meta charset="utf-8"><title>LexDigitalHD - Control Plane Multi-Corpus</title>${renderHead($$result)}</head><body data-astro-cid-nsou3le4><aside data-astro-cid-nsou3le4><h2 style="border-bottom: 1px solid #2c3e50; padding-bottom: 0.8rem;" data-astro-cid-nsou3le4>LexDigitalHD<br data-astro-cid-nsou3le4><span style="font-size: 0.8rem; font-weight: 400; color: #95a5a6;" data-astro-cid-nsou3le4>Control Plane Multi-Tenant</span></h2><!-- SELECTOR GLOBAL DE CORPUS --><div class="corpus-selector-box" data-astro-cid-nsou3le4><label for="corpusDropdown" style="font-size: 0.75rem; text-transform: uppercase; color: #95a5a6; display: block; margin-bottom: 0.4rem; font-weight: 600;" data-astro-cid-nsou3le4>Corpus Jurídico Activo</label><select id="corpusDropdown" class="corpus-select" onchange="location.href='?corpus=' + this.value;" data-astro-cid-nsou3le4>${corporaList.map((c) => renderTemplate`<option${addAttribute(c.slug, "value")}${addAttribute(c.slug === activeCorpus.slug, "selected")} data-astro-cid-nsou3le4>${c.shortTitle ? `[${c.shortTitle}] ` : ""}${c.title}</option>`)}</select></div><a${addAttribute(`/admin?corpus=${activeCorpus.slug}`, "href")} style="color: #fff; text-decoration: none; padding: 0.8rem; background: #2c3e50; border-radius: 4px; margin-bottom: 0.5rem;" data-astro-cid-nsou3le4>📊 Panel de Control</a><a${addAttribute(`/history?corpus=${activeCorpus.slug}`, "href")} style="color: #bdc3c7; text-decoration: none; padding: 0.8rem;" data-astro-cid-nsou3le4>🏛️ Explorador Histórico</a><a${addAttribute(`/admin/diff?corpus=${activeCorpus.slug}`, "href")} style="color: #bdc3c7; text-decoration: none; padding: 0.8rem;" data-astro-cid-nsou3le4>⚖️ Comparador Normativo</a><a href="/" style="color: #bdc3c7; text-decoration: none; padding: 0.8rem; margin-top: auto;" data-astro-cid-nsou3le4>← Volver al Portal</a></aside><main data-astro-cid-nsou3le4><!-- CABECERA DEL CONTEXTO NORMATIVO --><div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem;" data-astro-cid-nsou3le4><div data-astro-cid-nsou3le4><h1 style="margin: 0; font-size: 1.6rem; color: var(--sidebar);" data-astro-cid-nsou3le4>${activeCorpus.title}</h1><div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 0.3rem;" data-astro-cid-nsou3le4>ID Canónico: <code data-astro-cid-nsou3le4>${activeCorpus.corpusId}</code> | Jurisdicción: <strong data-astro-cid-nsou3le4>${activeCorpus.jurisdiction}</strong> | Promulgación: ${activeCorpus.promulgationDate}</div></div><div data-astro-cid-nsou3le4><span class="badge success" style="font-size: 0.85rem;" data-astro-cid-nsou3le4>${activeCorpus.status}</span></div></div><!-- 1. MÉTRICAS EJECUTIVAS DEL CORPUS --><div class="grid-4" data-astro-cid-nsou3le4><div class="card" style="border-bottom: 4px solid var(--success);" data-astro-cid-nsou3le4><div class="metric-label" data-astro-cid-nsou3le4>Pipeline Health</div><div class="metric-value" data-astro-cid-nsou3le4>${successRate}%</div><div style="font-size: 0.8rem; color: #7f8c8d;" data-astro-cid-nsou3le4>${totalBuilds} Builds en Ledger</div></div><div class="card" style="border-bottom: 4px solid var(--accent);" data-astro-cid-nsou3le4><div class="metric-label" data-astro-cid-nsou3le4>Nodos Normativos</div><div class="metric-value" data-astro-cid-nsou3le4>${totalNodes}</div><div style="font-size: 0.8rem; color: #7f8c8d;" data-astro-cid-nsou3le4>Estructura versions.json</div></div><div class="card" style="border-bottom: 4px solid var(--warning);" data-astro-cid-nsou3le4><div class="metric-label" data-astro-cid-nsou3le4>Mutaciones Registradas</div><div class="metric-value" data-astro-cid-nsou3le4>${impactData ? impactData.globalStabilityIndex : 0}</div><div style="font-size: 0.8rem; color: #7f8c8d;" data-astro-cid-nsou3le4>Reformas Históricas</div></div><div class="card" style="border-bottom: 4px solid var(--sidebar);" data-astro-cid-nsou3le4><div class="metric-label" data-astro-cid-nsou3le4>Estado de Producción</div><div class="metric-value" style="font-size: 1.1rem; margin-top: 0.8rem;" data-astro-cid-nsou3le4>${currentRelease ? renderTemplate`<span class="badge success" data-astro-cid-nsou3le4>PUBLICADO</span>` : renderTemplate`<span class="badge failed" data-astro-cid-nsou3le4>SIN DESPLIEGUE</span>`}</div></div></div><!-- 2. GESTIÓN DE RELEASES AISLADAS --><div class="grid-2" data-astro-cid-nsou3le4><div class="card" data-astro-cid-nsou3le4><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;" data-astro-cid-nsou3le4><h3 style="margin: 0;" data-astro-cid-nsou3le4>Releases & Despliegue</h3><div data-astro-cid-nsou3le4><button class="btn btn-sync"${addAttribute(`triggerSync('${activeCorpus.slug}')`, "onclick")} data-astro-cid-nsou3le4>☁️ Replicar</button>${previousRelease && renderTemplate`<button class="btn btn-rollback"${addAttribute(`triggerRollback('${activeCorpus.slug}')`, "onclick")} data-astro-cid-nsou3le4>🔄 Rollback</button>`}</div></div>${currentRelease ? renderTemplate`<div class="release-box" data-astro-cid-nsou3le4><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;" data-astro-cid-nsou3le4><strong data-astro-cid-nsou3le4>Release Activa</strong><span class="badge success" data-astro-cid-nsou3le4>Current</span></div><div style="font-size: 0.85rem; color: #555;" data-astro-cid-nsou3le4><div data-astro-cid-nsou3le4><strong data-astro-cid-nsou3le4>TX-ID:</strong> <code data-astro-cid-nsou3le4>${currentRelease.activeTxId}</code></div><div data-astro-cid-nsou3le4><strong data-astro-cid-nsou3le4>Fecha:</strong> ${new Date(currentRelease.publishedAt).toLocaleString()}</div></div></div>` : renderTemplate`<p style="color: #7f8c8d; font-size: 0.9rem;" data-astro-cid-nsou3le4>No hay release publicada para este corpus.</p>`}${previousRelease && renderTemplate`<div class="release-box previous" data-astro-cid-nsou3le4><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;" data-astro-cid-nsou3le4><strong data-astro-cid-nsou3le4>Versión de Respaldo</strong><span class="badge" style="background: #e2e8f0; color: #475569;" data-astro-cid-nsou3le4>Rollback Target</span></div><div style="font-size: 0.85rem; color: #555;" data-astro-cid-nsou3le4><div data-astro-cid-nsou3le4><strong data-astro-cid-nsou3le4>TX-ID:</strong> <code data-astro-cid-nsou3le4>${previousRelease.activeTxId}</code></div></div></div>`}</div><!-- 3. IMPACT ANALYZER ESPECÍFICO --><div class="card" data-astro-cid-nsou3le4><h3 data-astro-cid-nsou3le4>Analizador de Impacto (${activeCorpus.shortTitle || activeCorpus.slug})</h3><p style="font-size: 0.85rem; color: #7f8c8d; margin-top: -0.5rem;" data-astro-cid-nsou3le4>Artículos con mayor tasa de modificación.</p>${mutatedArticles.length > 0 ? renderTemplate`<div class="bar-chart" data-astro-cid-nsou3le4>${mutatedArticles.map((art) => {
		const maxScore = mutatedArticles[0].mutationIndexScore || 1;
		const width = Math.max(5, art.mutationIndexScore / maxScore * 100);
		return renderTemplate`<div class="bar-row" data-astro-cid-nsou3le4><div class="bar-label"${addAttribute(art.title, "title")} data-astro-cid-nsou3le4>${art.nodeId}</div><div class="bar-track" data-astro-cid-nsou3le4><div class="bar-fill"${addAttribute(`width: ${width}%;`, "style")} data-astro-cid-nsou3le4></div></div><div class="bar-value" data-astro-cid-nsou3le4>${art.totalReforms} ref.</div></div>`;
	})}</div>` : renderTemplate`<p style="color: #7f8c8d; font-size: 0.9rem;" data-astro-cid-nsou3le4>Sin datos de impacto generados para este corpus.</p>`}</div></div><!-- 4. LEDGER AISLADO --><div class="card" data-astro-cid-nsou3le4><h3 data-astro-cid-nsou3le4>Ledger de Transacciones: <code data-astro-cid-nsou3le4>${activeCorpus.slug}/builds/history.json</code></h3><table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 1rem;" data-astro-cid-nsou3le4><thead data-astro-cid-nsou3le4><tr style="border-bottom: 2px solid #ecf0f1; color: #7f8c8d; font-size: 0.85rem;" data-astro-cid-nsou3le4><th style="padding: 0.5rem;" data-astro-cid-nsou3le4>TX-ID</th><th style="padding: 0.5rem;" data-astro-cid-nsou3le4>Fecha</th><th style="padding: 0.5rem;" data-astro-cid-nsou3le4>Estado</th><th style="padding: 0.5rem;" data-astro-cid-nsou3le4>Detalles / Logs</th></tr></thead><tbody data-astro-cid-nsou3le4>${latestTxs.length > 0 ? latestTxs.map((tx) => {
		let badgeClass = "failed";
		if (tx.status === "success") badgeClass = "success";
		if (tx.status === "published" || tx.status === "published-remote") badgeClass = "success";
		if (tx.status === "rolled-back") badgeClass = "rolled-back";
		return renderTemplate`<tr style="border-bottom: 1px solid #ecf0f1; font-size: 0.85rem;" data-astro-cid-nsou3le4><td style="padding: 0.8rem; font-family: monospace;" data-astro-cid-nsou3le4>${tx.txId}</td><td style="padding: 0.8rem;" data-astro-cid-nsou3le4>${new Date(tx.timestamp).toLocaleString()}</td><td style="padding: 0.8rem;" data-astro-cid-nsou3le4><span${addAttribute(`badge ${badgeClass}`, "class")} data-astro-cid-nsou3le4>${tx.status}</span></td><td style="padding: 0.8rem; color: #555;" data-astro-cid-nsou3le4>${tx.logs && tx.logs.length > 0 ? tx.logs[tx.logs.length - 1] : "Sin logs"}</td></tr>`;
	}) : renderTemplate`<tr data-astro-cid-nsou3le4><td colspan="4" style="padding: 1rem; text-align: center; color: #7f8c8d;" data-astro-cid-nsou3le4>No hay transacciones registradas para este corpus aún.</td></tr>`}</tbody></table></div></main>${renderScript($$result, "/home/donache/hernandario1957.github.io/src/pages/admin/index.astro?astro&type=script&index=0&lang.ts")}</body></html>`;
}, "/home/donache/hernandario1957.github.io/src/pages/admin/index.astro", void 0);
var $$file = "/home/donache/hernandario1957.github.io/src/pages/admin/index.astro";
var $$url = "/admin";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/index@_@astro
var page = () => admin_exports;
//#endregion
export { page };
