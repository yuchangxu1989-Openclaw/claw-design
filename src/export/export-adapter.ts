// ExportAdapter — HTML → PPTX export using pptxgenjs
// Structured block mapping from HTML slide semantics to PPTX elements

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
import { parseHtmlToSlideBlocks } from './pptx-structure-parser.js';
import type { PptxBlock, PptxSlideBlocks } from './pptx-structure-parser.js';
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

    // Parse structured blocks from HTML for enhanced PPTX rendering
    const structuredSlides = parseHtmlToSlideBlocks(artifact.html);

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

        // Find matching structured slide data for this page
        const structured = structuredSlides.find(s => s.index === page.index);

        if (structured && structured.blocks.length > 0) {
          this.renderStructuredSlide(slide, structured, theme);
        } else {
          // Fallback to plain text rendering for pages without structure
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
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    await writeFile(outputPath, buffer);

    if (fallbackNotes.length > 0) {
      await this.annotateFallbackNotes(outputPath, resolvedPages.filter(page => page.requiresFallback));
    }

    return fallbackNotes;
  }

  /** Render a structured slide with proper block formatting */
  private renderStructuredSlide(
    slide: any,
    structured: PptxSlideBlocks,
    theme: ThemePack,
  ): void {
    if (structured.slideType === 'comparison') {
      this.renderComparisonSlide(slide, structured, theme);
      return;
    }

    let yOffset = 0.4;
    const primaryColor = theme.colorPrimary.replace('#', '') || '333333';

    for (const block of structured.blocks) {
      yOffset = this.renderBlock(slide, block, yOffset, primaryColor);
      if (yOffset >= SLIDE_HEIGHT_INCHES - 0.5) break;
    }
  }

  /** Render a comparison slide with left/right dual-column layout */
  private renderComparisonSlide(
    slide: any,
    structured: PptxSlideBlocks,
    theme: ThemePack,
  ): void {
    const primaryColor = theme.colorPrimary.replace('#', '') || '333333';
    const halfWidth = (SLIDE_WIDTH_INCHES - 2) / 2;
    const leftX = 0.8;
    const rightX = leftX + halfWidth + 0.4;

    // Slide title
    slide.addText(structured.title, {
      x: 0.8, y: 0.3, w: SLIDE_WIDTH_INCHES - 1.6, h: 0.8,
      fontSize: 28,
      bold: true,
      color: primaryColor,
      fontFace: 'Arial',
      valign: 'top',
    });

    // Left column heading
    if (structured.leftHeading) {
      slide.addText(structured.leftHeading, {
        x: leftX, y: 1.3, w: halfWidth, h: 0.6,
        fontSize: 20,
        bold: true,
        color: '333333',
        fontFace: 'Arial',
        valign: 'top',
      });
    }

    // Right column heading
    if (structured.rightHeading) {
      slide.addText(structured.rightHeading, {
        x: rightX, y: 1.3, w: halfWidth, h: 0.6,
        fontSize: 20,
        bold: true,
        color: '333333',
        fontFace: 'Arial',
        valign: 'top',
      });
    }

    const contentY = (structured.leftHeading || structured.rightHeading) ? 2.0 : 1.3;
    const contentH = SLIDE_HEIGHT_INCHES - contentY - 0.5;

    // Left column items
    if (structured.leftItems && structured.leftItems.length > 0) {
      slide.addText(
        structured.leftItems.map(item => ({ text: item, options: { bullet: true, indentLevel: 0 } })),
        {
          x: leftX, y: contentY, w: halfWidth, h: contentH,
          fontSize: 14,
          color: '333333',
          fontFace: 'Arial',
          valign: 'top',
          wrap: true,
          lineSpacingMultiple: 1.4,
        },
      );
    }

    // Right column items
    if (structured.rightItems && structured.rightItems.length > 0) {
      slide.addText(
        structured.rightItems.map(item => ({ text: item, options: { bullet: true, indentLevel: 0 } })),
        {
          x: rightX, y: contentY, w: halfWidth, h: contentH,
          fontSize: 14,
          color: '333333',
          fontFace: 'Arial',
          valign: 'top',
          wrap: true,
          lineSpacingMultiple: 1.4,
        },
      );
    }

    // Vertical divider line between columns
    slide.addShape('line', {
      x: leftX + halfWidth + 0.2,
      y: contentY,
      w: 0,
      h: contentH,
      line: { color: 'CCCCCC', width: 1 },
    });
  }

  /** Render a single block element onto a slide, returning the new y offset */
  private renderBlock(
    slide: any,
    block: PptxBlock,
    yOffset: number,
    primaryColor: string,
  ): number {
    const contentWidth = SLIDE_WIDTH_INCHES - 1.6;
    const xMargin = 0.8;

    switch (block.type) {
      case 'heading': {
        const fontSize = block.level === 1 ? 32 : block.level === 2 ? 26 : 22;
        const blockHeight = fontSize >= 28 ? 0.9 : 0.7;
        slide.addText(block.text, {
          x: xMargin, y: yOffset, w: contentWidth, h: blockHeight,
          fontSize,
          bold: true,
          color: primaryColor,
          fontFace: 'Arial',
          valign: 'top',
        });
        return yOffset + blockHeight;
      }

      case 'paragraph': {
        const estimatedLines = Math.ceil(block.text.length / 80);
        const blockHeight = Math.max(0.5, estimatedLines * 0.35);
        slide.addText(block.text, {
          x: xMargin, y: yOffset, w: contentWidth, h: blockHeight,
          fontSize: 16,
          color: '333333',
          fontFace: 'Arial',
          valign: 'top',
          wrap: true,
        });
        return yOffset + blockHeight + 0.1;
      }

      case 'bullet-list': {
        if (block.items && block.items.length > 0) {
          const blockHeight = Math.max(0.6, block.items.length * 0.4);
          slide.addText(
            block.items.map(item => ({ text: item, options: { bullet: true, indentLevel: block.level ?? 0 } })),
            {
              x: xMargin, y: yOffset, w: contentWidth, h: blockHeight,
              fontSize: 15,
              color: '333333',
              fontFace: 'Arial',
              valign: 'top',
              wrap: true,
              lineSpacingMultiple: 1.3,
            },
          );
          return yOffset + blockHeight + 0.15;
        }
        return yOffset;
      }

      case 'ordered-list': {
        if (block.items && block.items.length > 0) {
          const blockHeight = Math.max(0.6, block.items.length * 0.4);
          slide.addText(
            block.items.map(item => ({ text: item, options: { bullet: { type: 'number' }, indentLevel: block.level ?? 0 } })),
            {
              x: xMargin, y: yOffset, w: contentWidth, h: blockHeight,
              fontSize: 15,
              color: '333333',
              fontFace: 'Arial',
              valign: 'top',
              wrap: true,
              lineSpacingMultiple: 1.3,
            },
          );
          return yOffset + blockHeight + 0.15;
        }
        return yOffset;
      }

      default:
        return yOffset;
    }
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
