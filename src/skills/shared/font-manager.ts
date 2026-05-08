export interface FontSpec {
  family: string;
  weight: number;
  size: string;
  lineHeight: string;
}

export interface FontScale {
  id: string;
  name: string;
  h1: FontSpec;
  h2: FontSpec;
  h3: FontSpec;
  body: FontSpec;
  caption: FontSpec;
  label: FontSpec;
}

export const DEFAULT_FONT_SCALE: FontScale = {
  id: 'default',
  name: '默认字阶',
  h1: { family: 'var(--cd-font-heading)', weight: 700, size: '2.5rem', lineHeight: '1.2' },
  h2: { family: 'var(--cd-font-heading)', weight: 600, size: '2rem', lineHeight: '1.3' },
  h3: { family: 'var(--cd-font-heading)', weight: 600, size: '1.5rem', lineHeight: '1.4' },
  body: { family: 'var(--cd-font-body)', weight: 400, size: '1rem', lineHeight: '1.6' },
  caption: { family: 'var(--cd-font-body)', weight: 400, size: '0.875rem', lineHeight: '1.5' },
  label: { family: 'var(--cd-font-body)', weight: 500, size: '0.75rem', lineHeight: '1.4' },
};

export const COMPACT_FONT_SCALE: FontScale = {
  id: 'compact',
  name: '紧凑字阶',
  h1: { family: 'var(--cd-font-heading)', weight: 700, size: '2rem', lineHeight: '1.2' },
  h2: { family: 'var(--cd-font-heading)', weight: 600, size: '1.5rem', lineHeight: '1.3' },
  h3: { family: 'var(--cd-font-heading)', weight: 600, size: '1.25rem', lineHeight: '1.4' },
  body: { family: 'var(--cd-font-body)', weight: 400, size: '0.875rem', lineHeight: '1.5' },
  caption: { family: 'var(--cd-font-body)', weight: 400, size: '0.75rem', lineHeight: '1.4' },
  label: { family: 'var(--cd-font-body)', weight: 500, size: '0.625rem', lineHeight: '1.3' },
};

export function fontSpecToCss(spec: FontSpec): string {
  return `font-family:${spec.family}; font-weight:${spec.weight}; font-size:${spec.size}; line-height:${spec.lineHeight};`;
}

export function fontScaleToCssBlock(scale: FontScale): string {
  const levels: Array<[string, FontSpec]> = [
    ['h1', scale.h1], ['h2', scale.h2], ['h3', scale.h3],
    ['body', scale.body], ['caption', scale.caption], ['label', scale.label],
  ];
  return levels
    .map(([tag, spec]) => `.cd-${tag} { ${fontSpecToCss(spec)} }`)
    .join('\n');
}

export function getFontScale(id: string): FontScale {
  if (id === 'compact') return COMPACT_FONT_SCALE;
  return DEFAULT_FONT_SCALE;
}
