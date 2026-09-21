import { Writable } from 'stream';
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource, DublinCoreMetadata } from '../contracts/C01-03-multisource';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';

export class EpubAdapter implements IOutputAdapter {
  public readonly formatId = ContractFormat.EPUB3;

  public async process(
    contract: C01_03_ContractMultisource, 
    vfs: IVirtualFileSystem,
    abortSignal: AbortSignal
  ): Promise<void> {
    
    const metadata = contract.manifest.dublinCore;
    const docId = contract.semanticTree.documentId;
    const timestamp = contract.timestamp;

    // 1. Escribir mimetype (Requisito estricto del estándar EPUB, sin declaración XML)
    await this.writeFileSafely(vfs, abortSignal, 'mimetype', 'application/epub+zip');

    // 2. Escribir META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    await this.writeFileSafely(vfs, abortSignal, 'META-INF/container.xml', containerXml);

    // 3. Escribir OEBPS/package.opf
    const opfContent = this.generatePackageOpf(metadata, docId, timestamp);
    await this.writeFileSafely(vfs, abortSignal, 'OEBPS/package.opf', opfContent);
  }

  /**
   * Envoltorio seguro para vincular la creación del stream, la escritura y la señal de aborto a una Promesa.
   */
  private async writeFileSafely(vfs: IVirtualFileSystem, signal: AbortSignal, filename: string, content: string): Promise<void> {
    if (signal.aborted) {
      throw new Error(`[VFS-${this.formatId}] Interrumpido antes de crear: ${filename}`);
    }

    return new Promise(async (resolve, reject) => {
      let stream: Writable;
      try {
        stream = await vfs.createWriteStream(filename);
      } catch (err) {
        return reject(err);
      }

      // Vínculos de terminación física
      stream.on('finish', resolve);
      stream.on('error', reject);

      // Cancelación coordinada
      const onAbort = () => {
        stream.destroy(new Error(`[VFS-${this.formatId}] Cancelación propagada. Stream destruido en ${filename}`));
      };
      signal.addEventListener('abort', onAbort);

      // Limpieza de memoria para el listener
      stream.on('close', () => signal.removeEventListener('abort', onAbort));

      try {
        stream.write(content);
        stream.end();
      } catch (err) {
        stream.destroy(err as Error);
      }
    });
  }

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
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
  </spine>
</package>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
}
