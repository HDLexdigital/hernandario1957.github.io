globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { n as LocalMirrorAdapter, t as TransactionRegistryService } from "./TransactionRegistryService_8q3Zg8vk.mjs";
import * as fs from "fs/promises";
import * as path from "path";
//#region src/services/cloud/CloudSyncService.ts
var CloudSyncService = class {
	adapter;
	registry = new TransactionRegistryService();
	constructor(adapter) {
		this.adapter = adapter || new LocalMirrorAdapter();
	}
	async syncCurrentRelease() {
		console.log(`[CLOUD-SYNC] Iniciando protocolo de sincronización remota vía [${this.adapter.providerName}]...`);
		const currentReleasePath = path.resolve(process.cwd(), "dist/releases/current.json");
		const currentRaw = await fs.readFile(currentReleasePath, "utf8").catch(() => null);
		if (!currentRaw) throw new Error("[CLOUD-SYNC] No existe una release local activa (dist/releases/current.json). Ejecute PublishWorker primero.");
		const txId = JSON.parse(currentRaw).activeTxId;
		const history = await this.registry.getHistory();
		const transaction = (Array.isArray(history) ? history : history.transactions || []).find((t) => t.txId === txId);
		if (!transaction) throw new Error(`[CLOUD-SYNC] La transacción de release ${txId} no se encuentra en el Ledger.`);
		const syncResult = await this.adapter.publishRelease(txId, transaction.artifacts || {});
		await this.registry.transitionStatus(txId, "published-remote", [`Sincronización remota exitosa en proveedor [${this.adapter.providerName}]`, `Puntero remoto activo: ${syncResult.remotePointerUrl}`]);
		console.log(`[CLOUD-SYNC] ☁️ Release [${txId}] replicada exitosamente en producción remota.`);
		return syncResult;
	}
};
//#endregion
//#region src/pages/api/cloud/sync.ts
var sync_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async () => {
	try {
		const result = await new CloudSyncService().syncCurrentRelease();
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
//#region \0virtual:astro:page:src/pages/api/cloud/sync@_@ts
var page = () => sync_exports;
//#endregion
export { page };
