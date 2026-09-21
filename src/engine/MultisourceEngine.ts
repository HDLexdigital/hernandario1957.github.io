import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';
import { IOutputAdapter } from '../adapters/IOutputAdapter';
import { TransactionManager } from './TransactionManager';
import { ContractFormat } from '../contracts/MVP-057-transaction';

export class MultisourceEngine {
  private validator = new MultisourceValidator();
  private adapters = new Map<ContractFormat, IOutputAdapter>();

  public registerAdapter(adapter: IOutputAdapter): void {
    if (this.adapters.has(adapter.formatId)) {
      throw new Error(`[ENGINE] Adaptador para ${adapter.formatId} ya registrado.`);
    }
    this.adapters.set(adapter.formatId, adapter);
  }

  public async execute(rawPayload: unknown): Promise<void> {
    this.validateRegistryComplete();

    const validContract = this.validator.validate(rawPayload);
    const txManager = new TransactionManager(validContract.sourceHash);
    const abortController = new AbortController();

    try {
      await txManager.begin();
      
      const promises = Array.from(this.adapters.values()).map(async (adapter) => {
        try {
          // CRÍTICO-01: Se entrega el VFS Enjaulado, no el txManager
          const isolatedVFS = txManager.allocateVFS(adapter.formatId);
          await adapter.process(validContract, isolatedVFS, abortController.signal);
        } catch (err) {
          abortController.abort(`[ENGINE] Fallo desencadenado por ${adapter.formatId}`);
          throw err;
        }
      });

      const results = await Promise.allSettled(promises);
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Transacción abortada. Hilos fallidos: ${failures.length}`);
      }

      await txManager.seal();
      await txManager.commit();
      
    } catch (globalError: any) {
      await txManager.rollback();
      throw globalError;
    }
  }

  /**
   * ALTO-06: Verificación de conjuntos, no solo de cantidad.
   */
  private validateRegistryComplete(): void {
    const requiredFormats = new Set(Object.values(ContractFormat));
    const registeredFormats = new Set(this.adapters.keys());
    
    if (requiredFormats.size !== registeredFormats.size) {
      throw new Error(`[ENGINE] Registro inválido. Faltan adaptadores.`);
    }
    
    for (const req of requiredFormats) {
      if (!registeredFormats.has(req)) {
        throw new Error(`[ENGINE] Registro inválido. Falta adaptador explícito: ${req}`);
      }
    }
  }
}
