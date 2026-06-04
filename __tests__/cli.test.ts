import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);
const CLI_PATH = join(import.meta.dirname, '..', 'dist', 'cli', 'index.js');

describe('CLI entry point', () => {
  it('prints help with --help', async () => {
    const { stdout } = await execFileAsync('node', [CLI_PATH, '--help']);
    expect(stdout).toContain('claw-design');
    expect(stdout).toContain('generate');
    expect(stdout).toContain('--output');
  });

  it('prints version with --version', async () => {
    const { stdout } = await execFileAsync('node', [CLI_PATH, '--version']);
    expect(stdout).toMatch(/claw-design v\d+\.\d+\.\d+/);
  });

  it('exits with error when no prompt given', async () => {
    try {
      await execFileAsync('node', [CLI_PATH, 'generate']);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain('请提供设计需求描述');
    }
  });
});

describe('CLI generate (e2e)', () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'claw-cli-test-'));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it('returns a clear guidance error when no classifier is available', async () => {
    try {
      await execFileAsync(
        'node',
        [CLI_PATH, 'generate', '帮我做一个关于AI趋势的演示文稿', '-o', outDir],
        { timeout: 30_000 },
      );
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain('无法识别设计意图：当前没有可用的文本 LLM');
      expect(err.stderr || err.stdout).toContain('createPipeline(theme, { classifierProvider })');
      expect(existsSync(join(outDir, 'index.html'))).toBe(false);
    }
  }, 30_000);

  it('returns the same guidance error for shorthand form without classifier', async () => {
    try {
      await execFileAsync(
        'node',
        [CLI_PATH, '流程图', '-o', outDir],
        { timeout: 30_000 },
      );
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain('当前没有可用的文本 LLM');
      expect(err.stderr || err.stdout).toContain('Claw Design 的意图识别只走 LLM 语义理解');
      expect(existsSync(join(outDir, 'index.html'))).toBe(false);
    }
  }, 30_000);
});

describe('CLI plugin commands', () => {
  let pluginHome: string;
  let pluginDir: string;

  beforeEach(async () => {
    pluginHome = await mkdtemp(join(tmpdir(), 'claw-plugin-home-'));
    pluginDir = join(pluginHome, 'starter-assets');
    await mkdir(pluginDir, { recursive: true });
    await writeFile(join(pluginDir, 'claw-design-plugin.json'), JSON.stringify({
      name: 'starter-assets',
      version: '1.0.0',
      type: 'asset',
      capabilities: [{
        id: 'starter-icons',
        summary: 'Icon and template candidates',
        inputFormats: ['json'],
        outputFormats: ['svg', 'html'],
        artifactTypes: ['slides'],
        scenes: ['presentation'],
        scope: 'assets/icons',
      }],
      entry: './plugin.js',
      dependencies: [],
      quality: { maturity: 'stable', notes: 'Reviewed asset metadata' },
    }), 'utf-8');
  });

  afterEach(async () => {
    await rm(pluginHome, { recursive: true, force: true });
  });

  it('lists no plugins by default', async () => {
    const { stdout } = await execFileAsync(
      'node',
      [CLI_PATH, 'plugin', 'list'],
      { env: { ...process.env, CLAW_DESIGN_PLUGIN_HOME: pluginHome } },
    );
    expect(stdout).toContain('No plugins installed.');
  });

  it('installs, lists, and uninstalls a plugin', async () => {
    const env = { ...process.env, CLAW_DESIGN_PLUGIN_HOME: pluginHome };

    const install = await execFileAsync('node', [CLI_PATH, 'plugin', 'install', pluginDir], { env });
    expect(install.stdout).toContain('Installed plugin: starter-assets');

    const list = await execFileAsync('node', [CLI_PATH, 'plugin', 'list'], { env });
    expect(list.stdout).toContain('starter-assets');
    expect(list.stdout).toContain('enabled');

    const uninstall = await execFileAsync('node', [CLI_PATH, 'plugin', 'uninstall', 'starter-assets'], { env });
    expect(uninstall.stdout).toContain('Uninstalled plugin: starter-assets');
  });
});
