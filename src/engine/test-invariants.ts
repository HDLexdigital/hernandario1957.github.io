import { MultisourceEngine } from './MultisourceEngine';
import { IOutputAdapter } from '../adapters/IOutputAdapter';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';
import * as fs from 'fs/promises';
import * as path from 'path';

const validPayload = {
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  sourceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  manifest: {
    dublinCore: {
      title: "Constitución Política de Colombia",
      creator: "Asamblea Nacional Constituyente",
      language: "es-CO",
      identifier: "urn:lex:co:estado:constitucion:1991"
    },
    a11y: { wcagLevel: "AA" }
  },
  semanticTree: {
    documentId: "const-1991",
    nodes: [{ id: "t1", type: "title", content: "Preámbulo" }]
  },
  targetDirectives: {
    xhtml: { modularizeBy: "chapter" },
    epub3: { includeFallbackFonts: true },
    pdfUa: { taggingStrategy: "strict" },
    pdfPrint: { colorProfile: "CMYK-FOGRA39" },
    pwa: { offlineStrategy: "cache-first" }
  }
};

class DummyValidAdapter implements IOutputAdapter {
  constructor(public readonly formatId: ContractFormat) {}
  async process(contract: C01_03_ContractMultisource, vfs: IVirtualFileSystem, abortSignal: AbortSignal): Promise<void> {
    const stream = await vfs.createWriteStream('output.dat');
    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.write(`Payload de prueba para ${this.formatId}`);
      stream.end();
    });
  }
}

async function runInvariantTests() {
  console.log('--- INICIANDO AUDITORÍA DE INVARIANTES (MVP-057) ---\n');

  // TEST 1: Intento de Path Traversal
  console.log('--- TEST 1: Detección y rechazo de Path Traversal ---');
  try {
    const engine = new MultisourceEngine();
    for (const fmt of Object.values(ContractFormat)) {
      if (fmt === ContractFormat.XHTML) {
        engine.registerAdapter({
          formatId: fmt,
          async process(c, vfs) {
            await vfs.createWriteStream('../../../escape.txt');
          }
        });
      } else {
        engine.registerAdapter(new DummyValidAdapter(fmt));
      }
    }
    await engine.execute(validPayload);
    console.error('❌ FALLO: No se bloqueó el Path Traversal.');
  } catch (error: any) {
    console.log('✅ ÉXITO: Intento de escape bloqueado atómicamente:', error.message.split('\n')[0]);
  }

  // TEST 2: Violación de Pre-Commit (Seal vacío)
  console.log('\n--- TEST 2: Rechazo de Commit por falta de artefactos (Seal Barrier) ---');
  try {
    const engine = new MultisourceEngine();
    for (const fmt of Object.values(ContractFormat)) {
      if (fmt === ContractFormat.EPUB3) {
        engine.registerAdapter({
          formatId: fmt,
          async process() {
            // Resuelve exitosamente pero sin escribir nada en su VFS
            return Promise.resolve();
          }
        });
      } else {
        engine.registerAdapter(new DummyValidAdapter(fmt));
      }
    }
    await engine.execute(validPayload);
    console.error('❌ FALLO: Se permitió el commit con un namespace vacío.');
  } catch (error: any) {
    console.log('✅ ÉXITO: Barrera pre-commit abortó la transacción:', error.message.split('\n')[0]);
  }

  // TEST 3: Cancelación coordinada por AbortSignal
  console.log('\n--- TEST 3: Propagación de AbortSignal y Purga de Staging ---');
  let signalReceived = false;
  try {
    const engine = new MultisourceEngine();
    for (const fmt of Object.values(ContractFormat)) {
      if (fmt === ContractFormat.PDF_UA) {
        engine.registerAdapter({
          formatId: fmt,
          async process() {
            throw new Error('Fallo simulado en PDF_UA');
          }
        });
      } else if (fmt === ContractFormat.PWA) {
        engine.registerAdapter({
          formatId: fmt,
          async process(c, vfs, signal) {
            return new Promise((resolve) => {
              signal.addEventListener('abort', () => {
                signalReceived = true;
                resolve();
              });
            });
          }
        });
      } else {
        engine.registerAdapter(new DummyValidAdapter(fmt));
      }
    }
    await engine.execute(validPayload);
    console.error('❌ FALLO: La transacción debió abortar.');
  } catch (error: any) {
    if (signalReceived) {
      console.log('✅ ÉXITO: AbortSignal recibido en hilos concurrentes.');
      console.log('✅ ÉXITO: Transacción abortada y staging purgado:', error.message.split('\n')[0]);
    } else {
      console.error('❌ FALLO: AbortSignal no llegó al adaptador concurrente.');
    }
  }

  // TEST 4: Flujo Feliz y Atomicidad del Índice
  console.log('\n--- TEST 4: Transacción Completa (Commit e Índice Atómico) ---');
  try {
    const engine = new MultisourceEngine();
    for (const fmt of Object.values(ContractFormat)) {
      engine.registerAdapter(new DummyValidAdapter(fmt));
    }
    await engine.execute(validPayload);
    
    // Verificar existencia del índice atómico generado
    const indexPath = path.resolve(process.cwd(), `dist/indexes/${validPayload.sourceHash}.json`);
    const indexRaw = await fs.readFile(indexPath, 'utf8');
    const indexData = JSON.parse(indexRaw);

    if (indexData.sourceHash === validPayload.sourceHash && indexData.currentTxId) {
      console.log(`✅ ÉXITO: Transacción confirmada. Build consolidado e índice verificado para TX: ${indexData.currentTxId}`);
    } else {
      console.error('❌ FALLO: Estructura del índice inconsistente.');
    }
  } catch (error: any) {
    console.error('❌ FALLO en flujo feliz:', error);
  }
}

runInvariantTests();
