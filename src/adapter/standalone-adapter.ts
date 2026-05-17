// StandaloneAdapter — Pure filesystem adapter for CLI/testing
// No host dependencies, operates entirely on local filesystem

import { resolve, join } from 'node:path';
import { access, writeFile, mkdir, copyFile } from 'node:fs/promises';
import type {
  InfraHostAdapter,
  HostConfig,
  ProgressStage,
  OutputPackage,
  HostDeliveryResult,
} from './host-adapter.js';

export interface StandaloneAdapterOptions {
  baseDir?: string;
  outputDir?: string;
  templateDir?: string;
  defaultFormat?: HostConfig['defaultFormat'];
}

export class StandaloneAdapter implements InfraHostAdapter {
  private readonly baseDir: string;
  private readonly outputDir: string;
  private readonly templateDir: string;
  private readonly defaultFormat: HostConfig['defaultFormat'];

  constructor(options: StandaloneAdapterOptions = {}) {
    this.baseDir = options.baseDir ?? process.cwd();
    this.outputDir = options.outputDir ?? join(this.baseDir, 'output');
    this.templateDir = options.templateDir ?? join(this.baseDir, 'templates');
    this.defaultFormat = options.defaultFormat ?? 'single-html';
  }

  async resolveAsset(path: string): Promise<string> {
    const resolved = resolve(this.baseDir, path);
    // Prevent path traversal — resolved must stay within baseDir
    if (!resolved.startsWith(this.baseDir + '/') && resolved !== this.baseDir) {
      throw new Error(`Path traversal denied: "${path}" resolves outside base directory`);
    }
    await access(resolved);
    return resolved;
  }

  async getConfig(): Promise<HostConfig> {
    return {
      templateDir: this.templateDir,
      outputDir: this.outputDir,
      defaultFormat: this.defaultFormat,
    };
  }

  async deliverOutput(pkg: OutputPackage): Promise<HostDeliveryResult> {
    await mkdir(this.outputDir, { recursive: true });
    const filename = pkg.path.split('/').pop() ?? 'output';
    const destPath = join(this.outputDir, filename);

    try {
      await copyFile(pkg.path, destPath);
      return {
        success: true,
        location: destPath,
        message: `Written to ${destPath}`,
      };
    } catch {
      // If source can't be copied, write a placeholder
      await writeFile(destPath, '');
      return {
        success: true,
        location: destPath,
        message: `Created ${destPath} (empty — source unavailable)`,
      };
    }
  }

  notifyProgress(_stage: ProgressStage, _percent: number): void {
    // Standalone mode: no-op (silent)
  }
}
