import type { ThemePack } from '../types.js';
import type { ThemeDefinition, ThemeValidationError } from './theme-engine.js';
import { ThemeEngine } from './theme-engine.js';

export type ConflictSource = 'theme-pack' | 'brand-kit' | 'task-material' | 'user-override';

export interface ThemeConflict {
  field: string;
  sources: Array<{ source: ConflictSource; value: string }>;
  resolution: string;
  resolvedValue: string;
}

export interface ThemeResolutionResult {
  resolved: boolean;
  theme: ThemePack;
  conflicts: ThemeConflict[];
  warnings: string[];
}

export interface ThemeSource {
  id: string;
  source: ConflictSource;
  priority: number;
  theme: Partial<ThemePack>;
}

const DEFAULT_PRIMARY_COLOR = '#1a73e8'; // Google Blue — neutral default for slides/charts

const DEFAULT_PRIORITY: Record<ConflictSource, number> = {
  'user-override': 100,
  'task-material': 90,
  'brand-kit': 80,
  'theme-pack': 40,
};

export class ThemeConflictResolver {
  private engine: ThemeEngine;

  constructor(engine: ThemeEngine) {
    this.engine = engine;
  }

  resolveWithSources(...sources: ThemeSource[]): ThemeResolutionResult {
    const sorted = [...sources].sort((a, b) => {
      const pa = a.priority ?? DEFAULT_PRIORITY[a.source];
      const pb = b.priority ?? DEFAULT_PRIORITY[b.source];
      return pb - pa;
    });

    const conflicts: ThemeConflict[] = [];
    const warnings: string[] = [];

    const merged: ThemePack = {
      colorPrimary: DEFAULT_PRIMARY_COLOR,
      colorBg: '#ffffff',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Noto Sans SC', sans-serif",
      spacingUnit: '8px',
      radius: '4px',
      cssVariables: {},
    };

    const fieldValues = new Map<string, Array<{ source: ConflictSource; value: string }>>();
    const selectedFieldPriorities = new Map<string, number>();
    const shouldOverrideField = (field: string, priority: number) => {
      const existingPriority = selectedFieldPriorities.get(field);
      if (existingPriority !== undefined && existingPriority >= priority) {
        return false;
      }
      selectedFieldPriorities.set(field, priority);
      return true;
    };

    for (const src of sorted) {
      const t = src.theme;
      const currentPriority = src.priority ?? DEFAULT_PRIORITY[src.source];

      if (t.colorPrimary) {
        const key = 'colorPrimary';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.colorPrimary) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.colorPrimary }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.colorPrimary }]);
        }
      }

      if (t.colorBg) {
        const key = 'colorBg';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.colorBg) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.colorBg }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.colorBg }]);
        }
      }

      if (t.fontHeading) {
        const key = 'fontHeading';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.fontHeading) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.fontHeading }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.fontHeading }]);
        }
      }

      if (t.fontBody) {
        const key = 'fontBody';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.fontBody) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.fontBody }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.fontBody }]);
        }
      }

      if (t.spacingUnit) {
        const key = 'spacingUnit';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.spacingUnit) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.spacingUnit }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.spacingUnit }]);
        }
      }

      if (t.radius) {
        const key = 'radius';
        const existing = fieldValues.get(key);
        if (existing) {
          if (existing[0].value !== t.radius) {
            conflicts.push({
              field: key,
              sources: [...existing, { source: src.source, value: t.radius }],
              resolution: `Using value from ${sorted.find(s => s.source === existing[0].source)?.id}`,
              resolvedValue: existing[0].value,
            });
          }
        } else {
          fieldValues.set(key, [{ source: src.source, value: t.radius }]);
        }
      }

      if (t.cssVariables) {
        for (const [cssKey, cssValue] of Object.entries(t.cssVariables)) {
          const existing = merged.cssVariables[cssKey];
          if (existing && existing !== cssValue) {
            warnings.push(`CSS variable ${cssKey} has conflicting values from different sources`);
          }
          merged.cssVariables[cssKey] = cssValue;
        }
      }

      if (t.colorPrimary && shouldOverrideField('colorPrimary', currentPriority)) {
        merged.colorPrimary = t.colorPrimary;
      }
      if (t.colorBg && shouldOverrideField('colorBg', currentPriority)) {
        merged.colorBg = t.colorBg;
      }
      if (t.fontHeading && shouldOverrideField('fontHeading', currentPriority)) {
        merged.fontHeading = t.fontHeading;
      }
      if (t.fontBody && shouldOverrideField('fontBody', currentPriority)) {
        merged.fontBody = t.fontBody;
      }
      if (t.spacingUnit && shouldOverrideField('spacingUnit', currentPriority)) {
        merged.spacingUnit = t.spacingUnit;
      }
      if (t.radius && shouldOverrideField('radius', currentPriority)) {
        merged.radius = t.radius;
      }
    }

    merged.cssVariables['--cd-color-primary'] = merged.colorPrimary;
    merged.cssVariables['--cd-color-bg'] = merged.colorBg;
    merged.cssVariables['--cd-font-heading'] = merged.fontHeading;
    merged.cssVariables['--cd-font-body'] = merged.fontBody;
    merged.cssVariables['--cd-spacing-unit'] = merged.spacingUnit;
    merged.cssVariables['--cd-radius'] = merged.radius;

    const errors = this.engine.validate(merged);
    if (errors.length > 0) {
      warnings.push(...errors.map(e => `${e.field}: ${e.message}`));
    }

    return {
      resolved: errors.length === 0,
      theme: merged,
      conflicts,
      warnings,
    };
  }

  detectConflicts(...sources: ThemeSource[]): ThemeConflict[] {
    const result = this.resolveWithSources(...sources);
    return result.conflicts;
  }
}

