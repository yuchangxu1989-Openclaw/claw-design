import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  PluginManager,
  PluginRegistryClient,
  PluginStateStore,
  loadEnabledPluginContributions,
  parsePluginManifest,
} from '../../src/plugins/index.js';

describe('Plugin manifest contract (FR-F07 AC1/AC2/AC6)', () => {
  it('accepts asset, transform, and validator manifests with declared capability boundaries', () => {
    const manifest = parsePluginManifest({
      name: 'starter-assets',
      version: '1.0.0',
      type: 'asset',
      capabilities: [
        {
          id: 'starter-icons',
          summary: 'Icon and template candidates',
          inputFormats: ['json'],
          outputFormats: ['svg', 'html'],
          artifactTypes: ['slides'],
          scope: 'assets/icons',
        },
      ],
      entry: './plugin.js',
      dependencies: [],
      quality: { maturity: 'stable', notes: 'Reviewed asset metadata' },
    }, '/plugins/starter-assets');

    expect(manifest.type).toBe('asset');
    expect(manifest.capabilities[0].scope).toBe('assets/icons');
  });

  it('rejects plugins that try to escape their own scope', () => {
    expect(() => parsePluginManifest({
      name: 'unsafe',
      version: '1.0.0',
      type: 'validator',
      capabilities: [{
        id: 'unsafe-rule',
        summary: 'Unsafe validator',
        inputFormats: ['html'],
        outputFormats: ['report'],
        artifactTypes: ['slides'],
        scope: '../core',
      }],
      entry: '/tmp/evil.js',
      dependencies: [],
      quality: { maturity: 'experimental', notes: 'No review' },
    }, '/plugins/unsafe')).toThrow(/scope|entry/i);
  });
});

describe('Plugin discovery, lifecycle, and contribution loading (FR-F07 AC3/AC4/AC5)', () => {
  let rootDir: string;
  let pluginDir: string;
  let stateDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'claw-plugin-test-'));
    pluginDir = join(rootDir, 'plugins', 'starter-assets');
    stateDir = join(rootDir, 'state');
    await mkdir(pluginDir, { recursive: true });
    await writeFile(join(pluginDir, 'claw-design-plugin.json'), JSON.stringify({
      name: 'starter-assets',
      version: '1.0.0',
      type: 'asset',
      source: { kind: 'local', reference: pluginDir },
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
    await rm(rootDir, { recursive: true, force: true });
  });

  it('discovers local plugins and groups results by type, scene, quality, and source', async () => {
    const manager = new PluginManager({
      stateStore: new PluginStateStore(join(stateDir, 'plugins.json')),
      localPluginDirs: [join(rootDir, 'plugins')],
    });

    const discovered = await manager.discover();
    expect(discovered.total).toBe(1);
    expect(discovered.byType.asset[0].manifest.name).toBe('starter-assets');
    expect(discovered.byScene.presentation[0].manifest.name).toBe('starter-assets');
    expect(discovered.byQuality.stable[0].manifest.name).toBe('starter-assets');
    expect(discovered.bySource.local[0].manifest.name).toBe('starter-assets');
  });

  it('installs, disables, enables, uninstalls, and lists plugin status', async () => {
    const manager = new PluginManager({
      stateStore: new PluginStateStore(join(stateDir, 'plugins.json')),
      localPluginDirs: [join(rootDir, 'plugins')],
    });

    await manager.install(pluginDir);
    expect((await manager.list())[0]).toMatchObject({
      name: 'starter-assets',
      status: 'enabled',
      sourceKind: 'local',
    });

    await manager.disable('starter-assets');
    expect((await manager.list())[0].status).toBe('disabled');

    await manager.enable('starter-assets');
    expect((await manager.list())[0].status).toBe('enabled');

    await manager.uninstall('starter-assets');
    expect(await manager.list()).toEqual([]);
  });

  it('loads enabled plugin capabilities into generation candidates only', async () => {
    const manager = new PluginManager({
      stateStore: new PluginStateStore(join(stateDir, 'plugins.json')),
      localPluginDirs: [join(rootDir, 'plugins')],
    });
    await manager.install(pluginDir);

    const contributions = await loadEnabledPluginContributions(manager);
    expect(contributions.assetCandidates).toHaveLength(1);
    expect(contributions.exportAdapterCandidates).toEqual([]);
    expect(contributions.qualityGateCandidates).toEqual([]);
  });

  it('defines remote registry discovery as a manifest index protocol', async () => {
    const registryPath = join(rootDir, 'registry.json');
    await writeFile(registryPath, JSON.stringify({
      protocolVersion: 'claw-design-plugin-registry/v1',
      plugins: [{
        manifestUrl: `file://${join(pluginDir, 'claw-design-plugin.json')}`,
        source: { kind: 'registry', reference: 'file-registry' },
      }],
    }), 'utf-8');

    const client = new PluginRegistryClient(`file://${registryPath}`);
    const listings = await client.fetchListings();

    expect(listings).toHaveLength(1);
    expect(listings[0].manifest.name).toBe('starter-assets');
    expect(listings[0].source.kind).toBe('registry');
  });
});
