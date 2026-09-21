/**
 * @file C01-03-multisource.validator.ts
 * @description Validador estricto para el Contrato de Frontera C01-03.
 * Implementa el patrón Fail-Fast atómico: cualquier payload inválido 
 * detiene el Motor Multisalida inmediatamente antes de la instanciación de adaptadores.
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';

export class MultisourceValidator {
  private ajv: Ajv;
  private validateSchema: ValidateFunction;

  constructor() {
    // Inicialización de AJV bajo directivas de máxima restricción (Cero Inercia)
    this.ajv = new Ajv({ 
      allErrors: true, 
      strict: true, 
      coerceTypes: false // No se aceptan coerción de tipos, debe ser exacto al contrato
    });
    
    // Habilitar formatos estandarizados (ej. date-time)
    addFormats(this.ajv);

    // Carga síncrona del esquema (esto ocurre al levantar el Motor, Fail-Fast en inicialización)
    const schemaPath = path.resolve(__dirname, '../../schemas/C01-03-multisource.schema.json');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`[FATAL] No se encontró el contrato base en: ${schemaPath}`);
    }

    const schemaDefinition = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    this.validateSchema = this.ajv.compile(schemaDefinition);
  }

  /**
   * Ejecuta la validación atómica del payload de entrada.
   * @param payload El JSON proveniente del orquestador/ingesta.
   * @returns El payload tipado e inmutable si cumple el contrato.
   * @throws Error con la traza exacta de las violaciones del contrato si falla.
   */
  public validate(payload: unknown): C01_03_ContractMultisource {
    const isValid = this.validateSchema(payload);

    if (!isValid) {
      // Regla: Fail-Fast y Cero Modificaciones sin Contrato
      const validationErrors = this.ajv.errorsText(this.validateSchema.errors, { separator: '\n' });
      throw new Error(
        `[FAIL-FAST] Violación atómica del Contrato C01-03-MULTISOURCE. El proceso ha sido abortado.\nDetalles:\n${validationErrors}`
      );
    }

    // Sellado inmutable del objeto en memoria para garantizar que 
    // los adaptadores se comporten de forma estrictamente pasiva.
    return Object.freeze(payload as C01_03_ContractMultisource);
  }
}
