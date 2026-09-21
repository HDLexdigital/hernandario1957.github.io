import { Writable } from 'stream';

export enum ContractFormat {
  XHTML = 'xhtml',
  EPUB3 = 'epub3',
  PDF_UA = 'pdfUa',
  PDF_PRINT = 'pdfPrint',
  PWA = 'pwa'
}

export enum TxState {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  SEALED = 'SEALED',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED'
}

/**
 * Frontera VFS Aislada (CRÍTICO-01, CRÍTICO-02)
 * Se instancia una por adaptador. El adaptador NO conoce el TransactionManager.
 */
export interface IVirtualFileSystem {
  /**
   * Solicita un flujo de escritura.
   * @param filename Ruta relativa estricta (ej. "index.xhtml" o "OEBPS/content.xhtml").
   * @throws Error si el nombre no cumple la gramática o intenta Path Traversal.
   */
  createWriteStream(filename: string): Promise<Writable>;
}

/**
 * Contrato de Cancelación (ALTO-01, ALTO-05)
 * Regla de Oro: La promesa de process() NO puede resolverse hasta que:
 * 1. Todo stream físico esté cerrado ('finish' event).
 * 2. Si abortSignal es disparado, debe detener la escritura, destruir descriptores pendientes y finalizar.
 */
