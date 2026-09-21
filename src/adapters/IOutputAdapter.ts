/**
 * @file IOutputAdapter.ts
 * @description Contrato estricto para los proyectores de salida.
 * Regla: "La Interfaz y Adaptadores son Pasivos". 
 * Ningún adaptador puede alterar el contrato, solo consumirlo.
 */
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';

export interface IOutputAdapter {
  readonly formatName: string;
  
  /**
   * Ejecuta la proyección del formato destino.
   * @param contract El payload de datos inmutable (congelado por el validador).
   */
  process(contract: C01_03_ContractMultisource): Promise<void>;
}
