import type { BrandKit } from '../types.js';

export interface BrandKitSource {
  kind: 'html' | 'css' | 'artifact';
  content: string;
  path?: string;
}

export interface ExtractedBrandKit extends BrandKit {
  confirmationStatus: 'inferred';
  evidence: {
    colors: string[];
    fonts: string[];
    logos: string[];
    spacing: string[];
  };
}

export class BrandKitExtractor {
  extract(sources: BrandKitSource[]): ExtractedBrandKit {
    const contents = sources.map(source => source.content).join('\n');
    const html = sources
      .filter(source => source.kind === 'html' || source.kind === 'artifact')
      .map(source => source.content)
      .join('\n');
    const css = [
      ...sources.filter(source => source.kind === 'css').map(source => source.content),
      ...extractCssBlocks(html),
    ].join('\n');

    const colors = rankColors([...collectCssVariables(css, /--[^:]*color[^:]*:\s*([^;]+);/gi), ...collectColors(contents)]);
    const fonts = rankFonts([...collectCssVariables(css, /--[^:]*font[^:]*:\s*([^;]+);/gi), ...collectFontFamilies(contents)]);
    const spacingValues = rankSpacing([...collectCssVariables(css, /--[^:]*spacing[^:]*:\s*([^;]+);/gi), ...collectSpacing(contents)]);
    const logoSelectors = collectLogoSelectors(html, sources);

    const maxSectionsPerPage = inferLayoutRhythm(html);

    return {
      colors,
      fonts,
      logo: logoSelectors.length > 0
        ? {
            required: true,
            selectors: logoSelectors,
            alt: extractLogoAlt(html),
          }
        : undefined,
      layoutRhythm: maxSectionsPerPage > 0 ? { maxSectionsPerPage } : undefined,
      confirmationStatus: 'inferred',
      evidence: {
        colors,
        fonts,
        logos: logoSelectors,
        spacing: spacingValues,
      },
    };
  }
}

function extractCssBlocks(html: string): string[] {
  /**
   * Known boundary: this non-greedy regex assumes literal </style> only marks the
   * end of a style tag. If CSS content itself contains the string "</style>",
   * extraction can split early. Acceptable for current trusted HTML inputs.
   */
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
}

function collectColors(content: string): string[] {
  const normalized = content.toLowerCase();
  const colors = new Map<string, number>();
  const patterns = [
    /#[0-9a-f]{3,8}\b/g,
    /rgba?\([^\)]+\)/g,
    /hsla?\([^\)]+\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of normalized.match(pattern) ?? []) {
      const key = normalizeColor(match);
      if (key) {
        colors.set(key, (colors.get(key) ?? 0) + 1);
      }
    }
  }

  return sortByFrequency(colors, 6);
}

function collectFontFamilies(content: string): string[] {
  const fonts = new Map<string, number>();
  const patterns = [
    /font-family\s*:\s*([^;}{]+);/gi,
    /--[^:]*font[^:]*:\s*([^;}{]+);/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      for (const font of parseFontList(match[1])) {
        fonts.set(font, (fonts.get(font) ?? 0) + 1);
      }
    }
  }

  return sortByFrequency(fonts, 4);
}

function collectSpacing(content: string): string[] {
  const spacing = new Map<string, number>();
  const patterns = [
    /(?:padding|margin|gap|row-gap|column-gap)\s*:\s*([^;}{]+)/gi,
    /(?:padding|margin)-(?:top|right|bottom|left)\s*:\s*([^;}{]+)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      for (const token of extractSpacingTokens(match[1])) {
        spacing.set(token, (spacing.get(token) ?? 0) + 1);
      }
    }
  }

  return sortByFrequency(spacing, 6);
}

function collectLogoSelectors(html: string, sources: BrandKitSource[]): string[] {
  const selectors = new Set<string>();
  const logoPattern = /<(img|svg)[^>]*(?:src|class|id|data-brand-logo|alt)=[^>]*?(logo|brand)[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = logoPattern.exec(html)) !== null) {
    const tag = match[0];
    const id = /id=["']([^"']+)["']/i.exec(tag)?.[1];
    const className = /class=["']([^"']+)["']/i.exec(tag)?.[1];
    const dataBrand = /data-brand-logo(?:=["']([^"']*)["'])?/i.exec(tag);

    if (id) selectors.add(`#${id}`);
    if (className) {
      className.split(/\s+/).filter(Boolean).forEach(name => selectors.add(`.${name}`));
    }
    if (dataBrand) selectors.add('[data-brand-logo]');
  }

  for (const source of sources) {
    if (source.path && /logo|brand/i.test(source.path)) {
      selectors.add(source.path);
    }
  }

  return Array.from(selectors).slice(0, 6);
}

function inferLayoutRhythm(html: string): number {
  const sections = html.match(/<section\b/gi)?.length ?? 0;
  if (sections === 0) {
    return 0;
  }

  // Count explicit page containers (class="page" or class="slide")
  const pageMarkers = html.match(/<(?:section|div)\b[^>]*class=["'][^"']*\b(?:page|slide)\b[^"']*["'][^>]*>/gi)?.length ?? 0;
  const pages = Math.max(1, pageMarkers);
  return Math.max(1, Math.ceil(sections / pages));
}

function extractLogoAlt(html: string): string | undefined {
  const match = /<(?:img|svg)[^>]*alt=["']([^"']+)["'][^>]*?(?:logo|brand)|<(?:img|svg)[^>]*?(?:logo|brand)[^>]*alt=["']([^"']+)["']/i.exec(html);
  return match?.[1] ?? match?.[2];
}

function collectCssVariables(content: string, pattern: RegExp): string[] {
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

function normalizeColor(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  if (/^#[0-9a-f]{6,8}$/.test(trimmed) || /^rgba?\(/.test(trimmed) || /^hsla?\(/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function parseFontList(value: string): string[] {
  return value
    .split(',')
    .map(font => font.trim().replace(/^['"]|['"]$/g, ''))
    .filter(font => font.length > 0 && !/^(sans-serif|serif|monospace|system-ui)$/i.test(font));
}

function extractSpacingTokens(value: string): string[] {
  return [...value.matchAll(/-?\d*\.?\d+(?:px|rem|em|vh|vw|%)?/gi)]
    .map(match => match[0].trim())
    .filter(token => token.length > 0 && token !== '0');
}

function rankColors(values: string[]): string[] {
  const map = new Map<string, number>();
  for (const value of values) {
    const normalized = normalizeColor(value);
    if (!normalized) continue;
    map.set(normalized, (map.get(normalized) ?? 0) + 1);
  }
  return sortByFrequency(map, 5);
}

function rankFonts(values: string[]): string[] {
  const map = new Map<string, number>();
  for (const value of values) {
    for (const font of parseFontList(value)) {
      map.set(font, (map.get(font) ?? 0) + 1);
    }
  }
  return sortByFrequency(map, 4);
}

function rankSpacing(values: string[]): string[] {
  const map = new Map<string, number>();
  for (const value of values) {
    for (const token of extractSpacingTokens(value)) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
  }
  return sortByFrequency(map, 6);
}

function sortByFrequency(map: Map<string, number>, limit: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}
