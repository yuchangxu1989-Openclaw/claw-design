// ExportAdapter — HTML → PPTX export using pptxgenjs
// Basic text extraction from HTML, one slide per page

// @ts-ignore — pptxgenjs CJS default export typing issue with Node16 moduleResolution
import PptxGenJS from 'pptxgenjs';
import type { Artifact, ThemePack, DeliveryBundle } from '../types.js';

// Workaround: pptxgenjs types declare `export default class` but Node16 resolution
// treats it as non-constructable namespace. Cast to any for `new`.
const Pptx = PptxGenJS as any;
import JSZip from 'jszip';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PdfExporter } from '../packaging/pdf-exporter.js';
import { ImageExporter } from '../packaging/image-exporter.js';
import { buildFormatConsistencyReport } from './format-consistency.js';
import {
  extractPptxPageAnalyses,
  buildFallbackImageData,
  buildFallbackNote,
} from './pptx-fallback.js';
import { SLIDE_WIDTH_INCHES, SLIDE_HEIGHT_INCHES } from './export-constants.js';

export class ExportAdapter {
  private pdfExporter = new PdfExporter();
  private imageExporter = new ImageExporter();

  async export(
    artifact: Artifact,
    theme: ThemePack,
    outputDir: string,
  ): Promise<DeliveryBundle> {
    await mkdir(outputDir, { recursive: true });

    // 1. Write HTML
    const htmlPath = join(outputDir, 'index.html');
    await writeFile(htmlPath, artifact.html, 'utf-8');

    const pages = this.extractPageAnalyses(artifact.html);

    // 2. Generate PPTX
    const pptxPath = join(outputDir, 'output.pptx');
    const pptxFallbackNotes = await this.generatePptx(artifact, theme, pptxPath, pages);

    // 3. Generate print-ready HTML + PDF
    const pdfResult = await this.pdfExporter.export(artifact, outputDir, htmlPath);

    // 4. Extract SVG images and render PNG for single-page artifacts
    const imageResult = await this.imageExporter.export(artifact, outputDir, htmlPath);

    const consistency = buildFormatConsistencyReport(artifact, {
      hasPdf: true,
      hasPng: imageResult.pngSupported,
      svgCount: imageResult.svgPaths.length,
      pptxSlideCount: pages.length || 1,
      pdfPageCount: pdfResult.pageCount,
    });

    const files = [
      htmlPath,
      pptxPath,
      pdfResult.printHtmlPath,
      pdfResult.pdfPath,
      ...imageResult.pngPaths,
      ...imageResult.svgPaths,
    ].filter((f): f is string => f !== null);

    const notes = [
      ...consistency.items.filter(item => !item.passed).map(item => item.message),
      ...pptxFallbackNotes,
    ];

    return {
      taskId: artifact.taskId,
      htmlPath,
      pptxPath,
      pdfPath: pdfResult.pdfPath ?? undefined,
      pngPath: imageResult.pngPath ?? undefined,
      pngPaths: imageResult.pngPaths.length > 0 ? imageResult.pngPaths : undefined,
      svgPaths: imageResult.svgPaths,
      qualitySummary: 'pass',
      files,
      consistency,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  private async generatePptx(
    artifact: Artifact,
    theme: ThemePack,
    outputPath: string,
    pages = this.extractPageAnalyses(artifact.html),
  ): Promise<string[]> {
    const pptx = new Pptx();
    pptx.layout = 'LAYOUT_WIDE';

    const fallbackNotes: string[] = [];
    const resolvedPages = pages.length > 0 ? pages : this.extractPageAnalyses(artifact.html);

    if (resolvedPages.length === 0) {
      const slide = pptx.addSlide();
      slide.addText(`Claw Design — ${artifact.type}`, {
        x: 1, y: 1, w: 10, h: 1.5,
        fontSize: 28,
        color: theme.colorPrimary.replace('#', ''),
        fontFace: 'Arial',
      });
    } else {
      for (const page of resolvedPages) {
        const slide = pptx.addSlide();
        if (page.requiresFallback) {
          slide.addImage({
            data: buildFallbackImageData(page, theme),
            x: 0,
            y: 0,
            w: SLIDE_WIDTH_INCHES,
            h: SLIDE_HEIGHT_INCHES,
            altText: `Fallback preview for page ${page.index}`,
            objectName: `Fallback Page ${page.index}`,
            sizing: { type: 'contain', w: SLIDE_WIDTH_INCHES, h: SLIDE_HEIGHT_INCHES },
          });
          slide.addNotes(buildFallbackNote(page));
          fallbackNotes.push(`PPTX 回退页：第 ${page.index} 页（${page.fallbackReasons.map(reason => reason.message).join('；')}）`);
          continue;
        }

        slide.addText(page.text, {
          x: 1, y: 1, w: 10, h: 5,
          fontSize: 16,
          color: '333333',
          fontFace: 'Arial',
          valign: 'top',
          wrap: true,
        });
      }
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    await writeFile(outputPath, buffer);

    if (fallbackNotes.length > 0) {
      await this.annotateFallbackNotes(outputPath, resolvedPages.filter(page => page.requiresFallback));
    }

    return fallbackNotes;
  }

  /** Naive text extraction from HTML — extracts content per <section> to maintain 1:1 page mapping */
  private extractTextBlocks(html: string): string[] {
    return this.extractPageAnalyses(html).map(page => page.text).filter(Boolean);
  }

  private extractPageAnalyses(html: string) {
    const pages = extractPptxPageAnalyses(html);
    if (pages.length > 0) {
      return pages;
    }

    return [
      {
        index: 1,
        title: 'Claw Design Export',
        sourceHtml: html,
        text: '',
        excerpt: '',
        requiresFallback: false,
        fallbackReasons: [],
      },
    ];
  }

  private async annotateFallbackNotes(outputPath: string, fallbackPages: Array<{ index: number }>): Promise<void> {
    const archive = await readFile(outputPath);
    const zip = await JSZip.loadAsync(archive);

    for (const page of fallbackPages) {
      const notesPath = `ppt/notesSlides/notesSlide${page.index}.xml`;
      const notesFile = zip.file(notesPath);
      if (!notesFile) {
        continue;
      }

      const xml = await notesFile.async('string');
      const escaped = this.escapeXml(`此页为截图嵌入，原始 HTML 可编辑版本见交付包。回退页：第 ${page.index} 页。`);
      const patched = xml.replace(
        '<a:t>Generated by PptxGenJS</a:t>',
        `<a:t>${escaped}</a:t>`,
      );
      zip.file(notesPath, patched);
    }

    const updated = await zip.generateAsync({ type: 'nodebuffer' });
    await writeFile(outputPath, updated);
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
