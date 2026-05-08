import { describe, it, expect, beforeEach } from 'vitest';
import {
  TemplateVariantRegistry,
  createVariantRegistry,
  TemplateVariant,
} from '../../src/templates/template-variants.js';
import type { ArtifactType } from '../../src/types.js';

describe('TemplateVariantRegistry (FR-E03)', () => {
  let registry: TemplateVariantRegistry;

  beforeEach(() => {
    registry = createVariantRegistry();
  });

  describe('getVariants', () => {
    it('returns variants for a template ID', () => {
      const variants = registry.getVariants('presentation-basic');
      expect(variants.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown template', () => {
      const variants = registry.getVariants('unknown-template');
      expect(variants).toEqual([]);
    });
  });

  describe('getByArtifactType', () => {
    it('returns variants filtered by artifact type', () => {
      const slidesVariants = registry.getByArtifactType('slides');
      expect(slidesVariants.length).toBeGreaterThan(0);
      for (const v of slidesVariants) {
        expect(v.artifactType).toBe('slides');
      }
    });
  });

  describe('filter', () => {
    it('filters by variant type', () => {
      const styleVariants = registry.filter('presentation-basic', {
        variantType: 'style',
      });
      expect(styleVariants.length).toBeGreaterThan(0);
      for (const v of styleVariants) {
        expect(v.variantType).toBe('style');
      }
    });

    it('filters by tags', () => {
      const businessVariants = registry.filter('presentation-basic', {
        tags: ['business'],
      });
      expect(businessVariants.length).toBeGreaterThan(0);
    });
  });

  describe('selectVariant', () => {
    it('selects a random variant when no preferences', () => {
      const selected = registry.selectVariant('presentation-basic', 'slides');
      expect(selected).not.toBeNull();
      if (selected) {
        expect(selected.artifactType).toBe('slides');
      }
    });

    it('returns null when no variants match', () => {
      const selected = registry.selectVariant('unknown-template', 'slides');
      expect(selected).toBeNull();
    });
  });

  describe('list', () => {
    it('lists all variants', () => {
      const all = registry.list();
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('variant structure', () => {
    it('has required fields', () => {
      const all = registry.list();
      for (const v of all) {
        expect(v.id).toBeDefined();
        expect(v.templateId).toBeDefined();
        expect(v.name).toBeDefined();
        expect(v.artifactType).toBeDefined();
        expect(v.variantType).toBeDefined();
        expect(v.skeleton).toBeDefined();
      }
    });
  });
});

describe('TemplateVariant types', () => {
  it('supports style variant type', () => {
    const variant: TemplateVariant = {
      id: 'test-variant',
      templateId: 'test-template',
      name: 'Test Variant',
      artifactType: 'slides' as ArtifactType,
      variantType: 'style',
      tags: ['test'],
      skeleton: '<div>Test</div>',
    };
    expect(variant.variantType).toBe('style');
  });

  it('supports layout variant type', () => {
    const variant: TemplateVariant = {
      id: 'test-variant',
      templateId: 'test-template',
      name: 'Test Variant',
      artifactType: 'arch-diagram' as ArtifactType,
      variantType: 'layout',
      tags: ['test'],
      skeleton: '<div>Test</div>',
    };
    expect(variant.variantType).toBe('layout');
  });

  it('supports theme variant type', () => {
    const variant: TemplateVariant = {
      id: 'test-variant',
      templateId: 'test-template',
      name: 'Test Variant',
      artifactType: 'chart' as ArtifactType,
      variantType: 'theme',
      tags: ['test'],
      skeleton: '<div>Test</div>',
    };
    expect(variant.variantType).toBe('theme');
  });
});