import { describe, expect, it, beforeEach } from 'vitest';
import { BrandPackageRegistry } from '../../src/design-system/brand-registry.js';
import { BrandInjector } from '../../src/design-system/injector.js';
import { PackageValidator } from '../../src/design-system/package-validator.js';
import { ActivePackageManager } from '../../src/design-system/active-package.js';
import { DARK_SCI_FI_PACKAGE } from '../../src/design-system/packages/dark-sci-fi/index.js';
import type { DesignSystemPackage } from '../../src/design-system/types.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PACKAGES_DIR = join(__dirname, '../../src/design-system/packages');

const minimalPackage: DesignSystemPackage = {
  id: 'test-minimal',
  name: 'Test Minimal',
  version: '1.0.0',
  description: 'A minimal test package for fintech saas',
  tokens: {
    colors: { primary: '#3b82f6', bg: '#ffffff', text: '#1f2937' },
    spacing: { unit: '4px', values: { sm: '4px', md: '8px', lg: '16px' } },
    typography: {
      fontFamily: { heading: 'Inter', body: 'Inter' },
      sizes: { sm: '12px', md: '14px', lg: '18px' },
      weights: { normal: '400', bold: '700' },
      lineHeights: { normal: '1.5' },
    },
    radius: { sm: '4px', md: '8px', lg: '12px' },
    shadows: { card: '0 1px 3px rgba(0,0,0,.1)' },
    opacity: { light: '0.1' },
  },
  components: [
    { name: 'card', selector: 'card', properties: { border: '1px solid var(--line)' } },
    { name: 'button', selector: 'btn', properties: { background: 'var(--primary)' } },
  ],
  reference: { html: '<div>ref</div>' },
  constraints: { enforce: [], forbid: [] },
};

// ─── BrandPackageRegistry Tests (FR-H03) ────────────────────────────────────

describe('BrandPackageRegistry (FR-H03)', () => {
  let registry: BrandPackageRegistry;

  beforeEach(() => {
    registry = new BrandPackageRegistry(PACKAGES_DIR);
  });

  it('AC6: register and listAll', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    const all = registry.listAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('dark-sci-fi');
  });

  it('AC5: rejects duplicate package IDs', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    expect(() => registry.register(DARK_SCI_FI_PACKAGE)).toThrow(/Duplicate/);
  });

  it('AC6: findByName — exact match by id', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    const found = registry.findByName('dark-sci-fi');
    expect(found).toBe(DARK_SCI_FI_PACKAGE);
  });

  it('AC6: findByName — case-insensitive name match', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    const found = registry.findByName('Dark Sci-Fi');
    expect(found).toBe(DARK_SCI_FI_PACKAGE);
  });

  it('AC6: findByName — returns undefined for unknown', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    expect(registry.findByName('nonexistent')).toBeUndefined();
  });

  it('AC6: findByTag', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    registry.register(minimalPackage);
    const darkPkgs = registry.findByTag('dark');
    expect(darkPkgs.some(m => m.id === 'dark-sci-fi')).toBe(true);
  });

  it('AC6: search by keyword', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    registry.register(minimalPackage);
    const results = registry.search('fintech');
    expect(results.some(m => m.id === 'test-minimal')).toBe(true);
  });

  it('AC3: metadata includes colorPreview', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    const meta = registry.listAll()[0];
    expect(meta.colorPreview.length).toBeLessThanOrEqual(5);
    expect(meta.colorPreview.length).toBeGreaterThan(0);
  });

  it('listPackages returns IDs', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    registry.register(minimalPackage);
    const ids = registry.listPackages();
    expect(ids).toContain('dark-sci-fi');
    expect(ids).toContain('test-minimal');
  });

  it('getPackage returns full package', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    expect(registry.getPackage('dark-sci-fi')).toBe(DARK_SCI_FI_PACKAGE);
  });

  it('has() checks existence', () => {
    registry.register(DARK_SCI_FI_PACKAGE);
    expect(registry.has('dark-sci-fi')).toBe(true);
    expect(registry.has('nope')).toBe(false);
  });
});

// ─── BrandInjector Tests (FR-H04) ──────────────────────────────────────────

