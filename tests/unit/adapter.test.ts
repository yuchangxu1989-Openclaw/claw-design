import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { createInfraAdapter } from '../../src/adapter/adapter-factory.js';
import { StandaloneAdapter } from '../../src/adapter/standalone-adapter.js';
import { OpenClawInfraAdapter } from '../../src/adapter/openclaw-infra-adapter.js';

describe('Adapter factory and standalone adapter', () => {
  it('creates an OpenClaw adapter for the openclaw environment', () => {
    const adapter = createInfraAdapter('openclaw', { openclaw: { workspaceRoot: '/tmp/workspace' } });

    expect(adapter).toBeInstanceOf(OpenClawInfraAdapter);
  });

  it('creates a Standalone adapter for the standalone environment', () => {
    const adapter = createInfraAdapter('standalone', { standalone: { baseDir: '/tmp/base' } });

    expect(adapter).toBeInstanceOf(StandaloneAdapter);
  });

  it('falls back to StandaloneAdapter for an unknown adapter environment', () => {
    const adapter = createInfraAdapter('browser' as never);

    expect(adapter).toBeInstanceOf(StandaloneAdapter);
  });

  it('resolves assets within the configured base directory', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'claw-design-standalone-'));
    const file = join(baseDir, 'asset.txt');
    await writeFile(file, 'ok', 'utf-8');
    const adapter = new StandaloneAdapter({ baseDir });

    await expect(adapter.resolveAsset('asset.txt')).resolves.toBe(file);
  });

  it('blocks path traversal outside the base directory', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'claw-design-standalone-'));
    const adapter = new StandaloneAdapter({ baseDir });

    await expect(adapter.resolveAsset('../escape.txt')).rejects.toThrow('Path traversal denied');
  });

  it('returns default standalone configuration values', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'claw-design-standalone-'));
    const adapter = new StandaloneAdapter({ baseDir });

    await expect(adapter.getConfig()).resolves.toEqual({
      templateDir: join(baseDir, 'templates'),
      outputDir: join(baseDir, 'output'),
      defaultFormat: 'single-html',
    });
  });

  it('copies delivered output into the output directory', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'claw-design-standalone-'));
    const source = join(baseDir, 'result.html');
    await writeFile(source, '<html></html>', 'utf-8');
    const adapter = new StandaloneAdapter({ baseDir });

    const result = await adapter.deliverOutput({ path: source, format: 'html', sizeBytes: 13 });

    expect(result.success).toBe(true);
    expect(result.location).toBe(join(baseDir, 'output', 'result.html'));
  });

  it('creates an empty placeholder when the source output cannot be copied', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'claw-design-standalone-'));
    const adapter = new StandaloneAdapter({ baseDir });

    const result = await adapter.deliverOutput({ path: '/missing/output.html', format: 'html', sizeBytes: 0 });

    expect(result.success).toBe(true);
    expect(result.message).toContain('empty');
  });
});
