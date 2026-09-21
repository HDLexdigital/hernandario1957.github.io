import * as fs from 'fs/promises';
import * as path from 'path';
import { InDesignInputAdapter } from '../adapters/input/InDesignInputAdapter';
import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';

async function testIngestion() {
  console.log('--- TEST DE INGESTA: INDESIGN -> CONTRATO C01-03 ---\n');
  
  try {
    // 1. Leer JSON Crudo
    const rawPath = path.resolve(process.cwd(), 'publicaciones/fragmento/fragmento.json');
    const rawData = await fs.readFile(rawPath, 'utf8');
    const rawJson = JSON.parse(rawData);

    // 2. Transformar a través de la Capa Anticorrupción
    console.log('[ACL] Extrayendo árbol semántico del AST de InDesign...');
    const adapter = new InDesignInputAdapter();
    const contractPayload = adapter.transform(rawJson);
    console.log(`[ACL] Firma criptográfica generada: ${contractPayload.sourceHash}`);
    
    // 3. Validar con Fail-Fast Guard
    console.log('[ACL] Sometiendo resultado al validador C01-03...');
    const validator = new MultisourceValidator();
    validator.validate(contractPayload);
    
    console.log('✅ ÉXITO: El AST crudo mutó exitosamente a un Contrato Estricto válido.\n');
    console.log('--- MUESTRA DEL ÁRBOL SEMÁNTICO RESULTANTE ---');
    console.log(JSON.stringify(contractPayload.semanticTree.nodes.slice(0, 3), null, 2));

  } catch (err: any) {
    console.error('❌ FALLO:', err.message);
  }
}

testIngestion();
