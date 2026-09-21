import { Writable } from 'stream';
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';

export class PdfUaAdapter implements IOutputAdapter {
  public readonly formatId = ContractFormat.PDF_UA;

  public async process(contract: C01_03_ContractMultisource, vfs: IVirtualFileSystem, abortSignal: AbortSignal): Promise<void> {
    const xmpContent = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    return this.writeFileSafely(vfs, abortSignal, 'metadata.xmp', xmpContent);
  }

  private async writeFileSafely(vfs: IVirtualFileSystem, signal: AbortSignal, filename: string, content: string): Promise<void> {
    if (signal.aborted) throw new Error(`[VFS] Interrumpido antes de crear: ${filename}`);
    return new Promise(async (resolve, reject) => {
      let stream: Writable;
      try { stream = await vfs.createWriteStream(filename); } catch (err) { return reject(err); }
      stream.on('finish', resolve);
      stream.on('error', reject);
      const onAbort = () => stream.destroy(new Error(`Cancelado`));
      signal.addEventListener('abort', onAbort);
      stream.on('close', () => signal.removeEventListener('abort', onAbort));
      try { stream.write(content); stream.end(); } catch (err) { stream.destroy(err as Error); }
    });
  }
}
