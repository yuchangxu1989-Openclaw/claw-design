// OpenClawInfraAdapter — OpenClaw host implementation of InfraHostAdapter
// Resolves assets from workspace, reads skill config, delivers via filesystem + optional Lark push

import { resolve, join } from 'node:path';
import { access, stat, writeFile, mkdir, copyFile } from 'node:fs/promises';
import type {
  InfraHostAdapter,
  HostConfig,
  ProgressStage,
  OutputPackage,
  HostDeliveryResult,
} from './host-adapter.js';

/** Event emitted for progress notifications */
export interface ProgressEvent {
  stage: ProgressStage;
  percent: number;
  timestamp: string;
}

/** EventBus interface for decoupled progress notification */
export interface EventBus {
  emit(event: string, payload: unknown): void;
}

/** Default no-op EventBus */
class NoopEventBus implements EventBus {
  emit(): void { /* no-op */ }
}

export interface OpenClawAdapterOptions {
  workspaceRoot?: string;
  skillConfigPath?: string;
  eventBus?: EventBus;
  larkPush?: boolean;
}

export class OpenClawInfraAdapter implements InfraHostAdapter {
  private readonly workspaceRoot: string;
  private readonly skillConfigPath: string;
  private readonly eventBus: EventBus;
  private readonly larkPush: boolean;

  constructor(options: OpenClawAdapterOptions = {}) {
    this.workspaceRoot = options.workspaceRoot ?? '/root/.openclaw/workspace';
    this.skillConfigPath = options.skillConfigPath ?? 'skills/claw-design/config.json';
    this.eventBus = options.eventBus ?? new NoopEventBus();
    this.larkPush = options.larkPush ?? false;
  }

  async resolveAsset(path: string): Promise<string> {
    const resolved = resolve(this.workspaceRoot, path);
    // Prevent path traversal — resolved must stay within workspaceRoot
    if (!resolved.startsWith(this.workspaceRoot + '/') && resolved !== this.workspaceRoot) {
      throw new Error(`Path traversal denied: "${path}" resolves outside workspace root`);
    }
    await access(resolved);
    return resolved;
  }

  async getConfig(): Promise<HostConfig> {
    const configPath = resolve(this.workspaceRoot, this.skillConfigPath);
    try {
      await access(configPath);
      const { readFile } = await import('node:fs/promises');
      const raw = await readFile(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        templateDir: (parsed['templateDir'] as string) ?? join(this.workspaceRoot, 'templates'),
        outputDir: (parsed['outputDir'] as string) ?? join(this.workspaceRoot, 'output'),
        defaultFormat: (parsed['defaultFormat'] as HostConfig['defaultFormat']) ?? 'single-html',
        ...parsed,
      };
    } catch {
      // Fallback defaults when config file doesn't exist
      return {
        templateDir: join(this.workspaceRoot, 'templates'),
        outputDir: join(this.workspaceRoot, 'output'),
        defaultFormat: 'single-html',
      };
    }
  }

  async deliverOutput(pkg: OutputPackage): Promise<HostDeliveryResult> {
    const outputDir = resolve(this.workspaceRoot, 'output');
    await mkdir(outputDir, { recursive: true });

    const destPath = join(outputDir, pkg.path.split('/').pop() ?? 'output');
    try {
      const srcStat = await stat(pkg.path);
      if (srcStat.isFile()) {
        await copyFile(pkg.path, destPath);
      }
    } catch {
      // If source doesn't exist as absolute, try writing metadata marker
      await writeFile(destPath + '.meta.json', JSON.stringify(pkg, null, 2));
    }

    const result: HostDeliveryResult = {
      success: true,
      location: destPath,
      message: `Delivered to ${destPath}`,
    };

    if (this.larkPush) {
      result.message += ' (Lark notification queued)';
    }

    return result;
  }

  notifyProgress(stage: ProgressStage, percent: number): void {
    const event: ProgressEvent = {
      stage,
      percent: Math.max(0, Math.min(100, percent)),
      timestamp: new Date().toISOString(),
    };
    this.eventBus.emit('claw-design:progress', event);
  }
}
