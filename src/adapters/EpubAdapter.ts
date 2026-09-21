/**
 * @file EpubAdapter.ts
 * @description Proyector pasivo a EPUB3. 
 * Extrae los metadatos Dublin Core del contrato inmutable para construir el manifiesto OPF.
 */
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource, DublinCoreMetadata } from '../contracts/C01-03-multisource';

export class EpubAdapter implements IOutputAdapter {
  public readonly formatName = 'EPUB3-Standard';

  public async process(contract: C01_03_ContractMultisource): Promise<void> {
    console.log(`\n[${this.formatName}] Iniciando empaquetado...`);
    
    // Extracción de solo lectura del contrato
    const metadata = contract.manifest.dublinCore;
    const directives = contract.targetDirectives.epub3;
    const documentId = contract.semanticTree.documentId;

    console.log(`[${this.formatName}] Generando package.opf (Dublin Core Mapeado)`);
    console.log(`[${this.formatName}] Directiva fuentes fallback: ${directives.includeFallbackFonts}`);

    // Proyección pasiva del OPF (Open Packaging Format)
    const opfContent = this.generatePackageOpf(metadata, documentId, contract.timestamp);

    console.log(`[${this.formatName}] ✅ Manifiesto OPF generado en memoria para: ${metadata.identifier}`);
  }

  /**
   * Genera el archivo package.opf requerido por el estándar EPUB3.
   */
  private generatePackageOpf(dc: DublinCoreMetadata, docId: string, timestamp: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${this.escapeXml(dc.identifier)}</dc:identifier>
    <dc:title>${this.escapeXml(dc.title)}</dc:title>
    <dc:creator>${this.escapeXml(dc.creator)}</dc:creator>
    <dc:language>${this.escapeXml(dc.language)}</dc:language>
    <meta property="dcterms:modified">${timestamp}</meta>
  </metadata>
  <manifest>
    <!-- Los items XHTML se inyectarán aquí en etapas posteriores -->
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <!-- Orden de lectura de los fragmentos modulares -->
  </spine>
</package>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
