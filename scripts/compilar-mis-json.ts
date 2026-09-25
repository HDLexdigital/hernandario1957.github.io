import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Detecta si es /MisJSON o ./MisJSON
const DEFAULT_PATHS = ['/MisJSON', path.join(process.cwd(), 'MisJSON')];
const SOURCE_DIR = DEFAULT_PATHS.find(p => fsSync.existsSync(p));

const DIST_DIR = path.join(process.cwd(), 'dist', 'MisJSON-compilados');

async function calcularSha256(content: string): Promise<string> {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function compilar() {
  console.log('=== [COMPILADOR DETERMINISTA DE JSON] ===');

  if (!SOURCE_DIR) {
    console.error('❌ Error: No se encontró el directorio /MisJSON ni ./MisJSON');
    process.exit(1);
  }

  console.log(`📁 Directorio origen: ${SOURCE_DIR}`);
  console.log(`📁 Directorio salida: ${DIST_DIR}\n`);

  await fs.mkdir(DIST_DIR, { recursive: true });

  const entradas = await fs.readdir(SOURCE_DIR);
  const archivosJson = entradas.filter(f => f.endsWith('.json')).sort();

  if (archivosJson.length === 0) {
    console.warn('⚠️ No se encontraron archivos .json en la carpeta.');
    process.exit(0);
  }

  const lineasManifiesto: string[] = [];
  let procesados = 0;
  let errores = 0;

  for (const archivo of archivosJson) {
    const rutaOrigen = path.join(SOURCE_DIR, archivo);
    const rutaDestino = path.join(DIST_DIR, archivo);

    try {
      // 1. Lectura del archivo crudo
      const rawText = await fs.readFile(rutaOrigen, 'utf8');

      // 2. Validación sintáctica estricta (falla si hay comas sobrantes o comillas rotas)
      const parsedData = JSON.parse(rawText);

      // 3. Serialización determinista (2 espacios para legibilidad y estabilidad de diffs)
      const jsonNormalizado = JSON.stringify(parsedData, null, 2) + '\n';

      // 4. Cálculo de hash criptográfico
      const hash = await calcularSha256(jsonNormalizado);

      // 5. Escritura del artefacto compilado
      await fs.writeFile(rutaDestino, jsonNormalizado, 'utf8');

      lineasManifiesto.push(`${hash}  ${archivo}`);
      console.log(`✅ [OK] ${archivo} -> SHA-256: ${hash.substring(0, 16)}...`);
      procesados++;
    } catch (err: any) {
      console.error(`❌ [FALLA] ${archivo}: ${err.message}`);
      errores++;
    }
  }

  // 6. Generación del manifiesto de integridad
  const manifestPath = path.join(DIST_DIR, 'mis-json-manifest.sha256');
  await fs.writeFile(manifestPath, lineasManifiesto.join('\n') + '\n', 'utf8');

  console.log(`\n📄 Manifiesto generado en: ${manifestPath}`);
  console.log(`📊 Resumen: ${procesados} compilados con éxito | ${errores} fallas.`);

  if (errores > 0) {
    console.error('\n❌ Falla de integridad: Uno o más archivos tienen errores sintácticos.');
    process.exit(1);
  }

  console.log('=== COMPILACIÓN COMPLETADA EXITOSAMENTE ===\n');
}

compilar();
EOFmkdir -p scripts

cat << 'EOF' > scripts/compilar-mis-json.ts
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Detecta si es /MisJSON o ./MisJSON
const DEFAULT_PATHS = ['/MisJSON', path.join(process.cwd(), 'MisJSON')];
const SOURCE_DIR = DEFAULT_PATHS.find(p => fsSync.existsSync(p));

const DIST_DIR = path.join(process.cwd(), 'dist', 'MisJSON-compilados');

async function calcularSha256(content: string): Promise<string> {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function compilar() {
  console.log('=== [COMPILADOR DETERMINISTA DE JSON] ===');

  if (!SOURCE_DIR) {
    console.error('❌ Error: No se encontró el directorio /MisJSON ni ./MisJSON');
    process.exit(1);
  }

  console.log(`📁 Directorio origen: ${SOURCE_DIR}`);
  console.log(`📁 Directorio salida: ${DIST_DIR}\n`);

  await fs.mkdir(DIST_DIR, { recursive: true });

  const entradas = await fs.readdir(SOURCE_DIR);
  const archivosJson = entradas.filter(f => f.endsWith('.json')).sort();

  if (archivosJson.length === 0) {
    console.warn('⚠️ No se encontraron archivos .json en la carpeta.');
    process.exit(0);
  }

  const lineasManifiesto: string[] = [];
  let procesados = 0;
  let errores = 0;

  for (const archivo of archivosJson) {
    const rutaOrigen = path.join(SOURCE_DIR, archivo);
    const rutaDestino = path.join(DIST_DIR, archivo);

    try {
      // 1. Lectura del archivo crudo
      const rawText = await fs.readFile(rutaOrigen, 'utf8');

      // 2. Validación sintáctica estricta (falla si hay comas sobrantes o comillas rotas)
      const parsedData = JSON.parse(rawText);

      // 3. Serialización determinista (2 espacios para legibilidad y estabilidad de diffs)
      const jsonNormalizado = JSON.stringify(parsedData, null, 2) + '\n';

      // 4. Cálculo de hash criptográfico
      const hash = await calcularSha256(jsonNormalizado);

      // 5. Escritura del artefacto compilado
      await fs.writeFile(rutaDestino, jsonNormalizado, 'utf8');

      lineasManifiesto.push(`${hash}  ${archivo}`);
      console.log(`✅ [OK] ${archivo} -> SHA-256: ${hash.substring(0, 16)}...`);
      procesados++;
    } catch (err: any) {
      console.error(`❌ [FALLA] ${archivo}: ${err.message}`);
      errores++;
    }
  }

  // 6. Generación del manifiesto de integridad
  const manifestPath = path.join(DIST_DIR, 'mis-json-manifest.sha256');
  await fs.writeFile(manifestPath, lineasManifiesto.join('\n') + '\n', 'utf8');

  console.log(`\n📄 Manifiesto generado en: ${manifestPath}`);
  console.log(`📊 Resumen: ${procesados} compilados con éxito | ${errores} fallas.`);

  if (errores > 0) {
    console.error('\n❌ Falla de integridad: Uno o más archivos tienen errores sintácticos.');
    process.exit(1);
  }

  console.log('=== COMPILACIÓN COMPLETADA EXITOSAMENTE ===\n');
}

compilar();
