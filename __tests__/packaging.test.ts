// Packaging module unit tests — Wave 3
// Uses Vitest test runner

import { beforeEach, describe, expect, it } from 'vitest';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { AssetBundler } from '../src/packaging/asset-bundler.ts';
import { MetadataInjector } from '../src/packaging/metadata-injector.ts';
import { DeliveryAdapter } from '../src/packaging/delivery-adapter.ts';
import { PackagingEngine } from '../src/packaging/packaging-engine.ts';
import type { Artifact } from '../src/types.ts';

// --- AssetBundler Tests ---

describe('AssetBundler', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `claw-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it('inlines local CSS link tags as <style> blocks', async () => {
    const cssContent = 'body { color: red; }';
    await writeFile(join(testDir, 'style.css'), cssContent);

    const html = `<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>`;
    const bundler = new AssetBundler({ baseDir: testDir });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('<style>');
    expect(result.html).toContain('body { color: red; }');
    expect(result.html).not.toContain('<link');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].type).toBe('css');
  });

  it('inlines local image src as data URI', async () => {
    const imgData = Buffer.from('fake-png-data');
    await writeFile(join(testDir, 'logo.png'), imgData);

    const html = `<img src="logo.png" alt="logo">`;
    const bundler = new AssetBundler({ baseDir: testDir });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('data:image/png;base64,');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].type).toBe('image');
    expect(result.assets[0].mimeType).toBe('image/png');
  });

  it('inlines font url() references as data URIs', async () => {
    const fontData = Buffer.from('fake-woff2-data');
    await writeFile(join(testDir, 'font.woff2'), fontData);

    const html = `<style>@font-face { src: url("font.woff2"); }</style>`;
    const bundler = new AssetBundler({ baseDir: testDir });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('data:font/woff2;base64,');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].type).toBe('font');
  });

  it('skips remote URLs (http/https)', async () => {
    const html = `<img src="https://example.com/img.png"><link rel="stylesheet" href="https://cdn.example.com/style.css">`;
    const bundler = new AssetBundler({ baseDir: testDir });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('https://example.com/img.png');
    expect(result.html).toContain('https://cdn.example.com/style.css');
    expect(result.assets).toHaveLength(0);
  });

  it('skips files exceeding maxInlineSize', async () => {
    const bigData = Buffer.alloc(1024);
    await writeFile(join(testDir, 'big.png'), bigData);

    const html = `<img src="big.png">`;
    const bundler = new AssetBundler({ baseDir: testDir, maxInlineSize: 512 });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('big.png');
    expect(result.html).not.toContain('data:');
    expect(result.assets).toHaveLength(0);
  });

  it('skips missing files gracefully', async () => {
    const html = `<img src="nonexistent.png">`;
    const bundler = new AssetBundler({ baseDir: testDir });
    const result = await bundler.bundle(html);

    expect(result.html).toContain('nonexistent.png');
    expect(result.assets).toHaveLength(0);
  });
});

// --- MetadataInjector Tests ---

describe('MetadataInjector', () => {
  const injector = new MetadataInjector();

  it('injects meta tags before </head>', () => {
    const html = `<html><head><title>Test</title></head><body></body></html>`;
    const result = injector.inject(html, { author: 'Alice', version: '1.0' });

    expect(result).toContain('<meta name="author" content="Alice">');
    expect(result).toContain('<meta name="version" content="1.0">');
    expect(result).toContain('<meta name="generator"');
    expect(result).toContain('</head>');
  });

  it('injects JSON-LD structured data', () => {
    const html = `<html><head></head><body></body></html>`;
    const result = injector.inject(html, {
      author: 'Bob',
      title: 'My Design',
      date: '2025-01-01T00:00:00Z',
    });

    expect(result).toContain('application/ld+json');
    expect(result).toContain('data-claw-design');
    expect(result).toContain('"Bob"');
    expect(result).toContain('"My Design"');
  });

  it('handles HTML without <head> tag', () => {
    const html = `<html><body><p>Hello</p></body></html>`;
    const result = injector.inject(html, { author: 'Test' });

    expect(result).toContain('<head>');
    expect(result).toContain('<meta name="author" content="Test">');
  });

  it('handles bare HTML fragments', () => {
    const html = `<div>Content</div>`;
    const result = injector.inject(html, { generator: 'TestGen' });

    expect(result).toContain('<head>');
    expect(result).toContain('TestGen');
    expect(result).toContain('<div>Content</div>');
  });

  it('escapes special characters in metadata values', () => {
    const html = `<html><head></head><body></body></html>`;
    const result = injector.inject(html, { author: 'A <script>"hack"</script>' });

    expect(result).not.toContain('<script>"hack"</script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('extracts previously injected metadata', () => {
    const html = `<html><head></head><body></body></html>`;
    const injected = injector.inject(html, {
      author: 'Alice',
      title: 'Test Doc',
      version: '2.0',
      date: '2025-06-01T00:00:00Z',
    });

    const extracted = injector.extract(injected);
    expect(extracted).not.toBeNull();
    expect(extracted!.author).toBe('Alice');
    expect(extracted!.title).toBe('Test Doc');
    expect(extracted!.version).toBe('2.0');
  });

  it('returns null when no metadata found', () => {
    const html = `<html><head></head><body></body></html>`;
    const result = injector.extract(html);
    expect(result).toBeNull();
  });
});

// --- DeliveryAdapter Tests ---

describe('DeliveryAdapter', () => {
  let testDir: string;
  const adapter = new DeliveryAdapter();

  beforeEach(async () => {
    testDir = join(tmpdir(), `claw-delivery-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it('delivers to filesystem', async () => {
    const content = Buffer.from('<html><body>Hello</body></html>');
    const result = await adapter.deliver(content, 'text/html', {
      channel: 'filesystem',
      outputDir: testDir,
      filename: 'test.html',
    });

    expect(result.channel).toBe('filesystem');
    expect(result.success).toBe(true);
    expect(result.location.endsWith('test.html')).toBe(true);
    expect(result.sizeBytes).toBe(content.length);

    const written = await readFile(join(testDir, 'test.html'));
    expect(written).toEqual(content);
  });

  it('delivers as HTTP response', async () => {
    const content = Buffer.from('<html>test</html>');
    const result = await adapter.deliver(content, 'text/html', {
      channel: 'http-response',
      filename: 'download.html',
    });

    expect(result.channel).toBe('http-response');
    expect(result.success).toBe(true);
    expect(result.sizeBytes).toBe(content.length);
  });

  it('delivers as message attachment', async () => {
    const content = Buffer.from('zip-data');
    const result = await adapter.deliver(content, 'application/zip', {
      channel: 'message-attachment',
      target: 'ou_user123',
      filename: 'design.zip',
    });

    expect(result.channel).toBe('message-attachment');
    expect(result.success).toBe(true);
    expect(result.location.includes('ou_user123')).toBe(true);
    expect(result.sizeBytes).toBe(content.length);
  });

  it('prepares HTTP response payload with correct headers', () => {
    const content = Buffer.from('hello');
    const payload = adapter.prepareHttpResponse(content, 'text/html', 'file.html');

    expect(payload.statusCode).toBe(200);
    expect(payload.headers['Content-Type']).toBe('text/html');
    expect(payload.headers['Content-Length']).toBe('5');
    expect(payload.headers['Content-Disposition']?.includes('file.html')).toBe(true);
    expect(payload.body).toEqual(content);
  });

  it('prepares message attachment payload', () => {
    const content = Buffer.from('data');
    const payload = adapter.prepareAttachment(content, 'application/pdf', 'target-id', 'doc.pdf');

    expect(payload.target).toBe('target-id');
    expect(payload.filename).toBe('doc.pdf');
    expect(payload.contentType).toBe('application/pdf');
    expect(payload.data).toEqual(content);
  });
});

