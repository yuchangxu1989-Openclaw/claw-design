// PackagingEngine — orchestrates artifact packaging into final deliverables
// arc42 §5: Packaging domain — single-file HTML, ZIP bundle, standalone PDF

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import type { Artifact } from '../types.js';
import { AssetBundler } from './asset-bundler.js';
import type { BundleOptions } from './asset-bundler.js';
import { MetadataInjector } from './metadata-injector.js';
import type { PackageMetadata } from './metadata-injector.js';
import { DeliveryAdapter } from './delivery-adapter.js';
import type { DeliveryOptions, DeliveryResult } from './delivery-adapter.js';

/** Output format for the packaging engine */
export type PackageFormat = 'single-html' | 'zip' | 'pdf-ready';

/** Configuration for the packaging engine */
export interface PackagingConfig {
  format: PackageFormat;
  outputDir: string;
  metadata?: PackageMetadata;
  bundleOptions?: Partial<BundleOptions>;
  delivery?: DeliveryOptions;
  /** Whether to minify the output HTML */
  minify?: boolean;
}

/** Result of a packaging operation */
export interface PackageResult {
  taskId: string;
  format: PackageFormat;
  outputPath: string;
  sizeBytes: number;
  assetsInlined: number;
  metadataInjected: boolean;
  delivery: DeliveryResult | null;
}

/**
 * PackagingEngine orchestrates the full packaging pipeline:
 * 1. Asset bundling (inline fonts, images, CSS)
 * 2. Metadata injection (author, date, version, generator)
 * 3. Format-specific packaging (single HTML, ZIP, PDF-ready)
 * 4. Delivery to target channel
 */
export class PackagingEngine {
  private bundler: AssetBundler;
  private injector: MetadataInjector;
  private deliveryAdapter: DeliveryAdapter;

  constructor() {
    this.bundler = new AssetBundler();
    this.injector = new MetadataInjector();
    this.deliveryAdapter = new DeliveryAdapter();
  }

  /**
   * Package an artifact into the specified format and deliver it.
   */
  async package(artifact: Artifact, config: PackagingConfig): Promise<PackageResult> {
    // Input validation
    if (!artifact.html || artifact.html.trim().length === 0) {
      throw new Error('PackagingEngine: artifact.html must not be empty');
    }
    const validFormats: PackageFormat[] = ['single-html', 'zip', 'pdf-ready'];
    if (!validFormats.includes(config.format)) {
      throw new Error(`PackagingEngine: invalid format "${config.format}", must be one of: ${validFormats.join(', ')}`);
    }
    if (!config.outputDir || config.outputDir.trim().length === 0) {
      throw new Error('PackagingEngine: config.outputDir must not be empty');
    }

    // 1. Bundle assets into self-contained HTML
    const bundler = config.bundleOptions
      ? new AssetBundler(config.bundleOptions)
      : this.bundler;

    const { html: bundledHtml, assets } = await bundler.bundle(artifact.html);

    // 2. Inject metadata
    const metadata: PackageMetadata = {
      date: new Date().toISOString(),
      generator: 'Claw Design Engine',
      ...config.metadata,
    };
    const finalHtml = this.injector.inject(bundledHtml, metadata);

    // 3. Format-specific output
    const outputHtml = config.minify ? this.minifyHtml(finalHtml) : finalHtml;
    const { path: outputPath, buffer: outputBuffer } = await this.writeOutput(outputHtml, config);

    // 4. Deliver if channel specified
    let delivery: DeliveryResult | null = null;
    if (config.delivery) {
      const contentType = this.getContentType(config.format);
      delivery = await this.deliveryAdapter.deliver(outputBuffer, contentType, config.delivery);
    }

    return {
      taskId: artifact.taskId,
      format: config.format,
      outputPath,
      sizeBytes: outputBuffer.length,
      assetsInlined: assets.length,
      metadataInjected: true,
      delivery,
    };
  }

  private async writeOutput(html: string, config: PackagingConfig): Promise<{ path: string; buffer: Buffer }> {
    await mkdir(config.outputDir, { recursive: true });

    switch (config.format) {
      case 'single-html': {
        const path = join(config.outputDir, 'index.html');
        const buffer = Buffer.from(html, 'utf-8');
        await writeFile(path, buffer);
        return { path, buffer };
      }
      case 'zip': {
        // Real ZIP compression using jszip
        const zip = new JSZip();
        zip.file('index.html', html);
        zip.file('manifest.json', JSON.stringify({
          format: 'claw-design-bundle',
          version: '1.0',
          files: ['index.html'],
          createdAt: new Date().toISOString(),
        }, null, 2));
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const zipPath = join(config.outputDir, 'bundle.zip');
        await writeFile(zipPath, zipBuffer);
        return { path: zipPath, buffer: zipBuffer };
      }
      case 'pdf-ready': {
        // PDF-ready: inject print styles for browser Print→PDF workflow
        const printHtml = this.injectPrintStyles(html);
        const buffer = Buffer.from(printHtml, 'utf-8');
        const path = join(config.outputDir, 'print.html');
        await writeFile(path, buffer);
        return { path, buffer };
      }
    }
  }

  private injectPrintStyles(html: string): string {
    const printCss = `<style media="print">
@page { size: A4 landscape; margin: 12mm; }
body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
section { page-break-after: always; }
section:last-child { page-break-after: avoid; }
nav, .no-print, button { display: none !important; }
h1, h2, h3 { page-break-after: avoid; }
figure, img { page-break-inside: avoid; }
</style>`;

    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${printCss}\n</head>`);
    }
    return html + '\n' + printCss;
  }

  private minifyHtml(html: string): string {
    // Lightweight minification: collapse whitespace between tags, trim lines
    return html
      .replace(/>\s+</g, '><')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private getContentType(format: PackageFormat): string {
    switch (format) {
      case 'single-html':
      case 'pdf-ready':
        return 'text/html; charset=utf-8';
      case 'zip':
        return 'application/zip';
    }
  }
}
