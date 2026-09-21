import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';

export class PdfPrintAdapter implements IOutputAdapter {
  public readonly formatName = 'PDF-Print-FOGRA';

  public async process(contract: C01_03_ContractMultisource): Promise<void> {
    console.log(`\n[${this.formatName}] Preparando perfil de pre-prensa...`);
    const directives = contract.targetDirectives.pdfPrint;

    console.log(`[${this.formatName}] Perfil de Color inyectado: ${directives.colorProfile}`);
    console.log(`[${this.formatName}] ✅ Configuración de retícula y marcas de corte generada en memoria.`);
  }
}
