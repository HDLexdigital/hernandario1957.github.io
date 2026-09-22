export interface CloudSyncResult {
  success: boolean;
  provider: 'cloudflare-r2' | 'aws-s3' | 'local-mirror';
  txId: string;
  uploadedFiles: number;
  uploadedBytes: number;
  publishedAt: string;
  remotePointerUrl: string;
  errors?: string[];
}

export interface RemoteArtifactRecord {
  name: string;
  remotePath: string;
  sha256: string;
  sizeBytes: number;
}

export interface CloudSyncAdapter {
  readonly providerName: 'cloudflare-r2' | 'aws-s3' | 'local-mirror';
  
  /**
   * Sube artefactos inmutables de la transacción y conmuta atómicamente el release remoto.
   */
  publishRelease(txId: string, artifacts: { [key: string]: any }): Promise<CloudSyncResult>;

  /**
   * Reversión instantánea del puntero remoto al TxID anterior.
   */
  rollbackRelease(targetTxId: string): Promise<boolean>;
}
