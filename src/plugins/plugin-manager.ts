import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type {
  InstalledPlugin,
  PluginDiscoveryResult,
  PluginListing,
  PluginListItem,
  PluginQualityLevel,
  PluginSource,
  PluginSourceKind,
  PluginStatus,
  PluginType,
} from './types.js';
import { PLUGIN_QUALITY_LEVELS, PLUGIN_TYPES } from './types.js';
import { getPluginManifestFilename, parsePluginManifest } from './manifest.js';
import { PluginStateStore } from './state-store.js';
import { PluginRegistryClient } from './registry-client.js';

export interface PluginManagerOptions {
  stateStore?: PluginStateStore;
  localPluginDirs?: string[];
  registryUrls?: string[];
}

export class PluginManager {
  private readonly stateStore: PluginStateStore;
  private readonly localPluginDirs: string[];
  private readonly registryUrls: string[];

  constructor(options: PluginManagerOptions = {}) {
    this.stateStore = options.stateStore ?? new PluginStateStore();
    this.localPluginDirs = options.localPluginDirs ?? [
      resolve(process.cwd(), 'plugins'),
      resolve(process.cwd(), '.claw-design', 'plugins'),
    ];
    this.registryUrls = options.registryUrls ?? [];
  }

  async discover(): Promise<PluginDiscoveryResult> {
    const localListings = await this.discoverLocal();
    const remoteListings = await this.discoverRemote();
    return groupListings([...localListings, ...remoteListings]);
  }

  async install(sourceRef: string): Promise<InstalledPlugin> {
    const listing = await this.resolveListing(sourceRef);
    const installed = await this.stateStore.read();
    const next: InstalledPlugin = {
      manifest: listing.manifest,
      source: listing.source,
      status: 'enabled',
      installedAt: new Date().toISOString(),
    };
    await this.stateStore.write([
      ...installed.filter(plugin => plugin.manifest.name !== listing.manifest.name),
      next,
    ]);
    return next;
  }

  async uninstall(name: string): Promise<boolean> {
    const installed = await this.stateStore.read();
    const next = installed.filter(plugin => plugin.manifest.name !== name);
    await this.stateStore.write(next);
    return next.length !== installed.length;
  }

  async enable(name: string): Promise<boolean> {
    return this.setStatus(name, 'enabled');
  }

  async disable(name: string): Promise<boolean> {
    return this.setStatus(name, 'disabled');
  }

  async list(): Promise<PluginListItem[]> {
    const installed = await this.stateStore.read();
    return installed.map(plugin => ({
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      type: plugin.manifest.type,
      status: plugin.status,
      sourceKind: plugin.source.kind,
      source: plugin.source.reference,
      capabilities: plugin.manifest.capabilities.map(capability => capability.summary),
      quality: plugin.manifest.quality.maturity,
    }));
  }

  async listInstalled(): Promise<InstalledPlugin[]> {
    return this.stateStore.read();
  }

  private async setStatus(name: string, status: PluginStatus): Promise<boolean> {
    const installed = await this.stateStore.read();
    let changed = false;
    const next = installed.map(plugin => {
      if (plugin.manifest.name !== name) return plugin;
      changed = true;
      return { ...plugin, status };
    });
    await this.stateStore.write(next);
    return changed;
  }

  private async resolveListing(sourceRef: string): Promise<PluginListing> {
    if (sourceRef.startsWith('registry:')) {
      const name = sourceRef.slice('registry:'.length);
      const discovered = await this.discover();
      const listing = discovered.listings.find(item => item.manifest.name === name);
      if (!listing) {
        throw new Error(`Plugin not found in registry discovery: ${name}`);
      }
      return listing;
    }

    return this.readLocalPlugin(resolve(sourceRef));
  }

  private async discoverLocal(): Promise<PluginListing[]> {
    const listings: PluginListing[] = [];
    for (const root of this.localPluginDirs) {
      let entries: string[] = [];
      try {
        entries = await readdir(root);
      } catch {
        continue;
      }

      for (const entry of entries) {
        try {
          listings.push(await this.readLocalPlugin(join(root, entry)));
        } catch {
          continue;
        }
      }
    }
    return listings;
  }

  private async discoverRemote(): Promise<PluginListing[]> {
    const listings: PluginListing[] = [];
    for (const url of this.registryUrls) {
      try {
        listings.push(...await new PluginRegistryClient(url).fetchListings());
      } catch {
        continue;
      }
    }
    return listings;
  }

  private async readLocalPlugin(pluginDir: string): Promise<PluginListing> {
    const manifestPath = join(pluginDir, getPluginManifestFilename());
    const raw = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const source: PluginSource = { kind: 'local', reference: pluginDir };
    return {
      manifest: parsePluginManifest({ ...raw, source: raw.source ?? source }, pluginDir),
      source,
    };
  }
}

function groupListings(listings: PluginListing[]): PluginDiscoveryResult {
  const byType = initRecord(PLUGIN_TYPES);
  const byQuality = initRecord(PLUGIN_QUALITY_LEVELS);
  const bySource = initRecord(['local', 'registry'] as const);
  const byScene: Record<string, PluginListing[]> = {};

  for (const listing of listings) {
    byType[listing.manifest.type].push(listing);
    byQuality[listing.manifest.quality.maturity].push(listing);
    bySource[listing.source.kind].push(listing);

    for (const capability of listing.manifest.capabilities) {
      for (const scene of capability.scenes ?? []) {
        byScene[scene] = [...(byScene[scene] ?? []), listing];
      }
    }
  }

  return {
    listings,
    total: listings.length,
    byType,
    byScene,
    byQuality,
    bySource,
  };
}

function initRecord<const T extends readonly string[]>(keys: T): Record<T[number], PluginListing[]> {
  return Object.fromEntries(keys.map(key => [key, [] as PluginListing[]])) as unknown as Record<T[number], PluginListing[]>;
}
