import type { ArtifactType, SkillContract, SkillStatus } from '../types.js';

export interface SkillMetadata extends SkillContract {
  registeredAt: string;
  lastUsed?: string;
  usageCount: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface SkillLifecycleEvent {
  skillName: string;
  event: 'registered' | 'enabled' | 'disabled' | 'deprecated' | 'retired' | 'updated';
  timestamp: string;
  details?: string;
}

export interface SkillVersionInfo {
  version: string;
  releasedAt: string;
  changes: string;
  breaking: boolean;
}

export class SkillLifecycleManager {
  private skills = new Map<string, SkillMetadata>();
  private events: SkillLifecycleEvent[] = [];

  register(skill: SkillContract): void {
    const existing = this.skills.get(skill.name);
    const metadata: SkillMetadata = {
      ...skill,
      registeredAt: existing?.registeredAt ?? new Date().toISOString(),
      usageCount: existing?.usageCount ?? 0,
      healthStatus: 'healthy',
      version: skill.version ?? '1.0.0',
      status: skill.status ?? 'active',
    };

    this.skills.set(skill.name, metadata);
    this.emit(skill.name, 'registered');

    if (existing) {
      this.emit(skill.name, 'updated', `Updated from ${existing.version} to ${skill.version}`);
    }
  }

  enable(name: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    if (skill.status === 'retired') {
      console.warn(`Cannot enable retired skill: ${name}`);
      return false;
    }

    skill.status = 'active';
    this.emit(name, 'enabled');
    return true;
  }

  disable(name: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    skill.status = 'registered';
    this.emit(name, 'disabled');
    return true;
  }

  deprecate(name: string, replacement?: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    skill.status = 'deprecated';
    this.emit(name, 'deprecated', replacement ? `Use ${replacement} instead` : 'No replacement specified');
    return true;
  }

  retire(name: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    skill.status = 'retired';
    this.emit(name, 'retired');
    return true;
  }

  updateVersion(name: string, version: string, changes: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    skill.version = version;
    this.emit(name, 'updated', changes);
    return true;
  }

  getStatus(name: string): SkillStatus | undefined {
    return this.skills.get(name)?.status;
  }

  getMetadata(name: string): SkillMetadata | undefined {
    return this.skills.get(name);
  }

  isAvailable(name: string): boolean {
    const skill = this.skills.get(name);
    return skill?.status === 'active' || skill?.status === 'registered';
  }

  canRouteTo(name: string): boolean {
    const skill = this.skills.get(name);
    return skill?.status === 'active' || skill?.status === 'deprecated';
  }

  listActive(): SkillMetadata[] {
    return [...this.skills.values()].filter(s => s.status === 'active');
  }

  listDeprecated(): SkillMetadata[] {
    return [...this.skills.values()].filter(s => s.status === 'deprecated');
  }

  listRetired(): SkillMetadata[] {
    return [...this.skills.values()].filter(s => s.status === 'retired');
  }

  recordUsage(name: string): void {
    const skill = this.skills.get(name);
    if (skill) {
      skill.usageCount++;
      skill.lastUsed = new Date().toISOString();
    }
  }

  getUsageCount(name: string): number {
    return this.skills.get(name)?.usageCount ?? 0;
  }

  getHealthStatus(name: string): SkillMetadata['healthStatus'] {
    return this.skills.get(name)?.healthStatus ?? 'healthy';
  }

  setHealthStatus(name: string, status: SkillMetadata['healthStatus']): void {
    const skill = this.skills.get(name);
    if (skill) {
      skill.healthStatus = status;
    }
  }

  getEvents(skillName?: string): SkillLifecycleEvent[] {
    if (skillName) {
      return this.events.filter(e => e.skillName === skillName);
    }
    return [...this.events];
  }

  getVersionHistory(name: string): SkillVersionInfo[] {
    const events = this.getEvents(name);
    return events
      .filter(e => e.event === 'updated')
      .map(e => ({
        version: this.skills.get(name)?.version ?? '1.0.0',
        releasedAt: e.timestamp,
        changes: e.details ?? '',
        breaking: false,
      }));
  }

  private emit(name: string, event: SkillLifecycleEvent['event'], details?: string): void {
    this.events.push({
      skillName: name,
      event,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  exportState(): Record<string, SkillMetadata> {
    const state: Record<string, SkillMetadata> = {};
    for (const [name, meta] of this.skills) {
      state[name] = { ...meta };
    }
    return state;
  }

  importState(state: Record<string, SkillMetadata>): void {
    for (const [name, meta] of Object.entries(state)) {
      this.skills.set(name, meta);
    }
  }
}

export function createLifecycleManager(): SkillLifecycleManager {
  return new SkillLifecycleManager();
}