describe('BrandInjector (FR-H04)', () => {
  let registry: BrandPackageRegistry;
  let injector: BrandInjector;

  beforeEach(() => {
    registry = new BrandPackageRegistry(PACKAGES_DIR);
    registry.register(DARK_SCI_FI_PACKAGE);
    injector = new BrandInjector(registry, PACKAGES_DIR);
  });

  it('AC2+AC3: injectDesignSystem returns promptContext and constraints', async () => {
    const result = await injector.injectDesignSystem('dark-sci-fi');
    expect(result.promptContext).toBeTruthy();
    expect(result.promptContext.length).toBeGreaterThan(100);
    expect(result.constraints).toBe(DARK_SCI_FI_PACKAGE);
  });

  it('AC1: throws with available list when brand not found', async () => {
    await expect(injector.injectDesignSystem('nonexistent'))
      .rejects.toThrow(/not found.*Available/);
  });

  it('AC5: injectDefault uses dark-sci-fi', async () => {
    const result = await injector.injectDefault();
    expect(result.constraints.id).toBe('dark-sci-fi');
  });

  it('listAvailableBrands returns registered IDs', () => {
    const brands = injector.listAvailableBrands();
    expect(brands).toContain('dark-sci-fi');
  });

  it('clearCache resets internal cache', async () => {
    await injector.injectDesignSystem('dark-sci-fi');
    injector.clearCache();
    // Should still work after cache clear
    const result = await injector.injectDesignSystem('dark-sci-fi');
    expect(result.promptContext).toBeTruthy();
  });
});

// ─── PackageValidator Tests (FR-H07) ───────────────────────────────────────

describe('PackageValidator (FR-H07)', () => {
  const validator = new PackageValidator();

  it('AC1: validates a valid package directory', async () => {
    const result = await validator.validatePackage(join(PACKAGES_DIR, 'dark-sci-fi'));
    expect(result.valid).toBe(true);
    expect(result.level).not.toBe('block');
  });

  it('AC1: blocks when directory does not exist', async () => {
    const result = await validator.validatePackage('/tmp/nonexistent-pkg');
    expect(result.valid).toBe(false);
    expect(result.level).toBe('block');
    expect(result.errors.some(e => e.code === 'DIR_NOT_FOUND')).toBe(true);
  });

  it('validateLoadedPackage passes for complete package', () => {
    const result = validator.validateLoadedPackage(DARK_SCI_FI_PACKAGE);
    expect(result.valid).toBe(true);
  });

  it('validateLoadedPackage blocks for empty colors', () => {
    const broken: DesignSystemPackage = {
      ...minimalPackage,
      id: 'broken',
      tokens: { ...minimalPackage.tokens, colors: {} },
    };
    const result = validator.validateLoadedPackage(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_COLORS')).toBe(true);
  });

  it('validateLoadedPackage blocks for missing typography sizes', () => {
    const broken: DesignSystemPackage = {
      ...minimalPackage,
      id: 'broken2',
      tokens: {
        ...minimalPackage.tokens,
        typography: { ...minimalPackage.tokens.typography, sizes: {} },
      },
    };
    const result = validator.validateLoadedPackage(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_TYPOGRAPHY_SIZES')).toBe(true);
  });

  it('validateLoadedPackage warns for no components', () => {
    const noComp: DesignSystemPackage = {
      ...minimalPackage,
      id: 'no-comp',
      components: [],
    };
    const result = validator.validateLoadedPackage(noComp);
    expect(result.valid).toBe(true); // warnings don't block
    expect(result.level).toBe('warn');
    expect(result.warnings.some(w => w.code === 'NO_COMPONENTS')).toBe(true);
  });
});

// ─── ActivePackageManager Tests (FR-H08) ───────────────────────────────────

describe('ActivePackageManager (FR-H08)', () => {
  it('defaults to DARK_SCI_FI_PACKAGE', () => {
    const mgr = new ActivePackageManager();
    expect(mgr.getActive().id).toBe('dark-sci-fi');
    expect(mgr.getActiveId()).toBe('dark-sci-fi');
  });

  it('setActive switches the active package', () => {
    const mgr = new ActivePackageManager();
    mgr.setActive(minimalPackage);
    expect(mgr.getActive()).toBe(minimalPackage);
    expect(mgr.getActiveId()).toBe('test-minimal');
  });

  it('reset returns to default', () => {
    const mgr = new ActivePackageManager();
    mgr.setActive(minimalPackage);
    mgr.reset();
    expect(mgr.getActiveId()).toBe('dark-sci-fi');
  });

  it('accepts custom default in constructor', () => {
    const mgr = new ActivePackageManager(minimalPackage);
    expect(mgr.getActiveId()).toBe('test-minimal');
  });
});