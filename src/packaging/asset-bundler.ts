// AssetBundler — collects all dependent resources (fonts, images, CSS) and inlines into single file
// arc42 §5: Packaging domain — asset collection and inlining for self-contained delivery

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

/** Represents a resolved asset ready for inlining */
export interface ResolvedAsset {
  type: 'css' | 'font' | 'image';
  originalRef: string;
  mimeType: string;
  dataUri: string;
}

/** Options for asset bundling */
export interface BundleOptions {
  /** Base directory for resolving relative paths */
  baseDir: string;
  /** Whether to inline CSS @import rules */
  inlineCssImports: boolean;
  /** Whether to inline images referenced in HTML src/href */
  inlineImages: boolean;
  /** Whether to inline font files referenced in @font-face */
  inlineFonts: boolean;
  /** Maximum file size in bytes to inline (skip larger files) */
  maxInlineSize: number;
}

const DEFAULT_BUNDLE_OPTIONS: BundleOptions = {
  baseDir: '.',
  inlineCssImports: true,
  inlineImages: true,
  inlineFonts: true,
  maxInlineSize: 5 * 1024 * 1024, // 5MB
};

/** MIME type lookup for common asset extensions */
const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.css': 'text/css',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * AssetBundler collects external resources referenced in HTML and inlines them
 * as data URIs, producing a fully self-contained single-file document.
 */
export class AssetBundler {
  private options: BundleOptions;

  constructor(options?: Partial<BundleOptions>) {
    this.options = { ...DEFAULT_BUNDLE_OPTIONS, ...options };
  }

  /**
   * Bundle all external assets into the HTML, returning a self-contained string.
   */
  async bundle(html: string): Promise<{ html: string; assets: ResolvedAsset[] }> {
    const assets: ResolvedAsset[] = [];
    let result = html;

    if (this.options.inlineCssImports) {
      result = await this.inlineCssLinks(result, assets);
    }

    if (this.options.inlineImages) {
      result = await this.inlineImageSrcs(result, assets);
    }

    if (this.options.inlineFonts) {
      result = await this.inlineFontFaces(result, assets);
    }

    return { html: result, assets };
  }

  /**
   * Inline <link rel="stylesheet" href="..."> tags as <style> blocks.
   */
  private async inlineCssLinks(html: string, assets: ResolvedAsset[]): Promise<string> {
    const linkPattern = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
    const matches = [...html.matchAll(linkPattern)];

    let result = html;
    for (const match of matches) {
      const href = match[1];
      if (this.isRemoteUrl(href)) continue;

      const content = await this.tryReadFile(href);
      if (content === null) continue;

      const dataUri = this.toDataUri(content, 'text/css');
      assets.push({ type: 'css', originalRef: href, mimeType: 'text/css', dataUri });
      result = result.replace(match[0], `<style>\n${content.toString('utf-8')}\n</style>`);
    }

    return result;
  }

  /**
   * Inline <img src="..."> and background-image: url(...) as data URIs.
   */
  private async inlineImageSrcs(html: string, assets: ResolvedAsset[]): Promise<string> {
    // Inline img src attributes
    const imgPattern = /(<img\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi;
    const imgMatches = [...html.matchAll(imgPattern)];

    let result = html;
    for (const match of imgMatches) {
      const src = match[2];
      if (this.isRemoteUrl(src) || src.startsWith('data:')) continue;

      const content = await this.tryReadFile(src);
      if (content === null) continue;

      const mime = this.getMimeType(src);
      const dataUri = this.toDataUri(content, mime);
      assets.push({ type: 'image', originalRef: src, mimeType: mime, dataUri });
      result = result.replace(match[0], `${match[1]}${dataUri}${match[3]}`);
    }

    // Inline CSS url() references for images
    const urlPattern = /url\(["']?([^"')]+\.(?:png|jpg|jpeg|gif|svg|webp))["']?\)/gi;
    const urlMatches = [...result.matchAll(urlPattern)];

    for (const match of urlMatches) {
      const ref = match[1];
      if (this.isRemoteUrl(ref) || ref.startsWith('data:')) continue;

      const content = await this.tryReadFile(ref);
      if (content === null) continue;

      const mime = this.getMimeType(ref);
      const dataUri = this.toDataUri(content, mime);
      assets.push({ type: 'image', originalRef: ref, mimeType: mime, dataUri });
      result = result.replace(match[0], `url("${dataUri}")`);
    }

    return result;
  }

  /**
   * Inline @font-face url() references as data URIs.
   */
  private async inlineFontFaces(html: string, assets: ResolvedAsset[]): Promise<string> {
    const fontUrlPattern = /(url\(["']?)([^"')]+\.(?:woff2?|ttf|otf|eot))(["']?\))/gi;
    const matches = [...html.matchAll(fontUrlPattern)];

    let result = html;
    for (const match of matches) {
      const ref = match[2];
      if (this.isRemoteUrl(ref) || ref.startsWith('data:')) continue;

      const content = await this.tryReadFile(ref);
      if (content === null) continue;

      const mime = this.getMimeType(ref);
      const dataUri = this.toDataUri(content, mime);
      assets.push({ type: 'font', originalRef: ref, mimeType: mime, dataUri });
      result = result.replace(match[0], `${match[1]}${dataUri}${match[3]}`);
    }

    return result;
  }

  private isRemoteUrl(ref: string): boolean {
    return ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//');
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return MIME_MAP[ext] ?? 'application/octet-stream';
  }

  private toDataUri(content: Buffer, mimeType: string): string {
    return `data:${mimeType};base64,${content.toString('base64')}`;
  }

  private async tryReadFile(ref: string): Promise<Buffer | null> {
    try {
      const fullPath = resolve(this.options.baseDir, ref);
      // Path traversal guard: resolved path must stay within baseDir
      const normalizedBase = resolve(this.options.baseDir) + '/';
      if (!fullPath.startsWith(normalizedBase) && fullPath !== resolve(this.options.baseDir)) {
        console.warn(`[AssetBundler] path traversal blocked: ${ref} resolves outside baseDir`);
        return null;
      }
      const content = await readFile(fullPath);
      if (content.length > this.options.maxInlineSize) return null;
      return content;
    } catch (err) {
      console.warn(`[AssetBundler] failed to read asset: ${ref}`, (err as Error).message);
      return null;
    }
  }
}
