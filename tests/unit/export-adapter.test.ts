import { mkdtemp, readFile, stat } from 'node:fs/promises';
import JSZip from 'jszip';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportAdapter } from '../../src/export/export-adapter.js';
import {
  buildFallbackImageData,
  extractPptxPageAnalyses,
} from '../../src/export/pptx-fallback.js';
import type { Artifact, ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#3366ff',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '4px',
  cssVariables: {},
};

function makeArtifact(html: string): Artifact {
  return {
    taskId: 'task-export',
    type: 'slides',
    status: 'ready',
    html,
    pages: 2,
    metadata: {},
  };
}

describe('ExportAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports HTML, PPTX, PDF and extracted SVG files', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const artifact = makeArtifact(`<!DOCTYPE html><html><body>
      <section><h1>Overview</h1><p>Alpha</p></section>
      <section><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg></section>
    </body></html>`);

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);

    expect(bundle.files).toContain(join(outputDir, 'index.html'));
    expect(bundle.files).toContain(join(outputDir, 'output.pptx'));
    expect(bundle.files).toContain(join(outputDir, 'print.html'));
    expect(bundle.files).toContain(join(outputDir, 'output.pdf'));
    expect(bundle.svgPaths).toEqual([join(outputDir, 'figure-1.svg')]);
    await expect(stat(bundle.htmlPath)).resolves.toBeTruthy();
    await expect(stat(bundle.pptxPath!)).resolves.toBeTruthy();
    await expect(stat(bundle.pdfPath!)).resolves.toBeTruthy();
    expect(bundle.consistency?.checkedFormats).toEqual(expect.arrayContaining(['html', 'pptx', 'pdf', 'svg']));
  });

  it('writes the original HTML to index.html', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const html = '<html><body><section><h1>Stored HTML</h1></section></body></html>';
    const artifact = makeArtifact(html);

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);
    const written = await readFile(bundle.htmlPath, 'utf-8');

    expect(written).toBe(html);
  });

  it('creates a fallback PPTX slide when no text blocks are extracted', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const artifact = makeArtifact('<html><body><div><svg viewBox="0 0 10 10"></svg></div></body></html>');

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);
    const file = await stat(bundle.pptxPath!);

    expect(file.size).toBeGreaterThan(0);
  });

  it('adds fallback slide image and notes for complex pages', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const artifact = makeArtifact(`<!DOCTYPE html><html><body>
      <section>
        <div class="frame" style="position: relative; animation: fade 1s ease;">
          <svg viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0%" stop-color="#000" /></linearGradient></defs><path d="M0 0L10 10" /></svg>
          <div style="position:absolute; inset: 0;"><div><div><div><h1>Fallback slide</h1><p>Complex content</p></div></div></div></div>
        </div>
      </section>
    </body></html>`);

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);
    const archive = await readFile(bundle.pptxPath!);
    const zip = await JSZip.loadAsync(archive);
    const notesXml = await zip.file('ppt/notesSlides/notesSlide1.xml')?.async('string');
    const slideXml = await zip.file('ppt/slides/slide1.xml')?.async('string');

    expect(bundle.notes).toEqual(expect.arrayContaining([expect.stringContaining('PPTX 回退页：第 1 页')]));
    expect(notesXml).toContain('此页为截图嵌入');
    expect(slideXml).toContain('Fallback Page 1');
    expect(slideXml).toContain('asvg:svgBlip');
  });

  it('detects fallback pages and preserves normal pages as editable text', () => {
    const pages = extractPptxPageAnalyses(`<!DOCTYPE html><html><body>
      <section><h1>Editable</h1><p>Simple body copy</p></section>
      <section><div style="animation: fade 1s ease"><svg viewBox="0 0 10 10"><path d="M0 0L10 10" /></svg></div></section>
    </body></html>`);

    expect(pages).toHaveLength(2);
    expect(pages[0].requiresFallback).toBe(false);
    expect(pages[1].requiresFallback).toBe(true);
    expect(pages[1].fallbackReasons.map(reason => reason.code)).toEqual(expect.arrayContaining(['animation']));
  });

  it('builds svg fallback image data for screenshot embedding', () => {
    const page = extractPptxPageAnalyses('<section><h1>Chart</h1><div style="animation: spin 1s linear"><svg><path d="M0 0L1 1" /></svg></div></section>')[0];
    const data = buildFallbackImageData(page, theme);

    expect(data.startsWith('image/svg+xml;base64,')).toBe(true);
    const decoded = Buffer.from(data.split(',')[1], 'base64').toString('utf8');
    expect(decoded).toContain('Rendered as fallback image for PPTX compatibility');
    expect(decoded).toContain('Chart');
  });

  it('extracts text blocks from sections before falling back to body text', async () => {
    const adapter = new ExportAdapter() as any;

    expect(adapter.extractTextBlocks('<body><section><h1>One</h1></section><section><p>Two</p></section></body>')).toEqual([
      'One',
      'Two',
    ]);
    expect(adapter.extractTextBlocks('<html><body><div>Body only text</div></body></html>')).toEqual([
      'Body only text',
    ]);
  });

  it('writes speaker notes for fallback pages when generating pptx directly', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const adapter = new ExportAdapter() as any;
    const outputPath = join(outputDir, 'direct-output.pptx');
    const artifact = makeArtifact('<html><body><section><div style="animation: fade 1s ease"><svg><path d="M0 0L10 10" /></svg></div></section></body></html>');
    const pages = extractPptxPageAnalyses(artifact.html);

    const notes = await adapter.generatePptx(artifact, theme, outputPath, pages);
    const archive = await readFile(outputPath);
    const zip = await JSZip.loadAsync(archive);
    const notesXml = await zip.file('ppt/notesSlides/notesSlide1.xml')?.async('string');

    expect(notes[0]).toContain('PPTX 回退页：第 1 页');
    expect(notesXml).toContain('原始 HTML 可编辑版本见交付包');
  });

  it('includes generated SVG paths in the delivery bundle file list', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const artifact = makeArtifact(`<!DOCTYPE html><html><body>
      <section><svg viewBox="0 0 10 10"><rect width="10" height="10" /></svg></section>
      <section><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" /></svg></section>
    </body></html>`);

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);

    expect(bundle.svgPaths).toHaveLength(2);
    expect(bundle.files).toEqual(expect.arrayContaining(bundle.svgPaths!));
  });

  it('exports PNG for single-page artifacts and records adaptation notes', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-design-export-'));
    const artifact: Artifact = {
      taskId: 'task-export-image',
      type: 'chart',
      status: 'ready',
      pages: 1,
      metadata: {},
      html: `<!DOCTYPE html><html><body>
        <section><h1>Revenue</h1><svg viewBox="0 0 10 10"><rect width="10" height="10" /></svg></section>
      </body></html>`,
    };

    const bundle = await new ExportAdapter().export(artifact, theme, outputDir);

    expect(bundle.pngPath).toBe(join(outputDir, 'output.png'));
    expect(bundle.pngPaths).toEqual([join(outputDir, 'output.png')]);
    await expect(stat(bundle.pngPath!)).resolves.toBeTruthy();
    expect(bundle.consistency?.checkedFormats).toEqual(expect.arrayContaining(['png']));
  });
});
