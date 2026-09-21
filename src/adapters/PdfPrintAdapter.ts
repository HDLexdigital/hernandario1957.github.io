import { Writable } from 'stream';
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';

export class PdfPrintAdapter implements IOutputAdapter {
  public readonly formatId = ContractFormat.PDF_PRINT;

  public async process(contract: C01_03_ContractMultisource, vfs: IVirtualFileSystem, abortSignal: AbortSignal): Promise<void> {
    const jobOptions = `%% Prepress Profile: ${contract.targetDirectives.pdfPrint?.colorProfile || 'CMYK'}`;
    return this.writeFileSafely(vfs, abortSignal, 'prepress.joboptions', jobOptions);
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
