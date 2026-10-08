globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { n as LocalMirrorAdapter, t as TransactionRegistryService } from "./TransactionRegistryService_8q3Zg8vk.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/services/RollbackWorker.ts
var RollbackWorker = class {
	adapter;
	registry = new TransactionRegistryService();
	releasesDir = path.resolve(process.cwd(), "dist/releases");
	constructor(adapter) {
		this.adapter = adapter || new LocalMirrorAdapter();
	}
	/**
	* Ejecuta el protocolo de rollback atómico tanto local como remoto.
	*/
	async executeRemoteRollback(authorizedBy = "Editorial-Admin") {
		const currentPath = path.resolve(this.releasesDir, "current.json");
		const previousPath = path.resolve(this.releasesDir, "previous.json");
		const currentRaw = await fs.readFile(currentPath, "utf8").catch(() => null);
		const previousRaw = await fs.readFile(previousPath, "utf8").catch(() => null);
		if (!currentRaw || !previousRaw) throw new Error("[ROLLBACK] Imposible ejecutar reversión: Se requiere tanto current.json como previous.json.");
		const currentData = JSON.parse(currentRaw);
		const previousData = JSON.parse(previousRaw);
		const badTxId = currentData.activeTxId;
		const targetTxId = previousData.activeTxId;
		if (badTxId === targetTxId) throw new Error(`[ROLLBACK] El release actual y el previo tienen el mismo TxID (${targetTxId}). Abortando.`);
		console.log(`[ROLLBACK-WORKER] Reversión iniciada: retirando [${badTxId}] -> restaurando [${targetTxId}]...`);
		await this.adapter.rollbackRelease(targetTxId);
		const restoredTimestamp = (/* @__PURE__ */ new Date()).toISOString();
		const newCurrent = {
			activeTxId: targetTxId,
			publishedAt: restoredTimestamp,
			environment: "production",
			restoredFromRollbackOf: badTxId,
			authorizedBy
		};
		await fs.writeFile(currentPath, JSON.stringify(newCurrent, null, 2), "utf8");
		await this.registry.transitionStatus(badTxId, "rolled-back", [`Transacción retirada de producción remota vía Rollback por [${authorizedBy}].`, `Puntero restaurado hacia: ${targetTxId}`]);
		await this.registry.transitionStatus(targetTxId, "published-remote", [`Transacción re-activada como producción activa tras rollback de [${badTxId}].`]);
		console.log(`[ROLLBACK-WORKER] 🔄 Rollback completado con éxito. Activo remoto y local: [${targetTxId}]`);
		return {
			success: true,
			rolledBackTxId: badTxId,
			restoredTxId: targetTxId,
			provider: this.adapter.providerName,
			timestamp: restoredTimestamp,
			message: `Rollback completado. Sistema restaurado a TX: ${targetTxId}`
		};
	}
};
//#endregion
//#region src/pages/api/cloud/rollback.ts
var rollback_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const author = (await request.json().catch(() => ({}))).authorizedBy || "Editorial-Admin (UI)";
		const result = await new RollbackWorker().executeRemoteRollback(author);
		return new Response(JSON.stringify({
			success: true,
			result
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			error: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/cloud/rollback@_@ts
var page = () => rollback_exports;
//#endregion
export { page };