// --- PackagingEngine Tests ---

describe('PackagingEngine', () => {
  let testDir: string;
  const engine = new PackagingEngine();

  const makeArtifact = (html: string): Artifact => ({
    taskId: 'test-task-001',
    type: 'slides',
    status: 'ready',
    html,
    pages: 1,
    metadata: {},
  });

  beforeEach(async () => {
    testDir = join(tmpdir(), `claw-pkg-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it('packages artifact as single-html with metadata', async () => {
    const artifact = makeArtifact('<html><head></head><body><h1>Hello</h1></body></html>');
    const result = await engine.package(artifact, {
      format: 'single-html',
      outputDir: testDir,
      metadata: { author: 'TestUser', version: '1.0' },
    });

    expect(result.taskId).toBe('test-task-001');
    expect(result.format).toBe('single-html');
    expect(result.outputPath.endsWith('index.html')).toBe(true);
    expect(result.metadataInjected).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);

    const content = await readFile(result.outputPath, 'utf-8');
    expect(content).toContain('TestUser');
    expect(content).toContain('Claw Design Engine');
  });

  it('packages artifact as zip (compressed ZIP file)', async () => {
    const artifact = makeArtifact('<html><body>Chart</body></html>');
    const result = await engine.package(artifact, {
      format: 'zip',
      outputDir: testDir,
    });

    expect(result.format).toBe('zip');
    expect(result.outputPath.endsWith('bundle.zip')).toBe(true);

    const zipData = await readFile(result.outputPath);
    expect(zipData[0]).toBe(0x50);
    expect(zipData[1]).toBe(0x4b);
  });

  it('packages artifact as pdf-ready with print styles', async () => {
    const artifact = makeArtifact('<html><head></head><body><section>Slide 1</section></body></html>');
    const result = await engine.package(artifact, {
      format: 'pdf-ready',
      outputDir: testDir,
    });

    expect(result.format).toBe('pdf-ready');
    expect(result.outputPath.endsWith('print.html')).toBe(true);

    const content = await readFile(result.outputPath, 'utf-8');
    expect(content).toContain('@page');
    expect(content).toContain('print-color-adjust');
  });

  it('delivers to filesystem when delivery option specified', async () => {
    const deliveryDir = join(testDir, 'delivered');
    const artifact = makeArtifact('<html><body>Delivered</body></html>');
    const result = await engine.package(artifact, {
      format: 'single-html',
      outputDir: testDir,
      delivery: {
        channel: 'filesystem',
        outputDir: deliveryDir,
        filename: 'final.html',
      },
    });

    expect(result.delivery).not.toBeNull();
    expect(result.delivery!.channel).toBe('filesystem');
    expect(result.delivery!.success).toBe(true);
  });

  it('minifies HTML when minify option is true', async () => {
    const artifact = makeArtifact('<html>\n  <head>\n  </head>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>');
    const result = await engine.package(artifact, {
      format: 'single-html',
      outputDir: testDir,
      minify: true,
    });

    const content = await readFile(result.outputPath, 'utf-8');
    expect(content).not.toContain('  <body>');
  });

  it('bundles local assets when bundleOptions provided', async () => {
    await writeFile(join(testDir, 'app.css'), 'h1 { font-size: 2em; }');

    const artifact = makeArtifact(
      `<html><head><link rel="stylesheet" href="app.css"></head><body><h1>Hi</h1></body></html>`
    );

    const outputDir = join(testDir, 'out');
    const result = await engine.package(artifact, {
      format: 'single-html',
      outputDir,
      bundleOptions: { baseDir: testDir },
    });

    expect(result.assetsInlined).toBe(1);
    const content = await readFile(result.outputPath, 'utf-8');
    expect(content).toContain('font-size: 2em');
    expect(content).toContain('<style>');
  });

  // Regression: ZIP delivery must deliver actual ZIP binary, not HTML text
  it('delivers ZIP format as valid ZIP binary (PK magic bytes)', async () => {
    const deliveryDir = join(testDir, 'zip-delivered');
    const artifact = makeArtifact('<html><body>ZIP test</body></html>');
    const result = await engine.package(artifact, {
      format: 'zip',
      outputDir: testDir,
      delivery: {
        channel: 'filesystem',
        outputDir: deliveryDir,
        filename: 'output.zip',
      },
    });

    expect(result.delivery).not.toBeNull();
    expect(result.delivery!.success).toBe(true);

    // The delivered file must be a valid ZIP (PK\x03\x04 magic bytes)
    const deliveredData = await readFile(join(deliveryDir, 'output.zip'));
    expect(deliveredData[0]).toBe(0x50); // P
    expect(deliveredData[1]).toBe(0x4b); // K
    expect(deliveredData[2]).toBe(0x03);
    expect(deliveredData[3]).toBe(0x04);
  });

  it('sizeBytes for zip format reflects actual ZIP size, not HTML size', async () => {
    const artifact = makeArtifact('<html><body>Size check</body></html>');
    const result = await engine.package(artifact, {
      format: 'zip',
      outputDir: testDir,
    });

    const zipData = await readFile(result.outputPath);
    expect(result.sizeBytes).toBe(zipData.length);
  });
});
