import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource, DublinCoreMetadata } from '../contracts/C01-03-multisource';

export class PwaAdapter implements IOutputAdapter {
  public readonly formatName = 'PWA-OfflineFirst';

  public async process(contract: C01_03_ContractMultisource): Promise<void> {
    console.log(`\n[${this.formatName}] Construyendo Service Worker y Web Manifest...`);
    const directives = contract.targetDirectives.pwa;
    const metadata = contract.manifest.dublinCore;

    console.log(`[${this.formatName}] App Name: ${metadata.title}`);
    console.log(`[${this.formatName}] Estrategia de Cache: ${directives.offlineStrategy}`);
    
    const manifestJson = this.generateWebManifest(metadata);
    console.log(`[${this.formatName}] ✅ manifest.json generado en memoria.`);
  }

  private generateWebManifest(dc: DublinCoreMetadata): string {
    return JSON.stringify({
      name: dc.title,
      short_name: "LexHD",
      start_url: "/",
      display: "standalone",
      lang: dc.language
    }, null, 2);
  }
}
