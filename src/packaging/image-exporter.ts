// Image Exporter — HTML artifact → SVG extraction + PNG capture via Playwright CLI

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import type { Artifact } from '../types.js';

const execFileAsync = promisify(execFile);

export interface ImageExportResult {
  svgPaths: string[];
  pngPath: string | null;
  pngSupported: boolean;
  pngPaths: string[];
  primaryImagePath: string | null;
}

export class ImageExporter {
  async export(artifact: Artifact, outputDir: string, htmlPath?: string): Promise<ImageExportResult> {
    await mkdir(outputDir, { recursive: true });

    const svgPaths = await this.extractSvgs(artifact.html, outputDir);
    const pngPaths = await this.capturePngs(artifact, outputDir, htmlPath);
    const pngPath = pngPaths[0] ?? null;
    const primaryImagePath = svgPaths[0] ?? pngPath;

    return {
      svgPaths,
      pngPath,
      pngSupported: pngPaths.length > 0,
      pngPaths,
      primaryImagePath,
    };
  }

  /**
   * Extract all inline <svg> elements from HTML and write each as a standalone .svg file.
   */
  private async extractSvgs(html: string, outputDir: string): Promise<string[]> {
    const svgPattern = /<svg[\s\S]*?<\/svg>/gi;
    const matches = html.match(svgPattern);
    if (!matches || matches.length === 0) return [];

    const paths: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const svgContent = this.wrapStandaloneSvg(matches[i]);
      const filename = `figure-${i + 1}.svg`;
      const svgPath = join(outputDir, filename);
      await writeFile(svgPath, svgContent, 'utf-8');
      paths.push(svgPath);
    }
    return paths;
  }

  /**
   * Ensure the SVG has the XML declaration and xmlns attribute
   * so it works as a standalone file.
   */
  private wrapStandaloneSvg(raw: string): string {
    let svg = raw;
    // Add xmlns if missing
    if (!svg.includes('xmlns=')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Add XML declaration
    if (!svg.startsWith('<?xml')) {
      svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
    }
    return svg;
  }

  private async capturePngs(
    artifact: Artifact,
    outputDir: string,
    htmlPath?: string,
  ): Promise<string[]> {
    if (artifact.pages !== 1) {
      return [];
    }

    const pngPath = join(outputDir, 'output.png');
    const sourceUrl = pathToFileURL(htmlPath ?? join(outputDir, 'index.html')).href;
    try {
      await execFileAsync('playwright', ['screenshot', sourceUrl, pngPath]);
    } catch {
      // Playwright not installed or not in PATH — degrade gracefully
      return [];
    }
    return [pngPath];
  }
}
