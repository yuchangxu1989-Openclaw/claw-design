import { isAbsolute, normalize, posix } from 'node:path';
import type { PluginManifest, PluginCapability, PluginSource } from './types.js';
import { PLUGIN_QUALITY_LEVELS, PLUGIN_TYPES } from './types.js';

const PLUGIN_MANIFEST_FILE = 'claw-design-plugin.json';

export function getPluginManifestFilename(): string {
  return PLUGIN_MANIFEST_FILE;
}

export function parsePluginManifest(input: unknown, pluginRoot: string): PluginManifest {
  if (!input || typeof input !== 'object') {
    throw new Error('Plugin manifest must be an object');
  }

  const raw = input as Record<string, unknown>;
  const name = expectString(raw.name, 'name');
  const version = expectString(raw.version, 'version');
  const type = expectEnum(raw.type, PLUGIN_TYPES, 'type');
  const entry = expectString(raw.entry, 'entry');
  const dependencies = expectStringArray(raw.dependencies, 'dependencies');
  const qualityRaw = expectObject(raw.quality, 'quality');
  const capabilitiesRaw = expectArray(raw.capabilities, 'capabilities');
  const quality = {
    maturity: expectEnum(qualityRaw.maturity, PLUGIN_QUALITY_LEVELS, 'quality.maturity'),
    notes: expectString(qualityRaw.notes, 'quality.notes'),
  };
  const source = raw.source ? parseSource(raw.source) : undefined;
  const normalizedEntry = validateScopePath(entry, pluginRoot, 'entry');
  const capabilities = capabilitiesRaw.map((capability, index) =>
    parseCapability(capability, pluginRoot, `capabilities[${index}]`)
  );

  return {
    name,
    version,
    type,
    capabilities,
    entry: normalizedEntry,
    dependencies,
    quality,
    source,
  };
}

function parseCapability(input: unknown, pluginRoot: string, label: string): PluginCapability {
  const raw = expectObject(input, label);
  return {
    id: expectString(raw.id, `${label}.id`),
    summary: expectString(raw.summary, `${label}.summary`),
    inputFormats: expectStringArray(raw.inputFormats, `${label}.inputFormats`),
    outputFormats: expectStringArray(raw.outputFormats, `${label}.outputFormats`),
    artifactTypes: expectStringArray(raw.artifactTypes, `${label}.artifactTypes`) as PluginCapability['artifactTypes'],
    scenes: raw.scenes ? expectStringArray(raw.scenes, `${label}.scenes`) : undefined,
    scope: validateScopePath(expectString(raw.scope, `${label}.scope`), pluginRoot, `${label}.scope`),
  };
}

function parseSource(input: unknown): PluginSource {
  const raw = expectObject(input, 'source');
  return {
    kind: expectEnum(raw.kind, ['local', 'registry'] as const, 'source.kind'),
    reference: expectString(raw.reference, 'source.reference'),
  };
}

function validateScopePath(value: string, pluginRoot: string, label: string): string {
  if (isAbsolute(value)) {
    throw new Error(`${label} must stay inside plugin scope`);
  }

  const normalized = normalize(value).replace(/\\/g, '/');
  if (normalized.startsWith('../') || normalized === '..' || normalized.includes('/../')) {
    throw new Error(`${label} must stay inside plugin scope`);
  }

  if (pluginRoot.trim().length === 0) {
    throw new Error('pluginRoot is required');
  }

  return posix.normalize(normalized);
}

function expectObject(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`${label} must be an object`);
  }
  return input as Record<string, unknown>;
}

function expectArray(input: unknown, label: string): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error(`${label} must be an array`);
  }
  return input;
}

function expectString(input: unknown, label: string): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return input.trim();
}

function expectStringArray(input: unknown, label: string): string[] {
  const values = expectArray(input, label);
  return values.map((value, index) => expectString(value, `${label}[${index}]`));
}

function expectEnum<const T extends readonly string[]>(
  input: unknown,
  allowed: T,
  label: string,
): T[number] {
  const value = expectString(input, label);
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of ${allowed.join(', ')}`);
  }
  return value as T[number];
}
