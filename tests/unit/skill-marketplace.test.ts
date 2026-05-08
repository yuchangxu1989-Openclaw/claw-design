import { describe, it, expect, beforeEach } from 'vitest';
import {
  SkillMarketplace,
  createMarketplace,
} from '../../src/skills/skill-marketplace.js';

describe('SkillMarketplace (FR-F05)', () => {
  let marketplace: SkillMarketplace;

  beforeEach(() => {
    marketplace = createMarketplace();
  });

  describe('search', () => {
    it('returns all listings without filter', () => {
      const result = marketplace.search({});
      expect(result.total).toBeGreaterThan(0);
    });

    it('filters by artifact type', () => {
      const result = marketplace.search({ artifactType: 'slides' });
      for (const listing of result.listings) {
        expect(listing.artifactType).toBe('slides');
      }
    });

    it('filters by category', () => {
      const result = marketplace.search({ category: 'presentation' });
      for (const listing of result.listings) {
        expect(listing.category).toBe('presentation');
      }
    });

    it('filters by quality maturity', () => {
      const result = marketplace.search({ qualityMaturity: 'production' });
      for (const listing of result.listings) {
        expect(listing.qualityMaturity).toBe('production');
      }
    });

    it('paginates results', () => {
      const page1 = marketplace.search({}, 1, 3);
      const page2 = marketplace.search({}, 2, 3);

      expect(page1.listings.length).toBe(3);
      expect(page2.listings.length).toBe(3);
      expect(page1.listings[0].id).not.toBe(page2.listings[0].id);
    });
  });

  describe('getByArtifactType', () => {
    it('returns listings by artifact type', () => {
      const slidesListings = marketplace.getByArtifactType('slides');
      expect(slidesListings.length).toBeGreaterThan(0);
    });
  });

  describe('getByCategory', () => {
    it('returns listings by category', () => {
      const chartListings = marketplace.getByCategory('chart');
      expect(chartListings.length).toBeGreaterThan(0);
    });
  });

  describe('getFeatured/getNewlyUpdated/getTopRated', () => {
    it('returns featured listings', () => {
      const featured = marketplace.getFeatured(3);
      expect(featured.length).toBeLessThanOrEqual(3);
    });

    it('returns newly updated listings', () => {
      const newlyUpdated = marketplace.getNewlyUpdated(3);
      expect(newlyUpdated.length).toBeLessThanOrEqual(3);
    });

    it('returns top rated listings', () => {
      const topRated = marketplace.getTopRated(3);
      expect(topRated.length).toBeLessThanOrEqual(3);
    });
  });

  describe('install/uninstall', () => {
    it('installs a skill', () => {
      const result = marketplace.install('slides-pro');
      expect(result.success).toBe(true);
      expect(marketplace.isInstalled('slides-pro')).toBe(true);
    });

    it('fails to install already installed skill', () => {
      marketplace.install('slides-pro');
      const result = marketplace.install('slides-pro');
      expect(result.success).toBe(false);
    });

    it('fails to install unknown skill', () => {
      const result = marketplace.install('unknown-skill');
      expect(result.success).toBe(false);
    });

    it('uninstalls a skill', () => {
      marketplace.install('slides-pro');
      const result = marketplace.uninstall('slides-pro');
      expect(result.success).toBe(true);
      expect(marketplace.isInstalled('slides-pro')).toBe(false);
    });

    it('fails to uninstall not installed skill', () => {
      const result = marketplace.uninstall('slides-pro');
      expect(result.success).toBe(false);
    });

    it('increments install count', () => {
      const before = marketplace.get('slides-pro')?.installCount ?? 0;
      marketplace.install('slides-pro');
      const after = marketplace.get('slides-pro')?.installCount ?? 0;
      expect(after).toBe(before + 1);
    });
  });

  describe('listInstalled', () => {
    it('lists installed skills', () => {
      marketplace.install('slides-pro');
      marketplace.install('chart-viz');

      const installed = marketplace.listInstalled();
      expect(installed.length).toBe(2);
      expect(installed.find(s => s.id === 'slides-pro')).toBeDefined();
      expect(installed.find(s => s.id === 'chart-viz')).toBeDefined();
    });

    it('returns empty when nothing installed', () => {
      const installed = marketplace.listInstalled();
      expect(installed).toEqual([]);
    });
  });

  describe('getCategories/getQualityMaturities', () => {
    it('returns categories', () => {
      const categories = marketplace.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('presentation');
    });

    it('returns quality maturities', () => {
      const maturities = marketplace.getQualityMaturities();
      expect(maturities.length).toBeGreaterThan(0);
      expect(maturities).toContain('production');
      expect(maturities).toContain('experimental');
    });
  });

  describe('addListing/removeListing', () => {
    it('adds a new listing', () => {
      marketplace.addListing({
        id: 'custom-skill',
        name: 'Custom Skill',
        description: 'A custom skill',
        artifactType: 'slides',
        category: 'presentation',
        tags: ['custom'],
        author: 'TestUser',
        version: '1.0.0',
        qualityMaturity: 'beta',
        installCount: 0,
        lastUpdated: '2026-04-20',
      });

      const listing = marketplace.get('custom-skill');
      expect(listing).toBeDefined();
      expect(listing?.name).toBe('Custom Skill');
    });

    it('removes a listing', () => {
      marketplace.removeListing('slides-pro');
      const listing = marketplace.get('slides-pro');
      expect(listing).toBeUndefined();
    });
  });

  describe('publishToMarketplace', () => {
    it('publishes a new skill', () => {
      const listing = marketplace.publishToMarketplace({
        id: 'new-skill',
        name: 'New Skill',
        description: 'A new published skill',
        artifactType: 'chart',
        category: 'chart',
        tags: ['new'],
        author: 'Publisher',
        version: '1.0.0',
        qualityMaturity: 'experimental',
      });

      expect(listing.id).toBe('new-skill');
      expect(listing.installCount).toBe(0);
      expect(listing.lastUpdated).toBeDefined();
    });
  });
});