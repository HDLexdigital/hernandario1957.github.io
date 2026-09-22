import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StaticApiGeneratorService } from '../src/services/api/StaticApiGeneratorService';
import { UnifiedGraphService } from '../src/services/corpora/UnifiedGraphService';

const ROOT_DIR = process.cwd();
const DIST_API = path.join(ROOT_DIR, 'dist', 'api', 'v1');
const PUBLIC_API = path.join(ROOT_DIR, 'public', 'api', 'v1');
const UNIFIED_GRAPH_PATH = path.join(ROOT_DIR, 'dist', 'corpora', 'unified-graph.json');

async function calcularSha256(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function listarArchivosRecursivos(dir: string, baseDir: string = dir): Promise<string[]> {
  const entradas = await fs.readdir(dir, { withFileTypes: true });
  const archivos: string[] = [];

  for (const entrada of entradas) {
    const rutaCompleta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      archivos.push(...(await listarArchivosRecursivos(rutaCompleta, baseDir)));
    } else if (entrada.isFile() && entrada.name.endsWith('.json')) {
      archivos.push(path.relative(baseDir, rutaCompleta));
    }
  }
  return archivos.sort();
}

async function copiarRecursivo(origen: string, destino: string) {
  await fs.mkdir(destino, { recursive: true });
  const entradas = await fs.readdir(origen, { withFileTypes: true });

  for (const entrada of entradas) {
    const rutaOrigen = path.join(origen, entrada.name);
    const rutaDestino = path.join(destino, entrada.name);

    if (entrada.isDirectory()) {
      await copiarRecursivo(rutaOrigen, rutaDestino);
    } else {
      await fs.copyFile(rutaOrigen, rutaDestino);
    }
  }
}

async function main() {
  console.log('=== [BUILD-STATIC-API] BARRERA DETERMINISTA Y SINCRONIZACIÓN ===');

  // 1. Invariante de Grafo: Verificar existencia del grafo unificado
  if (!fsSync.existsSync(UNIFIED_GRAPH_PATH)) {
    console.log('▶ Artefacto de grafo no detectado en dist/corpora/. Compilando UnifiedGraph...');
    const graphService = new UnifiedGraphService();
    await graphService.buildUnifiedGraph();
  }

  // 2. Compilación de endpoints JSON en dist/api/v1
  const generator = new StaticApiGeneratorService();
  const { totalEndpointsGenerated } = await generator.compileAll();

  if (totalEndpointsGenerated === 0) {
    throw new Error('❌ Falla crítica: StaticApiGeneratorService no generó endpoints.');
  }

  // 3. Generación del manifiesto api-manifest.sha256 en dist/api/v1
  console.log('▶ Generando manifiesto criptográfico api-manifest.sha256...');
  const archivosJson = await listarArchivosRecursivos(DIST_API);
  const lineasManifiesto: string[] = [];

  for (const relPath of archivosJson) {
    const absPath = path.join(DIST_API, relPath);
    const hash = await calcularSha256(absPath);
    lineasManifiesto.push(`${hash}  ${relPath}`);
  }

  const manifestContent = lineasManifiesto.join('\n') + '\n';
  const distManifestPath = path.join(DIST_API, 'api-manifest.sha256');
  await fs.writeFile(distManifestPath, manifestContent, 'utf8');
  console.log(`✅ Manifiesto generado con ${archivosJson.length} recursos inventariados.`);

  // 4. Sincronización atómica hacia public/api/v1
  console.log('▶ Sincronizando dist/api/v1 -> public/api/v1...');
  if (fsSync.existsSync(PUBLIC_API)) {
    await fs.rm(PUBLIC_API, { recursive: true, force: true });
  }
  await copiarRecursivo(DIST_API, PUBLIC_API);

  // 5. Auditoría de integridad post-copia
  const publicManifestPath = path.join(PUBLIC_API, 'api-manifest.sha256');
  if (!fsSync.existsSync(publicManifestPath)) {
    throw new Error('❌ Falla crítica: No se encontró api-manifest.sha256 en public/api/v1.');
  }

  for (const relPath of archivosJson) {
    const rutaEnPublic = path.join(PUBLIC_API, relPath);
    if (!fsSync.existsSync(rutaEnPublic)) {
      throw new Error(`❌ Falla crítica: Recurso ausente en public/api/v1: ${relPath}`);
    }
  }

  console.log('✅ Integridad de public/api/v1 verificada byte a byte.');
  console.log('=== [BUILD-STATIC-API] BARRERA CERRADA CON ÉXITO ===\n');
}

main().catch(err => {
  console.error('\n❌ ERROR EN BUILD-STATIC-API (FAIL-CLOSED):', err.message);
  process.exit(1);
});
