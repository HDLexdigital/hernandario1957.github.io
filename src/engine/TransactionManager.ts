import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { Writable } from 'stream';
import { ContractFormat, IVirtualFileSystem, TxState } from '../contracts/MVP-057-transaction';

export class TransactionManager {
  public readonly txId: string;
  private readonly sourceHash: string;
  private readonly stagingRoot: string;
  private readonly distBuildPath: string;
  private readonly distIndexPath: string;
  private state: TxState = TxState.NEW;

  constructor(sourceHash: string) {
    this.txId = randomUUID(); // CRITICO-04: Separación de identidades
    this.sourceHash = sourceHash;
    this.stagingRoot = path.resolve(process.cwd(), `.lexhd/staging/${this.txId}`);
    this.distBuildPath = path.resolve(process.cwd(), `dist/builds/${this.txId}`);
    this.distIndexPath = path.resolve(process.cwd(), `dist/indexes/${this.sourceHash}.json`);
  }

  public async begin(): Promise<void> {
    this.assertState(TxState.NEW);
    await fs.mkdir(this.stagingRoot, { recursive: true });
    this.state = TxState.ACTIVE;
  }

  /**
   * CRÍTICO-01: Inyección de Fachada Aislada.
   * Genera un VFS enjaulado específicamente para un formato.
   */
  public allocateVFS(formatId: ContractFormat): IVirtualFileSystem {
    this.assertState(TxState.ACTIVE);
    const adapterStagingPath = path.join(this.stagingRoot, formatId);
    
    // El adaptador recibe ESTE objeto, perdiendo acceso al TransactionManager
    return new AdapterVFSFacade(adapterStagingPath, formatId);
  }

  /**
   * ALTO-02: Barrera de Validación Pre-Commit
   */
  public async seal(): Promise<void> {
    this.assertState(TxState.ACTIVE);
    
    // Verifica que los 5 subdirectorios (namespaces) existan y tengan contenido físico
    const requiredFormats = Object.values(ContractFormat);
    for (const format of requiredFormats) {
      const formatPath = path.join(this.stagingRoot, format);
      try {
        const stats = await fs.stat(formatPath);
        if (!stats.isDirectory()) throw new Error();
        
        // Validación básica de que produjo al menos un archivo
        const files = await fs.readdir(formatPath);
        if (files.length === 0) {
          throw new Error(`[TX] Validación Pre-Commit Fallida: ${format} no generó archivos.`);
        }
      } catch {
        throw new Error(`[TX] Validación Pre-Commit Fallida: Falta namespace físico de ${format}.`);
      }
    }
    
    this.state = TxState.SEALED;
  }

  /**
   * CRÍTICO-01 (Corregido) y ALTO-03: Publicación e Índice Atómicos
   */
  public async commit(): Promise<void> {
    this.assertState(TxState.SEALED);
    
    // 1. Asegurar directorios de destino
    await fs.mkdir(path.dirname(this.distBuildPath), { recursive: true });
    await fs.mkdir(path.dirname(this.distIndexPath), { recursive: true });
    
    // 2. Commit del Build (Rename atómico en POSIX)
    await fs.rename(this.stagingRoot, this.distBuildPath);
    
    // 3. Commit del Índice Atómico (Write temp -> Rename)
    const tempIndex = `${this.distIndexPath}.${this.txId}.tmp`;
    const indexData = JSON.stringify({ sourceHash: this.sourceHash, currentTxId: this.txId, timestamp: new Date().toISOString() });
    await fs.writeFile(tempIndex, indexData, 'utf8');
    await fs.rename(tempIndex, this.distIndexPath);
    
    this.state = TxState.COMMITTED;
  }

  public async rollback(): Promise<void> {
    if (this.state === TxState.COMMITTED) {
      throw new Error(`[TX] Violación de Estado: No se puede hacer rollback de una transacción COMMITTED.`);
    }
    this.state = TxState.ROLLED_BACK;
    await fs.rm(this.stagingRoot, { recursive: true, force: true });
  }

  private assertState(expected: TxState): void {
    if (this.state !== expected) {
      throw new Error(`[TX] Transición Inválida: Se esperaba estado ${expected}, pero actual es ${this.state}`);
    }
  }
}

/**
 * Implementación privada de la Fachada VFS.
 * Esta clase nunca se exporta; el adaptador solo interactúa con la interfaz IVirtualFileSystem.
 */
class AdapterVFSFacade implements IVirtualFileSystem {
  private readonly rootPath: string;
  private readonly formatId: ContractFormat;
  
  // Gramática estricta (MEDIO-01, MEDIO-02): Solo alfanuméricos, guiones, puntos y slashes internos. Sin ".." ni rutas absolutas.
  private static readonly VALID_FILENAME_REGEX = /^([a-zA-Z0-9_.-]+)(\/[a-zA-Z0-9_.-]+)*$/;

  constructor(rootPath: string, formatId: ContractFormat) {
    this.rootPath = rootPath;
    this.formatId = formatId;
  }

  public async createWriteStream(filename: string): Promise<Writable> {
    if (!AdapterVFSFacade.VALID_FILENAME_REGEX.test(filename) || filename.includes('..')) {
      throw new Error(`[VFS-${this.formatId}] Nombre de archivo contractualmente inválido: ${filename}`);
    }

    const resolvedPath = path.resolve(this.rootPath, filename);
    
    // Precondición de seguridad: El resolve jamás debe escapar del rootPath del adaptador
    if (!resolvedPath.startsWith(this.rootPath + path.sep)) {
      throw new Error(`[VFS-${this.formatId}] Path Traversal detectado: ${filename}`);
    }

    // Asegurar carpetas intermedias (ej. OEBPS/)
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

    // MEDIO-03: Rechazo explícito de sobrescritura en el mismo TX
    try {
      await fs.access(resolvedPath);
      throw new Error(`[VFS-${this.formatId}] El archivo ya existe. Sobrescritura prohibida en staging: ${filename}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }

    return createWriteStream(resolvedPath);
  }
}
