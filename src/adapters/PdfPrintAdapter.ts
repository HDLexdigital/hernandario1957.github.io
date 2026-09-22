import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';

export class PdfPrintAdapter {
  public readonly name = 'PdfPrintAdapter';

  public async process(contract: C01_03_ContractMultisource, txDir: string): Promise<string> {
    const xhtmlPath = path.resolve(txDir, 'xhtml/index.xhtml');
    const pdfDir = path.resolve(txDir, 'pdf');
    const pdfPath = path.resolve(pdfDir, 'impresion.pdf');

    // 1. Asegurar directorio de salida
    await fs.mkdir(pdfDir, { recursive: true });

    // 2. Levantar el motor Headless
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
      const page = await browser.newPage();

      // 3. Cargar el artefacto XHTML físico
      await page.goto(`file://${xhtmlPath}`, { waitUntil: 'networkidle0' });

      // 4. Inyección de CSS Paged Media (Estilos Editoriales para Impresión)
      await page.addStyleTag({
        content: `
          @page {
            size: A4;
            margin: 25mm 20mm 25mm 20mm;
          }
          body {
            font-family: "Georgia", serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            font-family: system-ui, sans-serif;
          }
          p {
            orphans: 3;
            widows: 3;
            text-align: justify;
          }
          .chapter {
            page-break-before: always;
          }
        `
      });

      // 5. Renderizado y volcado a disco
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="width: 100%; font-size: 9px; text-align: center; font-family: sans-serif;">
            LexDigitalHD - Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        `,
        margin: { top: '25mm', bottom: '25mm', left: '20mm', right: '20mm' }
      });

      console.log(`[PDF] Artefacto físico generado: ${pdfPath}`);
      return pdfPath;
    } finally {
      await browser.close();
    }
  }
}
