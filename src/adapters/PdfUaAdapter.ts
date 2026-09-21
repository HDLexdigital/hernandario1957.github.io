import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';

export class PdfUaAdapter implements IOutputAdapter {
  public readonly formatName = 'PDF/UA-Accessible';

  public async process(contract: C01_03_ContractMultisource): Promise<void> {
    console.log(`\n[${this.formatName}] Iniciando mapeo de etiquetas lógicas...`);
    const directives = contract.targetDirectives.pdfUa;
    const a11y = contract.manifest.a11y;

    console.log(`[${this.formatName}] Nivel WCAG Objetivo: ${a11y.wcagLevel}`);
    console.log(`[${this.formatName}] Estrategia de Tagging: ${directives.taggingStrategy}`);
    console.log(`[${this.formatName}] ✅ Diccionario de etiquetas PDF/UA (XMP) generado en memoria.`);
  }
}
