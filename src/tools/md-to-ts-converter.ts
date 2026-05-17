/**
 * FR-H02: MD→TS Batch Converter
 *
 * Extracts hard design parameters from DESIGN.md files and generates
 * TypeScript modules conforming to the DesignSystemPackage interface.
 *
 * AC1: CLI-callable tool function (single file or directory batch)
 * AC2: Extracts colors, typography, spacing, radius, components
 * AC3: Generates generic constraint rules per brand package
 * AC4: Batch mode — single failure doesn't block others, error log + summary
 * AC5: Output passes tsc --noEmit
 * AC6: Dev-time tool, not a runtime dependency
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import type { DesignSystemPackage } from '../design-system/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConvertOptions {
  /** Path to a single design.md or a directory containing brand packages */
  input: string;
  /** Process all subdirectories containing design.md */
  batch: boolean;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  errors: string[];
}

export interface BatchConversionReport {
  total: number;
  succeeded: number;
  failed: number;
  results: ConversionResult[];
}

export interface ExtractedTokens {
  colors: Record<string, string>;
  typography: {
    fontFamily: { heading: string; body: string };
    sizes: Record<string, string>;
    weights: Record<string, string>;
    lineHeights: Record<string, string>;
  };
  spacing: { unit: string; values: Record<string, string> };
  radius: Record<string, string>;
  shadows: Record<string, string>;
  opacity: Record<string, string>;
  components: Array<{ name: string; selector: string; properties: Record<string, string> }>;
}

// ─── Section Aliases ────────────────────────────────────────────────────────

/**
 * Maps logical section names to arrays of possible heading variants found
 * in real design.md files across brand packages.
 */
const SECTION_ALIASES: Record<string, string[]> = {
  color: [
    'Color',
    'Color Palette',
    'Color Palette & Roles',
    'Color Palette (Cultural Modernism)',
  ],
  typography: [
    'Typography',
    'Typography Rules',
    'Typography (The Heart of the System)',
  ],
  spacing: [
    'Spacing',
    'Spacing & Grid',
    'Spacing & Layout',
    'Spacing & Layout Grid',
    'Layout & Spacing',
  ],
  layout: [
    'Layout',
    'Layout & Composition',
    'Layout Principles',
  ],
  components: [
    'Components',
    'Component Stylings',
    'Component Styles',
  ],
};

// ─── Section Extraction Helper ──────────────────────────────────────────────

/**
 * Extract a markdown section by heading name using line-based scanning.
 * Matches "## N. SectionName" or "## SectionName" patterns.
 * Returns all content from the heading line to the next same-level heading.
 */
