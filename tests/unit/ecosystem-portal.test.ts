import { describe, it, expect, beforeEach } from 'vitest';
import {
  EcosystemPortal,
  createEcosystemPortal,
} from '../../src/skills/ecosystem-portal.js';
import type { SkillContract } from '../../src/types.js';

const mockContract = (name: string, type: 'slides' | 'chart' | 'flowchart' = 'slides'): SkillContract => ({
  name,
  artifactType: type,
  description: `Test skill ${name}`,
  triggerKeywords: [],
  version: '1.0.0',
  status: 'active',
});

describe('EcosystemPortal (FR-F05)', () => {
  let portal: EcosystemPortal;

  beforeEach(() => {
    portal = createEcosystemPortal();
  });

  describe('registerSkill', () => {
    it('registers a skill from contract', () => {
      portal.registerSkill(mockContract('slides-pro'), { author: 'ClawDesign', tags: ['presentation'] });
      const entry = portal.get('slides-pro');
      expect(entry).toBeDefined();
      expect(entry?.name).toBe('slides-pro');
      expect(entry?.author).toBe('ClawDesign');
      expect(entry?.tags).toContain('presentation');
    });

    it('registers with default metadata', () => {
      portal.registerSkill(mockContract('basic-skill'));
      const entry = portal.get('basic-skill');
      expect(entry?.author).toBe('unknown');
      expect(entry?.tags).toEqual([]);
      expect(entry?.capabilities).toEqual([]);
    });

    it('sets registeredAt timestamp', () => {
      portal.registerSkill(mockContract('timed-skill'));
      const entry = portal.get('timed-skill');
      expect(entry?.registeredAt).toBeDefined();
      expect(new Date(entry!.registeredAt).getTime()).not.toBeNaN();
    });

    it('overwrites existing skill on re-register', () => {
      portal.registerSkill(mockContract('skill-a'), { author: 'Author1' });
      portal.registerSkill(mockContract('skill-a'), { author: 'Author2' });
      expect(portal.get('skill-a')?.author).toBe('Author2');
    });
  });

  describe('registerDesignSkill', () => {
    it('registers from a DesignSkill object', () => {
      const skill = {
        contract: mockContract('design-skill'),
        generate: async () => ({ taskId: 't1', type: 'slides' as const, status: 'ready' as const, html: '', pages: 1, metadata: {} }),
      };
      portal.registerDesignSkill(skill, { author: 'Test', tags: ['design'] });
      expect(portal.get('design-skill')).toBeDefined();
    });
  });

  describe('unregister', () => {
    it('removes a registered skill', () => {
      portal.registerSkill(mockContract('to-remove'));
      expect(portal.unregister('to-remove')).toBe(true);
      expect(portal.get('to-remove')).toBeUndefined();
    });

    it('returns false for unknown skill', () => {
      expect(portal.unregister('nonexistent')).toBe(false);
    });
  });

  describe('list', () => {
    it('lists all registered skills', () => {
      portal.registerSkill(mockContract('skill-1'));
      portal.registerSkill(mockContract('skill-2'));
      portal.registerSkill(mockContract('skill-3'));
      expect(portal.list().length).toBe(3);
    });

    it('returns empty array when no skills registered', () => {
      expect(portal.list()).toEqual([]);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      portal.registerSkill(mockContract('slides-pro', 'slides'), { author: 'ClawDesign', tags: ['presentation', 'pro'], capabilities: ['animation'] });
      portal.registerSkill(mockContract('chart-viz', 'chart'), { author: 'ClawDesign', tags: ['data', 'visualization'], capabilities: ['interactive'] });
      portal.registerSkill(mockContract('flow-master', 'flowchart'), { author: 'Community', tags: ['diagram', 'process'], capabilities: ['export'] });
    });

    it('returns all entries without filter', () => {
      const result = portal.search({});
      expect(result.total).toBe(3);
      expect(result.entries.length).toBe(3);
    });

    it('filters by artifactType', () => {
      const result = portal.search({ artifactType: 'slides' });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('slides-pro');
    });

    it('filters by tags', () => {
      const result = portal.search({ tags: ['data'] });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('chart-viz');
    });

    it('filters by capabilities', () => {
      const result = portal.search({ capabilities: ['animation'] });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('slides-pro');
    });

    it('filters by author', () => {
      const result = portal.search({ author: 'Community' });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('flow-master');
    });

    it('filters by status', () => {
      const result = portal.search({ status: 'active' });
      expect(result.total).toBe(3);
    });

    it('filters by text query matching name', () => {
      const result = portal.search({ query: 'chart' });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('chart-viz');
    });

    it('filters by text query matching description', () => {
      const result = portal.search({ query: 'flow-master' });
      expect(result.total).toBe(1);
    });

    it('filters by text query matching tags', () => {
      const result = portal.search({ query: 'process' });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('flow-master');
    });

    it('combines multiple filters', () => {
      const result = portal.search({ author: 'ClawDesign', tags: ['pro'] });
      expect(result.total).toBe(1);
      expect(result.entries[0].name).toBe('slides-pro');
    });

    it('returns empty for no matches', () => {
      const result = portal.search({ artifactType: 'poster' });
      expect(result.total).toBe(0);
      expect(result.entries).toEqual([]);
    });
  });

  describe('searchByType / searchByTag / searchByCapability', () => {
    beforeEach(() => {
      portal.registerSkill(mockContract('s1', 'slides'), { tags: ['pro'], capabilities: ['anim'] });
      portal.registerSkill(mockContract('s2', 'chart'), { tags: ['data'], capabilities: ['anim'] });
    });

    it('searchByType returns matching entries', () => {
      expect(portal.searchByType('slides').length).toBe(1);
    });

    it('searchByTag returns matching entries', () => {
      expect(portal.searchByTag('data').length).toBe(1);
    });

    it('searchByCapability returns matching entries', () => {
      expect(portal.searchByCapability('anim').length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('returns correct stats', () => {
      portal.registerSkill(mockContract('s1', 'slides'), { tags: ['a', 'b'], capabilities: ['x'] });
      portal.registerSkill(mockContract('s2', 'chart'), { tags: ['b', 'c'], capabilities: ['y'] });
      portal.registerSkill({ ...mockContract('s3', 'slides'), status: 'deprecated' });

      const stats = portal.getStats();
      expect(stats.totalSkills).toBe(3);
      expect(stats.activeSkills).toBe(2);
      expect(stats.deprecatedSkills).toBe(1);
      expect(stats.byArtifactType['slides']).toBe(2);
      expect(stats.byArtifactType['chart']).toBe(1);
      expect(stats.allTags).toContain('a');
      expect(stats.allTags).toContain('b');
      expect(stats.allTags).toContain('c');
      expect(stats.allCapabilities).toContain('x');
      expect(stats.allCapabilities).toContain('y');
    });

    it('returns empty stats when no skills', () => {
      const stats = portal.getStats();
      expect(stats.totalSkills).toBe(0);
      expect(stats.allTags).toEqual([]);
    });
  });

  describe('updateTags / updateCapabilities', () => {
    it('updates tags', () => {
      portal.registerSkill(mockContract('s1'), { tags: ['old'] });
      expect(portal.updateTags('s1', ['new', 'updated'])).toBe(true);
      expect(portal.get('s1')?.tags).toEqual(['new', 'updated']);
    });

    it('updates capabilities', () => {
      portal.registerSkill(mockContract('s1'), { capabilities: ['old'] });
      expect(portal.updateCapabilities('s1', ['new-cap'])).toBe(true);
      expect(portal.get('s1')?.capabilities).toEqual(['new-cap']);
    });

    it('returns false for unknown skill', () => {
      expect(portal.updateTags('unknown', ['tag'])).toBe(false);
      expect(portal.updateCapabilities('unknown', ['cap'])).toBe(false);
    });
  });

  describe('exportRegistry / importRegistry', () => {
    it('exports and imports registry', () => {
      portal.registerSkill(mockContract('s1'), { author: 'A', tags: ['t1'] });
      portal.registerSkill(mockContract('s2'), { author: 'B', tags: ['t2'] });

      const exported = portal.exportRegistry();
      expect(exported.length).toBe(2);

      const newPortal = createEcosystemPortal();
      newPortal.importRegistry(exported);
      expect(newPortal.list().length).toBe(2);
      expect(newPortal.get('s1')?.author).toBe('A');
      expect(newPortal.get('s2')?.author).toBe('B');
    });
  });
});
