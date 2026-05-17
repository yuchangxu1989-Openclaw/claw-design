import type { ArtifactType, DesignSkill, SkillContract, SkillStatus } from '../types.js';
import type { SkillMetadata } from './skill-lifecycle.js';

export interface EcosystemSkillEntry {
  name: string;
  description: string;
  artifactType: ArtifactType;
  supportedTypes: ArtifactType[];
  version: string;
  author: string;
  status: SkillStatus;
  tags: string[];
  capabilities: string[];
  registeredAt: string;
  lastUpdated: string;
}

export interface EcosystemSearchFilter {
  artifactType?: ArtifactType;
  tags?: string[];
  capabilities?: string[];
  status?: SkillStatus;
  author?: string;
  query?: string;
}

export interface EcosystemSearchResult {
  entries: EcosystemSkillEntry[];
  total: number;
}

export interface EcosystemStats {
  totalSkills: number;
  activeSkills: number;
  deprecatedSkills: number;
  byArtifactType: Record<string, number>;
  allTags: string[];
  allCapabilities: string[];
}

export class EcosystemPortal {
  private readonly registry = new Map<string, EcosystemSkillEntry>();

  registerSkill(contract: SkillContract, meta?: { author?: string; tags?: string[]; capabilities?: string[] }): void {
    const entry: EcosystemSkillEntry = {
      name: contract.name,
      description: contract.description,
      artifactType: contract.artifactType,
      supportedTypes: contract.supportedTypes ? [...contract.supportedTypes] : [contract.artifactType],
      version: contract.version ?? '1.0.0',
      author: meta?.author ?? 'unknown',
      status: contract.status ?? 'registered',
      tags: meta?.tags ?? [],
      capabilities: meta?.capabilities ?? [],
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    this.registry.set(contract.name, entry);
  }

  registerDesignSkill(skill: DesignSkill, meta?: { author?: string; tags?: string[]; capabilities?: string[] }): void {
    this.registerSkill(skill.contract, meta);
  }

  unregister(name: string): boolean {
    return this.registry.delete(name);
  }

  get(name: string): EcosystemSkillEntry | undefined {
    return this.registry.get(name);
  }

  list(): EcosystemSkillEntry[] {
    return [...this.registry.values()];
  }

  search(filter: EcosystemSearchFilter): EcosystemSearchResult {
    let results = [...this.registry.values()];

    if (filter.artifactType) {
      results = results.filter(e =>
        e.artifactType === filter.artifactType || e.supportedTypes.includes(filter.artifactType!)
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(e =>
        filter.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (filter.capabilities && filter.capabilities.length > 0) {
      results = results.filter(e =>
        filter.capabilities!.some(cap => e.capabilities.includes(cap))
      );
    }

    if (filter.status) {
      results = results.filter(e => e.status === filter.status);
    }

    if (filter.author) {
      results = results.filter(e => e.author === filter.author);
    }

    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return { entries: results, total: results.length };
  }

  searchByType(artifactType: ArtifactType): EcosystemSkillEntry[] {
    return this.search({ artifactType }).entries;
  }

  searchByTag(tag: string): EcosystemSkillEntry[] {
    return this.search({ tags: [tag] }).entries;
  }

  searchByCapability(capability: string): EcosystemSkillEntry[] {
    return this.search({ capabilities: [capability] }).entries;
  }

  getStats(): EcosystemStats {
    const entries = [...this.registry.values()];
    const byArtifactType: Record<string, number> = {};
    const tagSet = new Set<string>();
    const capSet = new Set<string>();

    for (const entry of entries) {
      byArtifactType[entry.artifactType] = (byArtifactType[entry.artifactType] ?? 0) + 1;
      for (const tag of entry.tags) tagSet.add(tag);
      for (const cap of entry.capabilities) capSet.add(cap);
    }

    return {
      totalSkills: entries.length,
      activeSkills: entries.filter(e => e.status === 'active').length,
      deprecatedSkills: entries.filter(e => e.status === 'deprecated').length,
      byArtifactType,
      allTags: [...tagSet].sort(),
      allCapabilities: [...capSet].sort(),
    };
  }

  updateTags(name: string, tags: string[]): boolean {
    const entry = this.registry.get(name);
    if (!entry) return false;
    entry.tags = [...tags];
    entry.lastUpdated = new Date().toISOString();
    return true;
  }

  updateCapabilities(name: string, capabilities: string[]): boolean {
    const entry = this.registry.get(name);
    if (!entry) return false;
    entry.capabilities = [...capabilities];
    entry.lastUpdated = new Date().toISOString();
    return true;
  }

  exportRegistry(): EcosystemSkillEntry[] {
    return this.list();
  }

  importRegistry(entries: EcosystemSkillEntry[]): void {
    for (const entry of entries) {
      this.registry.set(entry.name, { ...entry });
    }
  }
}

export function createEcosystemPortal(): EcosystemPortal {
  return new EcosystemPortal();
}
