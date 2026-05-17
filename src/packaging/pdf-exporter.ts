// PDF Exporter — HTML artifact → print-friendly HTML + PDF via Playwright CLI

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import type { Artifact } from '../types.js';

const execFileAsync = promisify(execFile);

export interface PdfExportResult {
  printHtmlPath: string;
  pdfPath: string | null;
  format: 'pdf';
  pageCount: number;
}

/**
 * Injects @media print CSS into the artifact HTML so it renders cleanly as PDF.
 * Returns the path to the written file.
 */
export class PdfExporter {
  async export(artifact: Artifact, outputDir: string, htmlPath?: string): Promise<PdfExportResult> {
    await mkdir(outputDir, { recursive: true });

    const printHtml = this.injectPrintStyles(artifact.html);
    const printHtmlPath = join(outputDir, 'print.html');
    await writeFile(printHtmlPath, printHtml, 'utf-8');
    let pdfPath: string | null = join(outputDir, 'output.pdf');
    const sourceUrl = pathToFileURL(htmlPath ?? printHtmlPath).href;

    try {
      await execFileAsync('playwright', ['pdf', sourceUrl, pdfPath]);
    } catch {
      // Playwright not installed or not in PATH — degrade gracefully
      pdfPath = null;
    }

    return {
      printHtmlPath,
      pdfPath,
      format: 'pdf',
      pageCount: this.estimatePageCount(artifact),
    };
  }

  private injectPrintStyles(html: string): string {
    const printCss = `
<style media="print">
  @page {
    size: A4 landscape;
    margin: 12mm;
  }
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  section {
    page-break-after: always;
    break-after: page;
  }
  section:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }
  /* Hide interactive/non-print elements */
  nav, .no-print, button, [role="navigation"] {
    display: none !important;
  }
  /* Prevent orphan headings */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }
  /* Keep images with their captions */
  figure, img {
    page-break-inside: avoid;
    break-inside: avoid;
  }
</style>`;

    // Inject before </head> if present, otherwise before </html> or at end
    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${printCss}\n</head>`);
    }
    if (/<\/html>/i.test(html)) {
      return html.replace(/<\/html>/i, `${printCss}\n</html>`);
    }
    return html + printCss;
  }

  private estimatePageCount(artifact: Artifact): number {
    const sectionCount = (artifact.html.match(/<section[^>]*>/gi) ?? []).length;
    return Math.max(sectionCount, artifact.pages, 1);
  }
}
