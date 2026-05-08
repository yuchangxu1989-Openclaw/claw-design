import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
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

  it('generates HTML artifact from prompt', async () => {
    const { stdout } = await execFileAsync(
      'node',
      [CLI_PATH, 'generate', '帮我做一个关于AI趋势的演示文稿', '-o', outDir],
      { timeout: 30_000 },
    );
    expect(stdout).toContain('生成完成');
    expect(stdout).toContain('index.html');
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
  }, 30_000);

  it('generates artifact with shorthand form (no generate command)', async () => {
    const { stdout } = await execFileAsync(
      'node',
      [CLI_PATH, '流程图', '-o', outDir],
      { timeout: 30_000 },
    );
    expect(stdout).toContain('生成完成');
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
  }, 30_000);
});
