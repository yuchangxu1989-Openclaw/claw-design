import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { InstalledPlugin } from './types.js';

interface PluginStateFile {
  version: 1;
  plugins: InstalledPlugin[];
}

export function getDefaultPluginStatePath(): string {
  const base = process.env['CLAW_DESIGN_PLUGIN_HOME'] ?? join(homedir(), '.claw-design');
  return join(base, 'plugins.json');
}

export class PluginStateStore {
  constructor(private readonly statePath = getDefaultPluginStatePath()) {}

  async read(): Promise<InstalledPlugin[]> {
    try {
      const content = await readFile(this.statePath, 'utf-8');
      const parsed = JSON.parse(content) as PluginStateFile;
      return Array.isArray(parsed.plugins) ? parsed.plugins : [];
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  }

  async write(plugins: InstalledPlugin[]): Promise<void> {
    await mkdir(dirname(this.statePath), { recursive: true });
    const state: PluginStateFile = { version: 1, plugins };
    await writeFile(this.statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  }
}

function isNotFound(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as NodeJS.ErrnoException).code === 'ENOENT');
}
