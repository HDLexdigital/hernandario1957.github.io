globalThis.process ??= {};
globalThis.process.env ??= {};
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto$1 from "crypto";
import crypto from "crypto";
//#region src/services/cloud/LocalMirrorAdapter.ts
var LocalMirrorAdapter = class {
	providerName = "local-mirror";
	mirrorRootDir;
	constructor() {
		this.mirrorRootDir = path.resolve(process.cwd(), "dist/cloud-mirror");
	}
	async publishRelease(txId, artifacts) {
		const startTime = (/* @__PURE__ */ new Date()).toISOString();
		const remoteTxDir = path.resolve(this.mirrorRootDir, `releases/${txId}`);
		await fs.mkdir(remoteTxDir, { recursive: true });
		let uploadedFiles = 0;
		let uploadedBytes = 0;
		for (const [name, record] of Object.entries(artifacts)) {
			const art = record;
			if (!art.path) continue;
			const sourceBuffer = await fs.readFile(art.path);
			const destPath = path.resolve(remoteTxDir, path.basename(art.path));
			await fs.writeFile(destPath, sourceBuffer);
			if (crypto.createHash("sha256").update(sourceBuffer).digest("hex") !== art.sha256) throw new Error(`[LOCAL-MIRROR] Error de paridad en ${name}: Hash remoto corrupto.`);
			uploadedFiles++;
			uploadedBytes += art.sizeBytes || sourceBuffer.length;
		}
		const remoteCurrentPath = path.resolve(this.mirrorRootDir, "current.json");
		const remotePointerData = {
			activeTxId: txId,
			publishedAt: startTime,
			provider: this.providerName,
			artifactsCount: uploadedFiles
		};
		await fs.writeFile(remoteCurrentPath, JSON.stringify(remotePointerData, null, 2), "utf8");
		return {
			success: true,
			provider: this.providerName,
			txId,
			uploadedFiles,
			uploadedBytes,
			publishedAt: startTime,
			remotePointerUrl: `file://${remoteCurrentPath}`
		};
	}
	async rollbackRelease(targetTxId) {
		const remoteCurrentPath = path.resolve(this.mirrorRootDir, "current.json");
		const targetDir = path.resolve(this.mirrorRootDir, `releases/${targetTxId}`);
		if (!await fs.stat(targetDir).catch(() => false)) throw new Error(`[LOCAL-MIRROR] El release ${targetTxId} no existe en el destino remoto.`);
		const remotePointerData = {
			activeTxId: targetTxId,
			rolledBackAt: (/* @__PURE__ */ new Date()).toISOString(),
			provider: this.providerName
		};
		await fs.writeFile(remoteCurrentPath, JSON.stringify(remotePointerData, null, 2), "utf8");
		return true;
	}
};
//#endregion
//#region src/services/TransactionRegistryService.ts
var TransactionRegistryService = class {
	historyPath = path.resolve(process.cwd(), "dist/builds/history.json");
	async getHistory() {
		try {
			const raw = await fs.readFile(this.historyPath, "utf8");
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : parsed.transactions || [];
		} catch {
			return [];
		}
	}
	async saveHistory(transactions) {
		await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
		await fs.writeFile(this.historyPath, JSON.stringify(transactions, null, 2), "utf8");
	}
	async initTransaction(txId) {
		const txs = await this.getHistory();
		txs.push({
			txId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			status: "processing",
			artifacts: {},
			logs: []
		});
		await this.saveHistory(txs);
	}
	async attachArtifact(txId, name, record) {
		const txs = await this.getHistory();
		const tx = txs.find((t) => t.txId === txId);
		if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);
		tx.artifacts = tx.artifacts || {};
		tx.artifacts[name] = record;
		await this.saveHistory(txs);
	}
	async transitionStatus(txId, status, logs) {
		const txs = await this.getHistory();
		const tx = txs.find((t) => t.txId === txId);
		if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);
		tx.status = status;
		tx.logs = (tx.logs || []).concat(logs);
		await this.saveHistory(txs);
	}
	async computeArtifactRecord(filePath) {
		const buffer = await fs.readFile(filePath);
		return {
			path: filePath,
			sha256: crypto$1.createHash("sha256").update(buffer).digest("hex"),
			sizeBytes: (await fs.stat(filePath)).size,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
};
//#endregion
export { LocalMirrorAdapter as n, TransactionRegistryService as t };
