import { describe, it, expect, beforeEach } from 'vitest';
import {
  SkillLifecycleManager,
  createLifecycleManager,
} from '../../src/skills/skill-lifecycle.js';
import type { SkillContract } from '../../src/types.js';

const mockSkill = (name: string, version = '1.0.0'): SkillContract => ({
  name,
  artifactType: 'slides',
  description: `Test skill ${name}`,
  triggerKeywords: [],
  version,
  status: 'active',
});

describe('SkillLifecycleManager (FR-F03)', () => {
  let manager: SkillLifecycleManager;

  beforeEach(() => {
    manager = createLifecycleManager();
  });

  describe('register', () => {
    it('registers a new skill', () => {
      manager.register(mockSkill('test-skill'));
      expect(manager.isAvailable('test-skill')).toBe(true);
    });

    it('updates existing skill', () => {
      manager.register(mockSkill('test-skill', '1.0.0'));
      manager.register(mockSkill('test-skill', '2.0.0'));

      const meta = manager.getMetadata('test-skill');
      expect(meta?.version).toBe('2.0.0');
    });
  });

  describe('enable/disable', () => {
    it('enables a skill', () => {
      manager.register(mockSkill('test-skill'));
      const disabled = manager.disable('test-skill');
      expect(disabled).toBe(true);
      expect(manager.canRouteTo('test-skill')).toBe(false);

      const enabled = manager.enable('test-skill');
      expect(enabled).toBe(true);
      expect(manager.canRouteTo('test-skill')).toBe(true);
    });

    it('cannot enable retired skill', () => {
      manager.register(mockSkill('test-skill'));
      manager.retire('test-skill');

      const enabled = manager.enable('test-skill');
      expect(enabled).toBe(false);
    });
  });

  describe('deprecate/retire', () => {
    it('deprecates a skill', () => {
      manager.register(mockSkill('test-skill'));
      const deprecated = manager.deprecate('test-skill', 'new-skill');

      expect(deprecated).toBe(true);
      expect(manager.getStatus('test-skill')).toBe('deprecated');
      expect(manager.canRouteTo('test-skill')).toBe(true);
    });

    it('retires a skill', () => {
      manager.register(mockSkill('test-skill'));
      manager.retire('test-skill');

      expect(manager.getStatus('test-skill')).toBe('retired');
      expect(manager.canRouteTo('test-skill')).toBe(false);
    });
  });

  describe('updateVersion', () => {
    it('updates skill version', () => {
      manager.register(mockSkill('test-skill', '1.0.0'));
      const updated = manager.updateVersion('test-skill', '1.1.0', 'Bug fixes');

      expect(updated).toBe(true);
      expect(manager.getMetadata('test-skill')?.version).toBe('1.1.0');
    });

    it('fails for unknown skill', () => {
      const updated = manager.updateVersion('unknown', '1.1.0', 'Test');
      expect(updated).toBe(false);
    });
  });

  describe('recordUsage', () => {
    it('records usage count', () => {
      manager.register(mockSkill('test-skill'));
      manager.recordUsage('test-skill');
      manager.recordUsage('test-skill');

      expect(manager.getUsageCount('test-skill')).toBe(2);
    });

    it('returns 0 for unknown skill', () => {
      expect(manager.getUsageCount('unknown')).toBe(0);
    });
  });

  describe('listActive/listDeprecated/listRetired', () => {
    it('lists active skills', () => {
      manager.register(mockSkill('active-skill'));
      manager.register(mockSkill('deprecated-skill'));
      manager.deprecate('deprecated-skill');

      const active = manager.listActive();
      expect(active.find(s => s.name === 'active-skill')).toBeDefined();
      expect(active.find(s => s.name === 'deprecated-skill')).toBeUndefined();
    });

    it('lists deprecated skills', () => {
      manager.register(mockSkill('deprecated-skill'));
      manager.deprecate('deprecated-skill');

      const deprecated = manager.listDeprecated();
      expect(deprecated.find(s => s.name === 'deprecated-skill')).toBeDefined();
    });

    it('lists retired skills', () => {
      manager.register(mockSkill('retired-skill'));
      manager.retire('retired-skill');

      const retired = manager.listRetired();
      expect(retired.find(s => s.name === 'retired-skill')).toBeDefined();
    });
  });

  describe('getEvents', () => {
    it('tracks lifecycle events', () => {
      manager.register(mockSkill('test-skill'));
      manager.enable('test-skill');
      manager.disable('test-skill');

      const events = manager.getEvents('test-skill');
      expect(events.length).toBe(3);
      expect(events[0].event).toBe('registered');
      expect(events[1].event).toBe('enabled');
      expect(events[2].event).toBe('disabled');
    });
  });

  describe('exportState/importState', () => {
    it('exports and imports state', () => {
      manager.register(mockSkill('skill-1'));
      manager.register(mockSkill('skill-2'));

      const state = manager.exportState();
      expect(state['skill-1']).toBeDefined();
      expect(state['skill-2']).toBeDefined();

      const newManager = createLifecycleManager();
      newManager.importState(state);

      expect(newManager.isAvailable('skill-1')).toBe(true);
      expect(newManager.isAvailable('skill-2')).toBe(true);
    });
  });
});