export class ThemeApplicator {
  private engine: ThemeEngine;
  private resolver: ThemeConflictResolver;

  constructor(engine: ThemeEngine) {
    this.engine = engine;
    this.resolver = new ThemeConflictResolver(engine);
  }

  apply(
    themePack?: Partial<ThemePack>,
    brandKit?: Partial<ThemePack>,
    taskMaterial?: Partial<ThemePack>,
    userOverride?: Partial<ThemePack>
  ): ThemeResolutionResult {
    const sources: ThemeSource[] = [];

    if (themePack) {
      sources.push({
        id: 'theme-pack',
        source: 'theme-pack',
        priority: DEFAULT_PRIORITY['theme-pack'],
        theme: themePack,
      });
    }

    if (brandKit) {
      sources.push({
        id: 'brand-kit',
        source: 'brand-kit',
        priority: DEFAULT_PRIORITY['brand-kit'],
        theme: brandKit,
      });
    }

    if (taskMaterial) {
      sources.push({
        id: 'task-material',
        source: 'task-material',
        priority: DEFAULT_PRIORITY['task-material'],
        theme: taskMaterial,
      });
    }

    if (userOverride) {
      sources.push({
        id: 'user-override',
        source: 'user-override',
        priority: DEFAULT_PRIORITY['user-override'],
        theme: userOverride,
      });
    }

    if (sources.length === 0) {
      return {
        resolved: true,
        theme: this.engine.resolve('default'),
        conflicts: [],
        warnings: [],
      };
    }

    return this.resolver.resolveWithSources(...sources);
  }

  getConsistencyReport(theme: ThemePack): {
    colorContrastRatio: number;
    isAccessible: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let contrastRatio = 0;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : null;
    };

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const bgRgb = hexToRgb(theme.colorBg);
    const fgRgb = hexToRgb(theme.colorPrimary);

    if (bgRgb && fgRgb) {
      const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const lighter = Math.max(bgLum, fgLum);
      const darker = Math.min(bgLum, fgLum);
      contrastRatio = (lighter + 0.05) / (darker + 0.05);
    }

    if (contrastRatio < 4.5) {
      issues.push(`Color contrast ratio ${contrastRatio.toFixed(2)} is below WCAG AA requirement (4.5:1)`);
    }

    return {
      colorContrastRatio: Math.round(contrastRatio * 100) / 100,
      isAccessible: contrastRatio >= 4.5,
      issues,
    };
  }
}
