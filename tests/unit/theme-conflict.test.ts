import { describe, it, expect, beforeEach } from 'vitest';
import {
  ThemeApplicator,
  ThemeConflictResolver,
} from '../../src/template/theme-conflict.js';
import { ThemeEngine, createThemeEngine } from '../../src/template/theme-engine.js';

describe('ThemeConflictResolver (FR-E05)', () => {
  let engine: ThemeEngine;
  let resolver: ThemeConflictResolver;

  beforeEach(() => {
    engine = createThemeEngine();
    resolver = new ThemeConflictResolver(engine);
  });

  describe('resolveWithSources', () => {
    it('resolves with single source', () => {
      const result = resolver.resolveWithSources({
        id: 'theme-1',
        source: 'theme-pack',
        priority: 40,
        theme: { colorPrimary: '#ff0000' },
      });

      expect(result.resolved).toBe(true);
      expect(result.theme.colorPrimary).toBe('#ff0000');
    });

    it('resolves with multiple sources without conflicts', () => {
      const result = resolver.resolveWithSources(
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { colorPrimary: '#ff0000' },
        },
        {
          id: 'brand-1',
          source: 'brand-kit',
          priority: 80,
          theme: { colorPrimary: '#ff0000' },
        }
      );

      expect(result.resolved).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });

    it('detects conflict with multiple sources', () => {
      const result = resolver.resolveWithSources(
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { colorPrimary: '#ff0000' },
        },
        {
          id: 'brand-1',
          source: 'brand-kit',
          priority: 80,
          theme: { colorPrimary: '#00ff00' },
        }
      );

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].field).toBe('colorPrimary');
      expect(result.conflicts[0].sources.length).toBe(2);
      expect(result.conflicts[0].resolvedValue).toBe('#00ff00');
      expect(result.resolved).toBe(true);
    });

    it('keeps the higher priority value even when a lower priority source is processed later', () => {
      const result = resolver.resolveWithSources(
        {
          id: 'user-1',
          source: 'user-override',
          priority: 100,
          theme: { colorPrimary: '#123456' },
        },
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { colorPrimary: '#abcdef' },
        }
      );

      expect(result.theme.colorPrimary).toBe('#123456');
      expect(result.conflicts[0].resolvedValue).toBe('#123456');
      expect(result.resolved).toBe(true);
    });

    it('prioritizes higher priority source', () => {
      const result = resolver.resolveWithSources(
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { colorPrimary: '#ff0000' },
        },
        {
          id: 'user-1',
          source: 'user_override',
          priority: 100,
          theme: { colorPrimary: '#00ff00' },
        }
      );

      expect(result.theme.colorPrimary).toBe('#00ff00');
      expect(result.resolved).toBe(true);
    });

    it('merges CSS variables', () => {
      const result = resolver.resolveWithSources(
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { cssVariables: { '--custom-1': 'value1' } },
        },
        {
          id: 'brand-1',
          source: 'brand-kit',
          priority: 80,
          theme: { cssVariables: { '--custom-2': 'value2' } },
        }
      );

      expect(result.theme.cssVariables['--custom-1']).toBe('value1');
      expect(result.theme.cssVariables['--custom-2']).toBe('value2');
    });
  });

  describe('detectConflicts', () => {
    it('returns empty array when no conflicts', () => {
      const conflicts = resolver.detectConflicts({
        id: 'theme-1',
        source: 'theme-pack',
        priority: 40,
        theme: { colorPrimary: '#ff0000' },
      });

      expect(conflicts).toEqual([]);
    });

    it('returns conflicts when values differ', () => {
      const conflicts = resolver.detectConflicts(
        {
          id: 'theme-1',
          source: 'theme-pack',
          priority: 40,
          theme: { colorPrimary: '#ff0000' },
        },
        {
          id: 'brand-1',
          source: 'brand-kit',
          priority: 80,
          theme: { colorPrimary: '#00ff00' },
        }
      );

      expect(conflicts.length).toBeGreaterThan(0);
    });
  });
});

describe('ThemeApplicator (FR-E05)', () => {
  let engine: ThemeEngine;
  let applicator: ThemeApplicator;

  beforeEach(() => {
    engine = createThemeEngine();
    applicator = new ThemeApplicator(engine);
  });

  describe('apply', () => {
    it('applies theme pack only', () => {
      const result = applicator.apply({ colorPrimary: '#ff0000' });
      expect(result.theme.colorPrimary).toBe('#ff0000');
    });

    it('applies brand kit with theme pack', () => {
      const result = applicator.apply(
        { colorPrimary: '#ff0000' },
        { colorPrimary: '#00ff00', colorBg: '#ffffff' }
      );

      expect(result.theme.colorPrimary).toBe('#00ff00');
    });

    it('applies task material with brand kit', () => {
      const result = applicator.apply(
        { colorPrimary: '#ff0000' },
        { colorPrimary: '#00ff00' },
        { colorPrimary: '#0000ff' }
      );

      expect(result.theme.colorPrimary).toBe('#0000ff');
    });

    it('applies user override with highest priority', () => {
      const result = applicator.apply(
        { colorPrimary: '#ff0000' },
        { colorPrimary: '#00ff00' },
        { colorPrimary: '#0000ff' },
        { colorPrimary: '#ffff00' }
      );

      expect(result.theme.colorPrimary).toBe('#ffff00');
    });

    it('returns default theme when no sources', () => {
      const result = applicator.apply();
      expect(result.theme.colorPrimary).toBe('#1a73e8');
    });
  });

  describe('getConsistencyReport', () => {
    it('reports accessibility issues', () => {
      const report = applicator.getConsistencyReport({
        colorPrimary: '#ffffff',
        colorBg: '#ffffff',
        fontHeading: 'Arial',
        fontBody: 'Arial',
        spacingUnit: '8px',
        radius: '4px',
        cssVariables: {},
      });

      expect(report.isAccessible).toBe(false);
      expect(report.colorContrastRatio).toBe(1);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('passes accessibility for good contrast', () => {
      const report = applicator.getConsistencyReport({
        colorPrimary: '#1a73e8',
        colorBg: '#ffffff',
        fontHeading: 'Arial',
        fontBody: 'Arial',
        spacingUnit: '8px',
        radius: '4px',
        cssVariables: {},
      });

      expect(report.isAccessible).toBe(true);
      expect(report.colorContrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });
});