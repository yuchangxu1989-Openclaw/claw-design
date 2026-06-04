import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PluginListing, RegistryIndex, RegistryIndexEntry } from './types.js';
import { parsePluginManifest } from './manifest.js';

export class PluginRegistryClient {
  constructor(private readonly registryUrl: string) {}

  async fetchListings(): Promise<PluginListing[]> {
    const index = await this.readIndex(this.registryUrl);
    const listings: PluginListing[] = [];

    for (const entry of index.plugins) {
      const { manifest, root } = await this.readManifest(entry.manifestUrl);
      listings.push({
        manifest: parsePluginManifest({
          ...toRecord(manifest),
          source: entry.source ?? { kind: 'registry', reference: this.registryUrl },
        }, root),
        source: entry.source ?? { kind: 'registry', reference: this.registryUrl },
      });
    }

    return listings;
  }

  private async readIndex(url: string): Promise<RegistryIndex> {
    const raw = JSON.parse(await this.readText(url)) as RegistryIndex;
    if (raw.protocolVersion !== 'claw-design-plugin-registry/v1' || !Array.isArray(raw.plugins)) {
      throw new Error('Unsupported plugin registry protocol');
    }
    return raw;
  }

  private async readManifest(url: string): Promise<{ manifest: unknown; root: string }> {
    if (!url.startsWith('file://')) {
      throw new Error('Only file:// registry manifests are supported in this host');
    }
    const filePath = fileURLToPath(url);
    const root = filePath.slice(0, Math.max(filePath.lastIndexOf('/'), 0));
    const manifest = JSON.parse(await readFile(filePath, 'utf-8'));
    return { manifest, root };
  }

  private async readText(url: string): Promise<string> {
    if (!url.startsWith('file://')) {
      throw new Error('Only file:// registry indexes are supported in this host');
    }
    return readFile(fileURLToPath(url), 'utf-8');
  }
}

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Plugin registry manifest must be an object');
  }
  return input as Record<string, unknown>;
}
