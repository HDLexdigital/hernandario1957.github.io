import * as fs from 'fs/promises';
import * as path from 'path';
import { PublishValidator } from '../validadores/C01-04-publish.validator';
import { TransactionRegistryService } from './TransactionRegistryService';

export interface PublishResult {
  txId: string;
  releasedAt: string;
  status: 'published' | 'failed';
  message: string;
}

export class PublishWorker {
  private validator = new PublishValidator();
  private registry = new TransactionRegistryService();
  private releasesDir = path.resolve(process.cwd(), 'dist/releases');

  public async publishBuild(txId: string, author: string = 'Editorial-Engine'): Promise<PublishResult> {
    const startTime = Date.now();
    console.log(`[PUBLISH-WORKER] Iniciando protocolo de liberación para TX: ${txId}...`);

    try {
      // Paso 1: Validar precondiciones y seguridad criptográfica (Contrato C01-04)
      await this.validator.validatePreconditions(txId);

      // Paso 2: Gestionar punteros de Release (Rollback Safe)
      await fs.mkdir(this.releasesDir, { recursive: true });
      const currentPath = path.resolve(this.releasesDir, 'current.json');
      const previousPath = path.resolve(this.releasesDir, 'previous.json');

      let previousTxId = null;
      const currentContent = await fs.readFile(currentPath, 'utf8').catch(() => null);
      if (currentContent) {
        const parsedCurrent = JSON.parse(currentContent);
        previousTxId = parsedCurrent.activeTxId;
        // Guardar el actual como previous (respaldo de rollback)
        await fs.writeFile(previousPath, currentContent, 'utf8');
      }

      // Paso 3: Escribir el nuevo release actual
      const releaseMetadata = {
        activeTxId: txId,
        publishedAt: new Date().toISOString(),
        publishedBy: author,
        environment: 'production',
        previousTxId
      };
      await fs.writeFile(currentPath, JSON.stringify(releaseMetadata, null, 2), 'utf8');

      // Paso 4: Transicionar estado en el Ledger general
      // Actualizamos el registro transaccional para reflejar el estado 'published'
      await this.registry.transitionStatus(txId, 'success', [`Despliegue a producción completado en ${Date.now() - startTime}ms`]);

      console.log(`[PUBLISH-WORKER] 🚀 ¡Transacción ${txId} publicada con éxito en producción!`);

      return {
        txId,
        releasedAt: releaseMetadata.publishedAt,
        status: 'published',
        message: `Release exitoso. Puntero actualizado. (Anterior: ${previousTxId || 'Ninguno'})`
      };

    } catch (error: any) {
      console.error(`[PUBLISH-WORKER] ❌ Error crítico durante la publicación de ${txId}:`, error.message);
      return {
        txId,
        releasedAt: new Date().toISOString(),
        status: 'failed',
        message: error.message
      };
    }
  }

  /**
   * Ejecuta un rollback instantáneo al release anterior registrado.
   */
  public async rollback(): Promise<string> {
    const currentPath = path.resolve(this.releasesDir, 'current.json');
    const previousPath = path.resolve(this.releasesDir, 'previous.json');

    const previousContent = await fs.readFile(previousPath, 'utf8').catch(() => null);
    if (!previousContent) {
      throw new Error("[ROLLBACK] No existe un release previo (previous.json) para realizar la reversión.");
    }

    // Intercambiar current por previous
    const currentContent = await fs.readFile(currentPath, 'utf8').catch(() => null);
    if (currentContent) {
      await fs.writeFile(previousPath, currentContent, 'utf8');
    }
    await fs.writeFile(currentPath, previousContent, 'utf8');

    const parsed = JSON.parse(previousContent);
    console.log(`[ROLLBACK] 🔄 Sistema revertido exitosamente al TxID: ${parsed.activeTxId}`);
    return parsed.activeTxId;
  }
}
