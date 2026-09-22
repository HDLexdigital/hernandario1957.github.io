import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runPdfTest() {
  console.log('--- INICIANDO PRUEBA DE MOTOR PDF (MVP-063) ---\n');
  
  // Simulamos los datos de una transacción exitosa (MVP-058)
  const txId = 'tx-test-pdf';
  const txDir = path.resolve(process.cwd(), `dist/builds/${txId}`);
  const xhtmlDir = path.resolve(txDir, 'xhtml');
  
  // 1. Preparamos el terreno (Creamos un XHTML simulado como si el motor lo hubiera emitido)
  await fs.mkdir(xhtmlDir, { recursive: true });
  await fs.writeFile(path.resolve(xhtmlDir, 'index.xhtml'), `
    <html lang="es">
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>Constitución Política de Colombia</h1>
        <section class="chapter">
          <h2>CAPÍTULO I</h2>
          <p>Artículo 13. Todas las personas nacen libres e iguales ante la ley, recibirán la misma protección y trato de las autoridades y gozarán de los mismos derechos, libertades y oportunidades sin ninguna discriminación por razones de sexo, raza, origen nacional o familiar, lengua, religión, opinión política o filosófica.</p>
        </section>
      </body>
    </html>
  `, 'utf8');

  // Contrato simulado para cumplir la interfaz
  const mockContract: any = { sourceHash: 'mock-hash' };

  try {
    const pdfEngine = new PdfPrintAdapter();
    const pdfPath = await pdfEngine.process(mockContract, txDir);

    // Verificación de reproducibilidad (El archivo existe y tiene peso > 0)
    const stats = await fs.stat(pdfPath);
    if (stats.size > 0) {
      console.log(`\n✅ ÉXITO: PDF generado y validado. Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      throw new Error('El PDF se generó, pero está vacío (0 bytes).');
    }
  } catch (error) {
    console.error('\n❌ FALLO EN LA GENERACIÓN DEL PDF:', error);
  }
}

runPdfTest();
