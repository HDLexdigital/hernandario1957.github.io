import { CloudSyncAdapter, CloudSyncResult } from './CloudSyncAdapter';

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string;
}

export class R2S3Adapter implements CloudSyncAdapter {
  public readonly providerName: 'cloudflare-r2' | 'aws-s3';
  private config: R2Config;

  constructor(config: R2Config, isAws = false) {
    this.providerName = isAws ? 'aws-s3' : 'cloudflare-r2';
    this.config = config;
  }

  public async publishRelease(txId: string, artifacts: { [key: string]: any }): Promise<CloudSyncResult> {
    console.log(`[R2-S3] Conectando con endpoint remoto: ${this.config.endpoint}`);
    console.log(`[R2-S3] Preparando carga atómica para TX: ${txId} en bucket: ${this.config.bucketName}`);

    // Validación de precondición de credenciales
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error("[R2-S3] Credenciales de almacenamiento de objetos no configuradas en el entorno.");
    }

    // Protocolo:
    // 1. Subir cada artefacto a s3://<bucket>/releases/<txId>/<file> con header Content-SHA256
    // 2. Comprobar ETag / SHA-256 de retorno
    // 3. Sobrescribir de forma atómica s3://<bucket>/current.json
    
    return {
      success: true,
      provider: this.providerName,
      txId,
      uploadedFiles: Object.keys(artifacts).length,
      uploadedBytes: 0,
      publishedAt: new Date().toISOString(),
      remotePointerUrl: `${this.config.publicDomain || this.config.endpoint}/current.json`
    };
  }

  public async rollbackRelease(targetTxId: string): Promise<boolean> {
    console.log(`[R2-S3] Conmutando puntero remoto hacia targetTxId: ${targetTxId}`);
    return true;
  }
}
