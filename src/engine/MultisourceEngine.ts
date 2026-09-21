/**
 * @file MultisourceEngine.ts
 * @description Orquestador central del MVP-056. 
 * Ejerce la disciplina arquitectónica: Valida atómicamente y distribuye
 * el payload inmutable a los adaptadores registrados.
 */
import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';
import { IOutputAdapter } from '../adapters/IOutputAdapter';

export class MultisourceEngine {
  private validator: MultisourceValidator;
  private adapters: IOutputAdapter[] = [];

  constructor() {
    // La instanciación del validador carga el Schema síncronamente.
    // Si el Schema no existe o está corrupto, el proceso muere aquí (Cero Inercia).
    this.validator = new MultisourceValidator();
  }

  /**
   * Inyecta un adaptador pasivo en el ciclo de vida del motor.
   */
  public registerAdapter(adapter: IOutputAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Inicia el flujo de procesamiento multisalida.
   * @param rawPayload JSON crudo proveniente de la ingesta estructurada.
   */
  public async execute(rawPayload: unknown): Promise<void> {
    console.log('[ENGINE] Iniciando evaluación del contrato multisalida...');
    
    // 1. PATRÓN FAIL-FAST: Validación y Congelamiento del Payload
    // Si esto falla, lanza una excepción atómica y nada se procesa.
    const validContract = this.validator.validate(rawPayload);
    
    console.log(`[ENGINE] Contrato C01-03 validado exitosamente.`);
    console.log(`[ENGINE] Hash Origen Semántico: ${validContract.sourceHash}`);
    console.log(`[ENGINE] Despachando a ${this.adapters.length} adaptadores pasivos...`);

    // 2. PROYECCIÓN: Ejecución concurrente de adaptadores pasivos
    const executionPromises = this.adapters.map(adapter => {
      console.log(`[ENGINE] -> Proyectando formato: ${adapter.formatName}`);
      return adapter.process(validContract).catch(err => {
        // En caso de fallo en un adaptador específico, reportamos sin detener 
        // necesariamente a los demás, pero marcando el error en el pipeline.
        console.error(`[FATAL] Error en adaptador [${adapter.formatName}]:`, err.message);
        throw err;
      });
    });

    await Promise.all(executionPromises);
    
    console.log('[ENGINE] Ciclo de proyección Multisalida completado (MVP-056).');
  }
}
