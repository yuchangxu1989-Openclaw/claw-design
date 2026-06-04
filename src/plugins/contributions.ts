import type { PluginContributions, PluginContribution } from './types.js';
import type { PluginManager } from './plugin-manager.js';

export async function loadEnabledPluginContributions(manager: PluginManager): Promise<PluginContributions> {
  const installed = await manager.listInstalled();
  const enabled = installed.filter(plugin => plugin.status === 'enabled');

  const contributions = enabled.flatMap(plugin =>
    plugin.manifest.capabilities.map(capability => ({
      pluginName: plugin.manifest.name,
      pluginVersion: plugin.manifest.version,
      type: plugin.manifest.type,
      capability,
      source: plugin.source,
    } satisfies PluginContribution))
  );

  return {
    assetCandidates: contributions.filter(item => item.type === 'asset'),
    exportAdapterCandidates: contributions.filter(item => item.type === 'transform'),
    qualityGateCandidates: contributions.filter(item => item.type === 'validator'),
  };
}
