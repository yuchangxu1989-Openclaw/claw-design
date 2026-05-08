// ThemeEngine — TD-04: complete theme management (FR-E03/E04/E05)
// Supports: registration, discovery, inheritance, variable validation.
// Backward compatible: existing ThemePack + CSS custom property injection still works.

import type { ThemePack } from '../types.js';

/** Theme definition with optional parent for inheritance */
export interface ThemeDefinition {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  tags?: string[];
  theme: Partial<ThemePack>;
}

/** Validation error for theme variables */
export interface ThemeValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS: (keyof ThemePack)[] = [
  'colorPrimary', 'colorBg', 'fontHeading', 'fontBody', 'spacingUnit', 'radius',
];

const DEFAULT_PRIMARY_COLOR = '#1a73e8'; // Google Blue — neutral default for slides/charts

const COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$|^rgb/;
const SIZE_PATTERN = /^\d+(\.\d+)?(px|rem|em|%)$/;

export class ThemeEngine {
  private themes = new Map<string, ThemeDefinition>();

  register(def: ThemeDefinition): void {
    this.themes.set(def.id, def);
  }

  registerAll(defs: ThemeDefinition[]): void {
    for (const d of defs) this.register(d);
  }

  unregister(id: string): boolean {
    return this.themes.delete(id);
  }

  list(tags?: string[]): ThemeDefinition[] {
    const all = [...this.themes.values()];
    if (!tags || tags.length === 0) return all;
    return all.filter(t => tags.some(tag => t.tags?.includes(tag)));
  }

  get(id: string): ThemeDefinition | undefined {
    return this.themes.get(id);
  }

  resolve(id: string): ThemePack {
    const chain = this.resolveChain(id);
    const merged: ThemePack = {
      colorPrimary: DEFAULT_PRIMARY_COLOR,
      colorBg: '#ffffff',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Noto Sans SC', sans-serif",
      spacingUnit: '8px',
      radius: '4px',
      cssVariables: {},
    };

    for (const def of chain) {
      const t = def.theme;
      if (t.colorPrimary) merged.colorPrimary = t.colorPrimary;
      if (t.colorBg) merged.colorBg = t.colorBg;
      if (t.fontHeading) merged.fontHeading = t.fontHeading;
      if (t.fontBody) merged.fontBody = t.fontBody;
      if (t.spacingUnit) merged.spacingUnit = t.spacingUnit;
      if (t.radius) merged.radius = t.radius;
      if (t.cssVariables) Object.assign(merged.cssVariables, t.cssVariables);
    }

    merged.cssVariables['--cd-color-primary'] = merged.colorPrimary;
    merged.cssVariables['--cd-color-bg'] = merged.colorBg;
    merged.cssVariables['--cd-font-heading'] = merged.fontHeading;
    merged.cssVariables['--cd-font-body'] = merged.fontBody;
    merged.cssVariables['--cd-spacing-unit'] = merged.spacingUnit;
    merged.cssVariables['--cd-radius'] = merged.radius;

    return merged;
  }

  validate(theme: ThemePack): ThemeValidationError[] {
    const errors: ThemeValidationError[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (!theme[field]) errors.push({ field, message: `Missing required field: ${field}` });
    }
    if (theme.colorPrimary && !COLOR_PATTERN.test(theme.colorPrimary)) {
      errors.push({ field: 'colorPrimary', message: `Invalid color format: ${theme.colorPrimary}` });
    }
    if (theme.colorBg && !COLOR_PATTERN.test(theme.colorBg)) {
      errors.push({ field: 'colorBg', message: `Invalid color format: ${theme.colorBg}` });
    }
    if (theme.spacingUnit && !SIZE_PATTERN.test(theme.spacingUnit)) {
      errors.push({ field: 'spacingUnit', message: `Invalid size format: ${theme.spacingUnit}` });
    }
    if (theme.radius && !SIZE_PATTERN.test(theme.radius)) {
      errors.push({ field: 'radius', message: `Invalid size format: ${theme.radius}` });
    }
    for (const key of Object.keys(theme.cssVariables)) {
      if (!key.startsWith('--cd-')) {
        errors.push({ field: `cssVariables.${key}`, message: `CSS variable must use --cd- prefix: ${key}` });
      }
    }
    return errors;
  }

  resolveAndValidate(id: string): { theme: ThemePack; errors: ThemeValidationError[] } {
    const theme = this.resolve(id);
    return { theme, errors: this.validate(theme) };
  }

  toCssBlock(theme: ThemePack): string {
    const lines = Object.entries(theme.cssVariables).map(([k, v]) => `  ${k}: ${v};`);
    return `:root {\n${lines.join('\n')}\n}`;
  }

  private resolveChain(id: string): ThemeDefinition[] {
    const chain: ThemeDefinition[] = [];
    const visited = new Set<string>();
    let current = id;
    while (current) {
      if (visited.has(current)) {
        throw new Error(`Circular theme inheritance: ${[...visited, current].join(' → ')}`);
      }
      visited.add(current);
      const def = this.themes.get(current);
      if (!def) {
        if (chain.length === 0) throw new Error(`Theme not found: ${current}`);
        break;
      }
      chain.unshift(def);
      current = def.parent ?? '';
    }
    return chain;
  }
}

// ── Built-in themes ──

export const BUILT_IN_THEMES: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean business theme',
    tags: ['light', 'business'],
    theme: {
      colorPrimary: DEFAULT_PRIMARY_COLOR,
      colorBg: '#ffffff',
      fontHeading: "'Inter', 'Noto Sans SC', sans-serif",
      fontBody: "'Noto Sans SC', 'Inter', sans-serif",
      spacingUnit: '8px',
      radius: '4px',
      cssVariables: {},
    },
  },
  {
    id: 'dark',
    name: 'Dark Tech',
    description: 'Dark theme for technical content',
    tags: ['dark', 'tech'],
    theme: {
      colorPrimary: '#4fc3f7',
      colorBg: '#1e1e2e',
      fontHeading: "'JetBrains Mono', 'Noto Sans SC', monospace",
      fontBody: "'Noto Sans SC', 'Inter', sans-serif",
      spacingUnit: '8px',
      radius: '6px',
      cssVariables: {},
    },
  },
  {
    id: 'academic',
    name: 'Academic Fresh',
    description: 'Clean academic style',
    tags: ['light', 'academic'],
    parent: 'default',
    theme: {
      colorPrimary: '#2e7d32',
      fontHeading: "'Georgia', 'Noto Serif SC', serif",
      fontBody: "'Noto Sans SC', 'Georgia', serif",
      radius: '2px',
      cssVariables: {},
    },
  },
  {
    id: 'creative',
    name: 'Creative Color',
    description: 'Vibrant creative theme',
    tags: ['light', 'creative'],
    parent: 'default',
    theme: {
      colorPrimary: '#e91e63',
      spacingUnit: '10px',
      radius: '12px',
      cssVariables: {},
    },
  },
  {
    id: 'minimal',
    name: 'Minimal B&W',
    description: 'Extreme minimalism',
    tags: ['light', 'minimal'],
    parent: 'default',
    theme: {
      colorPrimary: '#212121',
      colorBg: '#fafafa',
      radius: '0px',
      cssVariables: {},
    },
  },
];

export function createThemeEngine(): ThemeEngine {
  const engine = new ThemeEngine();
  engine.registerAll(BUILT_IN_THEMES);
  return engine;
}
