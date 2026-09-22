import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

export class PublishValidator {
  public async validatePreconditions(txId: string): Promise<boolean> {
    const historyPath = path.resolve(process.cwd(), 'dist/builds/history.json');
    const txDir = path.resolve(process.cwd(), `dist/builds/${txId}`);

    try {
      // Lectura directa y atómica del Ledger físico
      const historyRaw = await fs.readFile(historyPath, 'utf8').catch(() => null);
      if (!historyRaw) {
        throw new Error(`[ACL-04] No se encontró el archivo de historial en ${historyPath}`);
      }

      const history = JSON.parse(historyRaw);
      const transactions = Array.isArray(history) ? history : (history.transactions || []);
      const transaction = transactions.find((tx: any) => tx.txId === txId);

      if (!transaction) {
        throw new Error(`[ACL-04] La transacción ${txId} no existe en el Ledger.`);
      }

      if (transaction.status !== 'success') {
        throw new Error(`[ACL-04] Violación de precondición: Solo se pueden publicar builds con estado 'success'. Estado actual: ${transaction.status}`);
      }

      // Verificación criptográfica de artefactos frente al disco
      for (const [artifactName, record] of Object.entries(transaction.artifacts || {})) {
        const artRecord: any = record;
        const localFilePath = path.resolve(txDir, artifactName === 'xhtml' ? 'xhtml/index.xhtml' : `${artifactName}.json`);
        
        const fileBuffer = await fs.readFile(localFilePath).catch(() => null);
        if (!fileBuffer) continue;

        const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        if (currentHash !== artRecord.sha256) {
          throw new Error(`[ACL-04] ¡ALERTA CRIPTO! El hash SHA-256 del artefacto [${artifactName}] no coincide con el Ledger.`);
        }
      }

      return true;
    } catch (error: any) {
      console.error(`[PUBLISH-VALIDATOR] Falla de contrato C01-04:`, error.message);
      throw error;
    }
  }
}