function extractSection(content: string, sectionName: string): string | null {
  const lines = content.split('\n');
  let startIdx = -1;
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match "## N. SectionName" or "## SectionName" (case-insensitive)
  const headingRe = new RegExp(
    `^##\\s+(?:\\d+\\.\\s+)?${escaped}`,
    'i',
  );

  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Find the next ## heading (same level or higher)
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * Try to extract a section using multiple alias names.
 * Returns the first successful match.
 */
function extractSectionByAlias(content: string, aliasKey: string): string | null {
  const aliases = SECTION_ALIASES[aliasKey];
  if (!aliases) return null;
  for (const alias of aliases) {
    const section = extractSection(content, alias);
    if (section) return section;
  }
  return null;
}

// ─── Extraction Logic ───────────────────────────────────────────────────────

/** FR-H02 AC2: Extract colors from Color section */
export function extractColors(content: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const section = extractSectionByAlias(content, 'color');
  if (!section) return colors;

  // Pattern 1: "- **Name** (`#hex`): description" or "- **Name** (`#hex`) — description"
  const boldBacktickRe = /[-*]\s+\*\*(.+?)\*\*\s*\(`?(#[0-9a-fA-F]{3,8})`?\)/g;
  let m: RegExpExecArray | null;
  while ((m = boldBacktickRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-').replace(/[()]/g, '');
    colors[name] = m[2];
  }

  // Pattern 2: "- **Name:** `#hex` — description"
  const boldColonBacktickRe = /[-*]\s+\*\*(.+?):?\*\*:?\s*`(#[0-9a-fA-F]{3,8})`/g;
  while ((m = boldColonBacktickRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-').replace(/[()]/g, '');
    if (!colors[name]) colors[name] = m[2];
  }

  // Pattern 3: "- Name: #hex" or "Name: #hex"
  const colonHexRe = /[-*]?\s*([\w\s/()]+?):\s*(#[0-9a-fA-F]{3,8})/g;
  while ((m = colonHexRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-').replace(/[()]/g, '');
    if (!colors[name]) colors[name] = m[2];
  }

  // Pattern 4: rgba patterns
  const rgbaRe = /[-*]?\s*([\w\s/()]+?):\s*(rgba?\([^)]+\))/g;
  while ((m = rgbaRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-').replace(/[()]/g, '');
    if (!colors[name]) colors[name] = m[2];
  }

  return colors;
}

/** FR-H02 AC2: Extract typography from Typography section */
export function extractTypography(content: string): ExtractedTokens['typography'] {
  const section = extractSectionByAlias(content, 'typography');
  const result: ExtractedTokens['typography'] = {
    fontFamily: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    sizes: {},
    weights: {},
    lineHeights: {},
  };

  if (!section) return result;

  // Extract font family - multiple patterns
  // Pattern: "Font Family: X" or "Typeface: X" or "Font: X"
  const fontMatch = section.match(/(?:Font\s*(?:Family)?|Typeface)\s*:\s*(.+)/i);
  if (fontMatch) {
    const font = fontMatch[1].trim();
    result.fontFamily = { heading: font, body: font };
  }

  // Pattern: "Families: primary=X, display=Y, mono=Z" or "**Families:** primary=X, ..."
  const familiesMatch = section.match(/\*{0,2}Families\*{0,2}:?\*{0,2}\s*(.+)/i);
  if (familiesMatch) {
    const familiesStr = familiesMatch[1];
    const primaryMatch = familiesStr.match(/primary=([^,]+)/);
    const displayMatch = familiesStr.match(/display=([^,]+)/);
    if (primaryMatch) {
      result.fontFamily.body = primaryMatch[1].trim();
      result.fontFamily.heading = primaryMatch[1].trim();
    }
    if (displayMatch) {
      result.fontFamily.heading = displayMatch[1].trim();
    }
  }

  // Pattern: "### Font Family" followed by "- **FontName** (primary...)"
  const fontBlockMatch = section.match(/###\s*Font\s*Family[\s\S]*?\n[-*]\s+\*\*(.+?)\*\*/i);
  if (fontBlockMatch) {
    const font = fontBlockMatch[1].trim();
    result.fontFamily = { heading: font, body: font };
  }

  // Separate heading/body fonts if specified
  const headingFont = section.match(/(?:Heading|Display)\s*(?:Font)?\s*:\s*(.+)/i);
  const bodyFont = section.match(/(?:Body|Text)\s*(?:Font)?\s*:\s*(.+)/i);
  if (headingFont) result.fontFamily.heading = headingFont[1].trim();
  if (bodyFont) result.fontFamily.body = bodyFont[1].trim();

  // Extract sizes (e.g., "- sm: 12px" or "xs: 11px")
  const sizeRe = /[-*]?\s*(\w+)\s*:\s*(\d+px|clamp\([^)]+\))/g;
  let m: RegExpExecArray | null;
  while ((m = sizeRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    const validSizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
    if (validSizes.includes(name)) {
      result.sizes[name] = m[2];
    }
  }

  // Extract scale from "Scale: 12/14/16/20/24/32" or "**Scale:** 12/14/16/20/24/32" format
  const scaleMatch = section.match(/\*{0,2}Scale\*{0,2}:?\*{0,2}\s*([\d/]+)/i);
  if (scaleMatch && Object.keys(result.sizes).length === 0) {
    const scaleNames = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
    const values = scaleMatch[1].split('/');
    values.forEach((v, i) => {
      if (i < scaleNames.length) {
        result.sizes[scaleNames[i]] = `${v}px`;
      }
    });
  }

  // Extract weights (e.g., "normal (400)" or "medium: 500" or "**Weights:** 100, 200, ...")
  const weightsListMatch = section.match(/\*{0,2}Weights\*{0,2}:?\*{0,2}\s*([\d,\s]+)/i);
  if (weightsListMatch) {
    const weightNames: Record<string, string> = {
      '100': 'thin', '200': 'extralight', '300': 'light', '400': 'normal',
      '500': 'medium', '600': 'semibold', '700': 'bold', '800': 'extrabold', '900': 'black',
    };
    const weights = weightsListMatch[1].split(/[,\s]+/).filter(Boolean);
    for (const w of weights) {
      const name = weightNames[w];
      if (name) result.weights[name] = w;
    }
  }

  const weightRe = /[-*]?\s*(\w+)\s*[:(]\s*(\d{3})/g;
  while ((m = weightRe.exec(section)) !== null) {
    if (!result.weights[m[1].toLowerCase()]) {
      result.weights[m[1].toLowerCase()] = m[2];
    }
  }

  // Extract line heights (e.g., "tight (1.02)" or "normal: 1.42")
  const lhRe = /[-*]?\s*(\w+)\s*[:(]\s*(1\.\d+|\d\.\d+)/g;
  while ((m = lhRe.exec(section)) !== null) {
    result.lineHeights[m[1].toLowerCase()] = m[2];
  }

  return result;
}

/** FR-H02 AC2: Extract spacing from Spacing/Layout sections */
export function extractSpacing(content: string): ExtractedTokens['spacing'] {
  // Try spacing section first, then layout
  const section = extractSectionByAlias(content, 'spacing') ?? extractSectionByAlias(content, 'layout');
  const result: ExtractedTokens['spacing'] = { unit: '8px', values: {} };

  if (!section) return result;

  // Extract base unit
  const unitMatch = section.match(/(?:base|unit)\s*(?:spacing)?\s*:\s*(\d+px)/i);
  if (unitMatch) result.unit = unitMatch[1];

  // Extract spacing scale from "Spacing scale: 4/8/12/16/24/32" or "**Spacing scale:** 4/8/12/16/24/32"
  const scaleMatch = section.match(/\*{0,2}Spacing\s*scale\*{0,2}:?\*{0,2}\s*([\d/]+)/i);
  if (scaleMatch) {
    const scaleNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
    const values = scaleMatch[1].split('/');
    values.forEach((v, i) => {
      if (i < scaleNames.length) {
        result.values[scaleNames[i]] = `${v}px`;
      }
    });
    // Infer base unit from the scale if not explicitly set
    if (!unitMatch && values.length >= 2) {
      result.unit = `${values[1]}px`;
    }
  }

  // Extract spacing scale values (e.g., "xs(4px)" or "xs: 4px")
  const parenRe = /(\w+)\((\d+px)\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    const validSpacing = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
    if (validSpacing.includes(name)) {
      result.values[name] = m[2];
    }
  }

  // Also match "- xs: 4px" format
  const colonRe = /[-*]?\s*(\w+)\s*:\s*(\d+px)/g;
  while ((m = colonRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    const validSpacing = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
    if (validSpacing.includes(name) && !result.values[name]) {
      result.values[name] = m[2];
    }
  }

  return result;
}

/** FR-H02 AC2: Extract border radius from Layout/Spacing sections */
export function extractRadius(content: string): Record<string, string> {
  const section = extractSectionByAlias(content, 'layout') ?? extractSectionByAlias(content, 'spacing');
  const radius: Record<string, string> = {};

  if (!section) return radius;

  const validRadius = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];

  // Match "sm(10px)" format
  const parenRe = /(\w+)\((\d+px|999px)\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    if (validRadius.includes(name)) {
      radius[name] = m[2];
    }
  }

  // Match "- sm: 10px" format within radius context
  const radiusBlock = section.match(/(?:radius|corner|rounded|border-radius)[\s\S]*?(?=\n##|\n\n[A-Z]|$)/i)?.[0] ?? '';
  const colonRe = /[-*]?\s*(\w+)\s*[:(]\s*(\d+px|999px)/g;
  while ((m = colonRe.exec(radiusBlock)) !== null) {
    const name = m[1].toLowerCase();
    if (validRadius.includes(name) && !radius[name]) {
      radius[name] = m[2];
    }
  }

  return radius;
}

/** FR-H02 AC2: Extract components from Components section */
export function extractComponents(content: string): ExtractedTokens['components'] {
  const section = extractSectionByAlias(content, 'components');
  const components: ExtractedTokens['components'] = [];

  if (!section) return components;

  const lines = section.split('\n');
  let currentName = '';
  let currentProps: Record<string, string> = {};

  const cssProperties = [
    'background', 'color', 'border', 'border-radius', 'padding', 'margin',
    'font-size', 'font-weight', 'letter-spacing', 'text-transform',
    'opacity', 'box-shadow', 'backdrop-filter',
  ];

  for (const line of lines) {
    // Detect component name via ### heading
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      if (currentName && Object.keys(currentProps).length > 0) {
        components.push({
          name: toSelector(currentName),
          selector: toSelector(currentName),
          properties: currentProps,
        });
      }
      currentName = h3Match[1].trim();
      currentProps = {};
      continue;
    }

    // Detect component name: "- **Name**:" or "**Name**:" at start of line
    const nameMatch = line.match(
      /^(?:[-*]\s+)?\*\*(.+?)\*\*\s*:/,
    );
    if (nameMatch) {
      if (currentName && Object.keys(currentProps).length > 0) {
        components.push({
          name: toSelector(currentName),
          selector: toSelector(currentName),
          properties: currentProps,
        });
      }
      currentName = nameMatch[1].trim();
      currentProps = {};
      continue;
    }

    // Extract CSS-like properties from the line
    for (const prop of cssProperties) {
      const propRe = new RegExp(`${prop}\\s*:\\s*([^,;]+)`, 'i');
      const propMatch = line.match(propRe);
      if (propMatch && currentName) {
        currentProps[prop] = propMatch[1].trim();
      }
    }
  }

  // Push last component
  if (currentName && Object.keys(currentProps).length > 0) {
    components.push({
      name: toSelector(currentName),
      selector: toSelector(currentName),
      properties: currentProps,
    });
  }

  return components;
}

// ─── Full Extraction ────────────────────────────────────────────────────────

/** Extract all tokens from a design.md content string */
export function extractTokens(content: string): ExtractedTokens {
  return {
    colors: extractColors(content),
    typography: extractTypography(content),
    spacing: extractSpacing(content),
    radius: extractRadius(content),
    shadows: {},
    opacity: {},
    components: extractComponents(content),
  };
}

// ─── Code Generation ────────────────────────────────────────────────────────

/** FR-H02 AC3: Generate TypeScript module source from extracted tokens */
export function generateTypeScript(
  tokens: ExtractedTokens,
  packageId: string,
  packageName: string,
): string {
  const constName = toConstName(packageId);
  const lines: string[] = [
    `// Auto-generated by md-to-ts-converter from design.md`,
    `// FR-H02: Do not edit manually — regenerate from design.md`,
    `import type { DesignSystemPackage } from '../../types.js';`,
    ``,
    `export const ${constName}: DesignSystemPackage = {`,
    `  id: '${escapeStr(packageId)}',`,
    `  name: '${escapeStr(packageName)}',`,
    `  version: '1.0.0',`,
    ``,
    `  tokens: {`,
    `    colors: ${formatObject(tokens.colors, 6)},`,
    `    spacing: {`,
    `      unit: '${escapeStr(tokens.spacing.unit)}',`,
    `      values: ${formatObject(tokens.spacing.values, 8)},`,
    `    },`,
    `    typography: {`,
    `      fontFamily: {`,
    `        heading: '${escapeStr(tokens.typography.fontFamily.heading)}',`,
    `        body: '${escapeStr(tokens.typography.fontFamily.body)}',`,
    `      },`,
    `      sizes: ${formatObject(tokens.typography.sizes, 8)},`,
    `      weights: ${formatObject(tokens.typography.weights, 8)},`,
    `      lineHeights: ${formatObject(tokens.typography.lineHeights, 8)},`,
    `    },`,
    `    radius: ${formatObject(tokens.radius, 6)},`,
    `    shadows: {},`,
    `    opacity: {},`,
    `  },`,
    ``,
    `  components: [`,
    ...tokens.components.map(c =>
      `    { name: '${escapeStr(c.name)}', selector: '${escapeStr(c.selector)}', properties: ${JSON.stringify(c.properties)} },`,
    ),
    `  ],`,
    ``,
    `  reference: {`,
    `    html: '',`,
    `  },`,
    ``,
    `  // FR-H02 AC3: Auto-generated generic constraints`,
    `  constraints: {`,
    `    enforce: [`,
    `      {`,
    `        id: 'colors-from-tokens',`,
    `        description: 'All colors must come from tokens.colors',`,
    `        check: (html: string, pkg: DesignSystemPackage) => {`,
    `          const hexRe = /#[0-9a-fA-F]{6}\\b/g;`,
    `          const allowed = new Set(Object.values(pkg.tokens.colors).map(c => c.toLowerCase()));`,
    `          let match: RegExpExecArray | null;`,
    `          while ((match = hexRe.exec(html)) !== null) {`,
    `            if (!allowed.has(match[0].toLowerCase())) {`,
    `              return { ruleId: 'colors-from-tokens', message: \`Unauthorized color: \${match[0]}\`, severity: 'block' as const };`,
    `            }`,
    `          }`,
    `          return null;`,
    `        },`,
    `      },`,
    `      {`,
    `        id: 'fonts-from-declaration',`,
    `        description: 'Fonts must match declared font families',`,
    `        check: (html: string, pkg: DesignSystemPackage) => {`,
    `          const fontRe = /font-family\\s*:\\s*([^;}]+)/g;`,
    `          const declared = pkg.tokens.typography.fontFamily.heading.toLowerCase();`,
    `          let match: RegExpExecArray | null;`,
    `          while ((match = fontRe.exec(html)) !== null) {`,
    `            const val = match[1].toLowerCase();`,
    `            if (!val.includes('var(') && !declared.includes(val.split(',')[0].trim().replace(/['"]/g, ''))) {`,
    `              return { ruleId: 'fonts-from-declaration', message: \`Unauthorized font: \${match[1].trim()}\`, severity: 'block' as const };`,
    `            }`,
    `          }`,
    `          return null;`,
    `        },`,
    `      },`,
    `      {`,
    `        id: 'spacing-from-scale',`,
    `        description: 'Spacing values should come from tokens.spacing scale',`,
    `        check: (_html: string, _pkg: DesignSystemPackage) => {`,
    `          // Advisory rule — spacing is harder to enforce strictly`,
    `          return null;`,
    `        },`,
    `      },`,
    `    ],`,
    `    forbid: [],`,
    `  },`,
    `};`,
  ];

  return lines.join('\n') + '\n';
}

// ─── File Conversion ────────────────────────────────────────────────────────

/** Convert a single design.md file to index.ts in the same directory */
export async function convertFile(mdPath: string): Promise<ConversionResult> {
  const errors: string[] = [];

  try {
    const content = await readFile(mdPath, 'utf-8');

    // P2-1: Skip empty files or files with no meaningful content
    if (!content.trim() || content.trim().length < 50) {
      return {
        success: false,
        inputPath: mdPath,
        errors: ['File is empty or too short to contain design tokens'],
      };
    }

    const dir = dirname(mdPath);
    const packageId = basename(dir);
    const packageName = packageId
      .split('-')
      .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
      .join(' ');

    const tokens = extractTokens(content);

    // Validate minimum extraction
    if (Object.keys(tokens.colors).length === 0) {
      errors.push('No colors extracted from Color section');
    }

    // P2-1: Don't write output if extraction completely failed
    if (Object.keys(tokens.colors).length === 0 &&
        Object.keys(tokens.typography.sizes).length === 0 &&
        Object.keys(tokens.spacing.values).length === 0 &&
        tokens.components.length === 0) {
      errors.push('No meaningful tokens extracted — skipping output to avoid polluting package');
      return { success: false, inputPath: mdPath, errors };
    }

    const tsContent = generateTypeScript(tokens, packageId, packageName);
    const outputPath = join(dir, 'index.ts');
    await writeFile(outputPath, tsContent, 'utf-8');

    return { success: errors.length === 0, inputPath: mdPath, outputPath, errors };
  } catch (err) {
    errors.push(`Failed to process ${mdPath}: ${err instanceof Error ? err.message : String(err)}`);
    return { success: false, inputPath: mdPath, errors };
  }
}

/** FR-H02 AC4: Batch convert all design.md files in a directory */
export async function convertBatch(dirPath: string): Promise<BatchConversionReport> {
  const results: ConversionResult[] = [];

  // P1-3: Error isolation for directory reading
  let entries: string[];
  try {
    entries = await readdir(dirPath);
  } catch (err) {
    results.push({
      success: false,
      inputPath: dirPath,
      errors: [`Failed to read directory: ${err instanceof Error ? err.message : String(err)}`],
    });
    return { total: 0, succeeded: 0, failed: 1, results };
  }

  for (const entry of entries) {
    const subdir = join(dirPath, entry);

    // P1-3: Error isolation for each entry's stat
    let s;
    try {
      s = await stat(subdir);
    } catch (err) {
      results.push({
        success: false,
        inputPath: subdir,
        errors: [`Failed to stat entry: ${err instanceof Error ? err.message : String(err)}`],
      });
      continue;
    }

    if (!s.isDirectory()) continue;

    const mdPath = join(subdir, 'design.md');
    const hasMd = await stat(mdPath).then(() => true).catch(() => false);
    if (!hasMd) continue;

    const result = await convertFile(mdPath);
    results.push(result);
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.length - succeeded;

  return { total: results.length, succeeded, failed, results };
}

/** FR-H02 AC1: Main entry point for CLI or programmatic use */
export async function convert(options: ConvertOptions): Promise<BatchConversionReport> {
  const resolved = resolve(options.input);
  const s = await stat(resolved);

  if (options.batch || s.isDirectory()) {
    return convertBatch(resolved);
  }

  const result = await convertFile(resolved);
  return {
    total: 1,
    succeeded: result.success ? 1 : 0,
    failed: result.success ? 0 : 1,
    results: [result],
  };
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function toSelector(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function toConstName(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_PACKAGE';
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatObject(obj: Record<string, string>, indent: number): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  const pad = ' '.repeat(indent);
  const inner = entries.map(([k, v]) => `${pad}  '${k}': '${escapeStr(v)}',`).join('\n');
  return `{\n${inner}\n${pad}}`;
}
