import type { ArtifactType } from '../types.js';

export const PLUGIN_TYPES = ['asset', 'transform', 'validator'] as const;
export type PluginType = typeof PLUGIN_TYPES[number];

export const PLUGIN_QUALITY_LEVELS = ['experimental', 'beta', 'stable', 'production'] as const;
export type PluginQualityLevel = typeof PLUGIN_QUALITY_LEVELS[number];

export type PluginSourceKind = 'local' | 'registry';
export type PluginStatus = 'enabled' | 'disabled';

export interface PluginSource {
  kind: PluginSourceKind;
  reference: string;
}

export interface PluginCapability {
  id: string;
  summary: string;
  inputFormats: string[];
  outputFormats: string[];
  artifactTypes: ArtifactType[];
  scenes?: string[];
  scope: string;
}

export interface PluginQualityDeclaration {
  maturity: PluginQualityLevel;
  notes: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  type: PluginType;
  capabilities: PluginCapability[];
  entry: string;
  dependencies: string[];
  quality: PluginQualityDeclaration;
  source?: PluginSource;
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  status: PluginStatus;
  source: PluginSource;
  installedAt: string;
}

export interface PluginListing {
  manifest: PluginManifest;
  source: PluginSource;
}

export interface PluginListItem {
  name: string;
  version: string;
  type: PluginType;
  status: PluginStatus;
  sourceKind: PluginSourceKind;
  source: string;
  capabilities: string[];
  quality: PluginQualityLevel;
}

export interface PluginDiscoveryResult {
  listings: PluginListing[];
  total: number;
  byType: Record<PluginType, PluginListing[]>;
  byScene: Record<string, PluginListing[]>;
  byQuality: Record<PluginQualityLevel, PluginListing[]>;
  bySource: Record<PluginSourceKind, PluginListing[]>;
}

export interface PluginContribution {
  pluginName: string;
  pluginVersion: string;
  type: PluginType;
  capability: PluginCapability;
  source: PluginSource;
}

export interface PluginContributions {
  assetCandidates: PluginContribution[];
  exportAdapterCandidates: PluginContribution[];
  qualityGateCandidates: PluginContribution[];
}

export interface RegistryIndexEntry {
  manifestUrl: string;
  source?: PluginSource;
}

export interface RegistryIndex {
  protocolVersion: 'claw-design-plugin-registry/v1';
  plugins: RegistryIndexEntry[];
}
