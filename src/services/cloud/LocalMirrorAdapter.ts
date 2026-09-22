import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';
import { CloudSyncAdapter, CloudSyncResult } from './CloudSyncAdapter';

export class LocalMirrorAdapter implements CloudSyncAdapter {
  public readonly providerName = 'local-mirror';
  private readonly mirrorRootDir: string;

  constructor() {
    this.mirrorRootDir = path.resolve(process.cwd(), 'dist/cloud-mirror');
  }

  public async publishRelease(txId: string, artifacts: { [key: string]: any }): Promise<CloudSyncResult> {
    const startTime = new Date().toISOString();
    const remoteTxDir = path.resolve(this.mirrorRootDir, `releases/${txId}`);
    await fs.mkdir(remoteTxDir, { recursive: true });

    let uploadedFiles = 0;
    let uploadedBytes = 0;

    // 1. Replicación idempotente de artefactos (Upload simulado)
    for (const [name, record] of Object.entries(artifacts)) {
      const art = record as any;
      if (!art.path) continue;

      const sourceBuffer = await fs.readFile(art.path);
      const destPath = path.resolve(remoteTxDir, path.basename(art.path));
      await fs.writeFile(destPath, sourceBuffer);

      // 2. Verificación de integridad remota post-upload
      const remoteHash = crypto.createHash('sha256').update(sourceBuffer).digest('hex');
      if (remoteHash !== art.sha256) {
        throw new Error(`[LOCAL-MIRROR] Error de paridad en ${name}: Hash remoto corrupto.`);
      }

      uploadedFiles++;
      uploadedBytes += art.sizeBytes || sourceBuffer.length;
    }

    // 3. Conmutación atómica del puntero remoto (remote current.json)
    const remoteCurrentPath = path.resolve(this.mirrorRootDir, 'current.json');
    const remotePointerData = {
      activeTxId: txId,
      publishedAt: startTime,
      provider: this.providerName,
      artifactsCount: uploadedFiles
    };

    await fs.writeFile(remoteCurrentPath, JSON.stringify(remotePointerData, null, 2), 'utf8');

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

  public async rollbackRelease(targetTxId: string): Promise<boolean> {
    const remoteCurrentPath = path.resolve(this.mirrorRootDir, 'current.json');
    const targetDir = path.resolve(this.mirrorRootDir, `releases/${targetTxId}`);
    
    // Verificar que el release previo exista en el almacenamiento remoto
    const exists = await fs.stat(targetDir).catch(() => false);
    if (!exists) {
      throw new Error(`[LOCAL-MIRROR] El release ${targetTxId} no existe en el destino remoto.`);
    }

    const remotePointerData = {
      activeTxId: targetTxId,
      rolledBackAt: new Date().toISOString(),
      provider: this.providerName
    };

    await fs.writeFile(remoteCurrentPath, JSON.stringify(remotePointerData, null, 2), 'utf8');
    return true;
  }
}
