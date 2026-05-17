// Adapter module unit tests — Wave 4
// Tests: StandaloneAdapter, OpenClawInfraAdapter (mocked), AdapterFactory

import { beforeEach, describe, expect, it } from 'vitest';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { StandaloneAdapter } from '../src/adapter/standalone-adapter.ts';
import { OpenClawInfraAdapter } from '../src/adapter/openclaw-infra-adapter.ts';
import { createInfraAdapter, detectEnvironment } from '../src/adapter/adapter-factory.ts';
import type { EventBus } from '../src/adapter/openclaw-infra-adapter.ts';
import type { OutputPackage } from '../src/adapter/host-adapter.ts';

// --- StandaloneAdapter Tests ---

describe('StandaloneAdapter', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `claw-adapter-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it('resolves an existing asset path', async () => {
    const filePath = join(testDir, 'asset.png');
    await writeFile(filePath, 'fake-image-data');

    const adapter = new StandaloneAdapter({ baseDir: testDir });
    const resolved = await adapter.resolveAsset('asset.png');
    expect(resolved).toBe(filePath);
  });

  it('throws when resolving a non-existent asset', async () => {
    const adapter = new StandaloneAdapter({ baseDir: testDir });
    await expect(adapter.resolveAsset('missing.png')).rejects.toSatisfy(
      (err: NodeJS.ErrnoException) => err.code === 'ENOENT' || err.message.includes('no such file')
    );
  });

  // Regression: path traversal must be rejected
  it('rejects path traversal attempts (../escape)', async () => {
    const adapter = new StandaloneAdapter({ baseDir: testDir });
    await expect(adapter.resolveAsset('../../../etc/passwd')).rejects.toThrow(/traversal denied/);
  });

  it('rejects path traversal with nested ../', async () => {
    const adapter = new StandaloneAdapter({ baseDir: testDir });
    await expect(adapter.resolveAsset('sub/../../secret.txt')).rejects.toThrow(/traversal denied/);
  });

  it('returns default config', async () => {
    const adapter = new StandaloneAdapter({
      baseDir: testDir,
      outputDir: join(testDir, 'out'),
      templateDir: join(testDir, 'tpl'),
    });
    const config = await adapter.getConfig();
    expect(config.templateDir).toBe(join(testDir, 'tpl'));
    expect(config.outputDir).toBe(join(testDir, 'out'));
    expect(config.defaultFormat).toBe('single-html');
  });

  it('delivers output by copying file', async () => {
    const srcDir = join(testDir, 'src');
    const outDir = join(testDir, 'delivered');
    await mkdir(srcDir, { recursive: true });

    const srcFile = join(srcDir, 'result.html');
    await writeFile(srcFile, '<html><body>Done</body></html>');

    const adapter = new StandaloneAdapter({ baseDir: testDir, outputDir: outDir });
    const pkg: OutputPackage = {
      path: srcFile,
      format: 'single-html',
      sizeBytes: 30,
    };

    const result = await adapter.deliverOutput(pkg);
    expect(result.success).toBe(true);
    expect(result.location?.includes('result.html')).toBe(true);

    const content = await readFile(result.location!, 'utf-8');
    expect(content).toBe('<html><body>Done</body></html>');
  });

  it('notifyProgress is a no-op (does not throw)', () => {
    const adapter = new StandaloneAdapter({ baseDir: testDir });
    expect(() => adapter.notifyProgress('generating', 50)).not.toThrow();
  });
});

// --- AdapterFactory Tests ---

describe('AdapterFactory', () => {
  it('creates OpenClawInfraAdapter for "openclaw" env', () => {
    const adapter = createInfraAdapter('openclaw');
    expect(adapter).toBeInstanceOf(OpenClawInfraAdapter);
  });

  it('creates StandaloneAdapter for "standalone" env', () => {
    const adapter = createInfraAdapter('standalone');
    expect(adapter).toBeInstanceOf(StandaloneAdapter);
  });

  it('falls back to StandaloneAdapter for unknown env', () => {
    const adapter = createInfraAdapter('unknown' as never);
    expect(adapter).toBeInstanceOf(StandaloneAdapter);
  });

  it('passes options to OpenClawInfraAdapter', async () => {
    const adapter = createInfraAdapter('openclaw', {
      openclaw: { workspaceRoot: '/tmp/test-ws' },
    });
    const config = await adapter.getConfig();
    expect(config.templateDir.includes('/tmp/test-ws')).toBe(true);
  });

  it('passes options to StandaloneAdapter', async () => {
    const adapter = createInfraAdapter('standalone', {
      standalone: { baseDir: '/tmp/sa-test', outputDir: '/tmp/sa-test/out' },
    });
    const config = await adapter.getConfig();
    expect(config.outputDir).toBe('/tmp/sa-test/out');
  });

  it('detects environment via detectEnvironment()', () => {
    const env = detectEnvironment();
    expect(['openclaw', 'cli', 'standalone']).toContain(env);
  });
});

// --- OpenClawInfraAdapter Tests (mocked, no real OpenClaw env) ---

describe('OpenClawInfraAdapter', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `claw-oc-adapter-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it('resolves asset from workspace root', async () => {
    const assetPath = join(testDir, 'templates', 'slide.html');
    await mkdir(join(testDir, 'templates'), { recursive: true });
    await writeFile(assetPath, '<div>template</div>');

    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    const resolved = await adapter.resolveAsset('templates/slide.html');
    expect(resolved).toBe(assetPath);
  });

  it('throws for missing asset', async () => {
    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    await expect(adapter.resolveAsset('nope.txt')).rejects.toThrow();
  });

  // Regression: path traversal must be rejected
  it('rejects path traversal attempts (../escape)', async () => {
    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    await expect(adapter.resolveAsset('../../../etc/passwd')).rejects.toThrow(/traversal denied/);
  });

  it('rejects path traversal with nested ../', async () => {
    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    await expect(adapter.resolveAsset('templates/../../secret.txt')).rejects.toThrow(/traversal denied/);
  });

  it('returns fallback config when config file missing', async () => {
    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    const config = await adapter.getConfig();
    expect(config.defaultFormat).toBe('single-html');
    expect(config.templateDir.includes(testDir)).toBe(true);
    expect(config.outputDir.includes(testDir)).toBe(true);
  });

  it('reads config from JSON file when present', async () => {
    const configDir = join(testDir, 'skills', 'claw-design');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, 'config.json'),
      JSON.stringify({
        templateDir: '/custom/templates',
        outputDir: '/custom/output',
        defaultFormat: 'zip',
      })
    );

    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    const config = await adapter.getConfig();
    expect(config.templateDir).toBe('/custom/templates');
    expect(config.outputDir).toBe('/custom/output');
    expect(config.defaultFormat).toBe('zip');
  });

  it('delivers output to workspace output dir', async () => {
    const srcFile = join(testDir, 'pkg.html');
    await writeFile(srcFile, '<html>packaged</html>');

    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir });
    const result = await adapter.deliverOutput({
      path: srcFile,
      format: 'single-html',
      sizeBytes: 20,
    });

    expect(result.success).toBe(true);
    expect(result.location?.includes('output')).toBe(true);
    const content = await readFile(result.location!, 'utf-8');
    expect(content).toBe('<html>packaged</html>');
  });

  it('notifyProgress emits event via EventBus', () => {
    const events: { event: string; payload: unknown }[] = [];
    const bus: EventBus = {
      emit(event, payload) {
        events.push({ event, payload });
      },
    };

    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir, eventBus: bus });
    adapter.notifyProgress('packaging', 75);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('claw-design:progress');
    const payload = events[0].payload as Record<string, unknown>;
    expect(payload.stage).toBe('packaging');
    expect(payload.percent).toBe(75);
    expect(Boolean(payload.timestamp)).toBe(true);
  });

  it('clamps percent to 0-100 range', () => {
    const events: Array<{ percent: number }> = [];
    const bus: EventBus = {
      emit(_, payload) {
        events.push(payload as { percent: number });
      },
    };

    const adapter = new OpenClawInfraAdapter({ workspaceRoot: testDir, eventBus: bus });
    adapter.notifyProgress('routing', -10);
    adapter.notifyProgress('delivering', 150);

    expect(events[0].percent).toBe(0);
    expect(events[1].percent).toBe(100);
  });
});
