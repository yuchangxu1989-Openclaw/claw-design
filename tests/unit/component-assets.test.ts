import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentAssetRegistry,
  createAssetRegistry,
  ComponentAsset,
} from '../../src/templates/component-assets.js';

describe('ComponentAssetRegistry (FR-E04)', () => {
  let registry: ComponentAssetRegistry;

  beforeEach(() => {
    registry = createAssetRegistry();
  });

  describe('get', () => {
    it('returns asset by ID', () => {
      const asset = registry.get('title-hero');
      expect(asset).toBeDefined();
      expect(asset?.name).toBe('Hero Title');
    });

    it('returns undefined for unknown ID', () => {
      const asset = registry.get('unknown-asset');
      expect(asset).toBeUndefined();
    });
  });

  describe('getByCategory', () => {
    it('returns assets by category', () => {
      const titleAssets = registry.getByCategory('title');
      expect(titleAssets.length).toBeGreaterThan(0);
      for (const a of titleAssets) {
        expect(a.category).toBe('title');
      }
    });

    it('returns multiple categories', () => {
      const chartAssets = registry.getByCategory('chart-container');
      const iconAssets = registry.getByCategory('icon');
      expect(chartAssets.length).toBeGreaterThan(0);
      expect(iconAssets.length).toBeGreaterThan(0);
    });
  });

  describe('getByArtifactType', () => {
    it('returns assets by artifact type', () => {
      const slideAssets = registry.getByArtifactType('slides');
      expect(slideAssets.length).toBeGreaterThan(0);
    });

    it('includes cross-type assets', () => {
      const iconAssets = registry.getByArtifactType('prototype');
      expect(iconAssets.length).toBeGreaterThan(0);
    });
  });

  describe('filter', () => {
    it('filters by category', () => {
      const results = registry.filter({ category: 'title' });
      expect(results.length).toBeGreaterThan(0);
      for (const a of results) {
        expect(a.category).toBe('title');
      }
    });

    it('filters by artifact type', () => {
      const results = registry.filter({ artifactType: 'slides' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('filters by tags', () => {
      const results = registry.filter({ tags: ['chart', 'bar'] });
      expect(results.length).toBeGreaterThan(0);
    });

    it('combines multiple filters', () => {
      const results = registry.filter({
        category: 'chart-container',
        artifactType: 'chart',
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('list', () => {
    it('lists all assets', () => {
      const all = registry.list();
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('updateAsset', () => {
    it('updates an existing asset', () => {
      const updated = registry.updateAsset('title-hero', { description: 'Updated description' });
      expect(updated).toBe(true);

      const asset = registry.get('title-hero');
      expect(asset?.description).toBe('Updated description');
    });

    it('returns false for unknown asset', () => {
      const updated = registry.updateAsset('unknown-asset', { description: 'Test' });
      expect(updated).toBe(false);
    });
  });

  describe('listCategories', () => {
    it('lists all unique categories', () => {
      const categories = registry.listCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('title');
      expect(categories).toContain('chart-container');
      expect(categories).toContain('icon');
    });
  });

  describe('asset structure', () => {
    it('has required fields', () => {
      const all = registry.list();
      for (const a of all) {
        expect(a.id).toBeDefined();
        expect(a.name).toBeDefined();
        expect(a.category).toBeDefined();
        expect(a.artifactTypes).toBeDefined();
        expect(a.skeleton).toBeDefined();
      }
    });
  });
});

describe('ComponentAsset categories', () => {
  it('supports title category', () => {
    const asset: ComponentAsset = {
      id: 'test',
      name: 'Test',
      category: 'title',
      artifactTypes: ['slides'],
      skeleton: '<div>Test</div>',
    };
    expect(asset.category).toBe('title');
  });

  it('supports chart-container category', () => {
    const asset: ComponentAsset = {
      id: 'test',
      name: 'Test',
      category: 'chart-container',
      artifactTypes: ['chart'],
      skeleton: '<div>Test</div>',
    };
    expect(asset.category).toBe('chart-container');
  });

  it('supports icon category', () => {
    const asset: ComponentAsset = {
      id: 'test',
      name: 'Test',
      category: 'icon',
      artifactTypes: ['slides', 'landing-page'],
      skeleton: '<svg>Test</svg>',
    };
    expect(asset.category).toBe('icon');
  });

  it('supports decoration category', () => {
    const asset: ComponentAsset = {
      id: 'test',
      name: 'Test',
      category: 'decoration',
      artifactTypes: ['poster'],
      skeleton: '<div>Test</div>',
    };
    expect(asset.category).toBe('decoration');
  });
});