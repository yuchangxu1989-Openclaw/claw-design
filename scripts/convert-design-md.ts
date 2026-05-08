#!/usr/bin/env node
// FR-H02: MD→TS Batch Converter — extract hard parameters from DESIGN.md to generate index.ts
// Usage: npx tsx scripts/convert-design-md.ts <path-to-design.md-or-directory> [--batch]

import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';

/** FR-H02 AC1: CLI interface */
interface ConvertOptions {
  input: string;
  batch: boolean;
}

interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  errors: string[];
}

interface ExtractedTokens {
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

// ─── Extraction Logic ───────────────────────────────────────────────────────

/** FR-H02 AC2: Extract colors from §2 (Color Palette) */
function extractColors(content: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const section = extractSection(content, 'Color Palette');
  if (!section) return colors;

  // Match patterns like "Name: #hex" or "- name: #hex"
  const hexRe = /[-*]?\s*([\w\s]+?):\s*(#[0-9a-fA-F]{3,8})/g;
  let m: RegExpExecArray | null;
  while ((m = hexRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-');
    colors[name] = m[2];
  }

  // Also match rgba patterns
  const rgbaRe = /[-*]?\s*([\w\s]+?):\s*(rgba?\([^)]+\))/g;
  while ((m = rgbaRe.exec(section)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[\s/]+/g, '-');
    colors[name] = m[2];
  }

  return colors;
}

/** FR-H02 AC2: Extract typography from §3 */
function extractTypography(content: string): ExtractedTokens['typography'] {
  const section = extractSection(content, 'Typography');
  const result: ExtractedTokens['typography'] = {
    fontFamily: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    sizes: {},
    weights: {},
    lineHeights: {},
  };

  if (!section) return result;

  // Extract font family
  const fontMatch = section.match(/(?:Font\s*(?:Family)?|Typeface)\s*:\s*(.+)/i);
  if (fontMatch) {
    const font = fontMatch[1].trim();
    result.fontFamily = { heading: font, body: font };
  }

  // Extract sizes (e.g., "sm: 12px" or "- small: 12px")
  const sizeRe = /[-*]?\s*(\w+)\s*:\s*(\d+px|clamp\([^)]+\))/g;
  let m: RegExpExecArray | null;
  while ((m = sizeRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    if (['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'small', 'medium', 'large'].includes(name)) {
      result.sizes[name] = m[2];
    }
  }

  // Extract weights
  const weightRe = /[-*]?\s*(\w+)\s*[:(]\s*(\d{3})/g;
  while ((m = weightRe.exec(section)) !== null) {
    result.weights[m[1].toLowerCase()] = m[2];
  }

  // Extract line heights
  const lhRe = /[-*]?\s*(\w+)\s*[:(]\s*(1\.\d+|\d\.\d+)/g;
  while ((m = lhRe.exec(section)) !== null) {
    result.lineHeights[m[1].toLowerCase()] = m[2];
  }

  return result;
}

/** FR-H02 AC2: Extract spacing from §5 (Layout Principles) */
function extractSpacing(content: string): ExtractedTokens['spacing'] {
  const section = extractSection(content, 'Layout Principles');
  const result: ExtractedTokens['spacing'] = { unit: '8px', values: {} };

  if (!section) return result;

  // Extract base unit
  const unitMatch = section.match(/(?:base|unit)\s*(?:spacing)?\s*:\s*(\d+px)/i);
  if (unitMatch) result.unit = unitMatch[1];

  // Extract spacing scale values
  const spaceRe = /[-*]?\s*(\w+)\s*[:(]\s*(\d+px)/g;
  let m: RegExpExecArray | null;
  while ((m = spaceRe.exec(section)) !== null) {
    const name = m[1].toLowerCase();
    if (['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'].includes(name)) {
      result.values[name] = m[2];
    }
  }

  return result;
}

/** FR-H02 AC2: Extract border radius from §5 */
function extractRadius(content: string): Record<string, string> {
  const section = extractSection(content, 'Layout Principles');
  const radius: Record<string, string> = {};

  if (!section) return radius;

  const radiusRe = /[-*]?\s*(\w+)\s*[:(]\s*(\d+px|999px)/g;
  let m: RegExpExecArray | null;
  // Look specifically in radius-related context
  const radiusBlock = section.match(/(?:radius|corner|rounded)[\s\S]*?(?=\n##|$)/i)?.[0] ?? section;
  while ((m = radiusRe.exec(radiusBlock)) !== null) {
    const name = m[1].toLowerCase();
    if (['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'].includes(name)) {
      radius[name] = m[2];
    }
  }

  return radius;
}

/** FR-H02 AC2: Extract components from §4 (Component Stylings) */
function extractComponents(content: string): ExtractedTokens['components'] {
  const section = extractSection(content, 'Component Stylings');
  const components: ExtractedTokens['components'] = [];

  if (!section) return components;

  // Split by component headings or list items that look like component names
  const lines = section.split('\n');
  let currentName = '';
  let currentProps: Record<string, string> = {};

  for (const line of lines) {
    // Detect component name (bold, heading, or capitalized start)
    const nameMatch = line.match(/^(?:[-*]\s+)?\*\*(.+?)\*\*|^(?:[-*]\s+)?([A-Z][\w\s]+?):/);
    if (nameMatch) {
      if (currentName) {
        components.push({
          name: currentName.toLowerCase().replace(/\s+/g, '-'),
          selector: currentName.toLowerCase().replace(/\s+/g, '-'),
          properties: currentProps,
        });
      }
      currentName = (nameMatch[1] ?? nameMatch[2]).trim();
      currentProps = {};
    }

    // Extract CSS-like properties
    const propMatch = line.match(/([\w-]+)\s*:\s*([^,;]+)/g);
    if (propMatch && currentName) {
      for (const prop of propMatch) {
        const [key, ...valParts] = prop.split(':');
        if (key && valParts.length) {
          const k = key.trim().toLowerCase();
          if (['background', 'color', 'border', 'border-radius', 'padding', 'font-size', 'font-weight'].includes(k)) {
            currentProps[k] = valParts.join(':').trim();
          }
        }
      }
    }
  }

  if (currentName) {
    components.push({
      name: currentName.toLowerCase().replace(/\s+/g, '-'),
      selector: currentName.toLowerCase().replace(/\s+/g, '-'),
      properties: currentProps,
    });
  }

  return components;
}

/** Helper: extract a section by heading name */
function extractSection(content: string, sectionName: string): string | null {
  const re = new RegExp(`^##\\s+\\d+\\.\\s+${sectionName}[\\s\\S]*?(?=^##\\s+\\d+\\.|$)`, 'mi');
  const match = content.match(re);
  return match?.[0] ?? null;
}

// ─── Code Generation ────────────────────────────────────────────────────────

/** FR-H02 AC3: Generate TypeScript module from extracted tokens */
function generateTypeScript(tokens: ExtractedTokens, packageId: string, packageName: string): string {
  const lines: string[] = [
    `// Auto-generated by convert-design-md.ts from design.md`,
    `// FR-H02: Do not edit manually — regenerate from design.md`,
    `import type { DesignSystemPackage } from '../types.js';`,
    ``,
    `export const ${toConstName(packageId)}: DesignSystemPackage = {`,
    `  id: '${packageId}',`,
    `  name: '${packageName}',`,
    `  version: '1.0.0',`,
    ``,
    `  tokens: {`,
    `    colors: ${formatObject(tokens.colors, 6)},`,
    `    spacing: {`,
    `      unit: '${tokens.spacing.unit}',`,
    `      values: ${formatObject(tokens.spacing.values, 8)},`,
    `    },`,
    `    typography: {`,
    `      fontFamily: {`,
    `        heading: '${tokens.typography.fontFamily.heading}',`,
    `        body: '${tokens.typography.fontFamily.body}',`,
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
      `    { name: '${c.name}', selector: '${c.selector}', properties: ${JSON.stringify(c.properties)} },`
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
    `        check: (html, pkg) => {`,
    `          const hexRe = /#[0-9a-fA-F]{6}\\b/g;`,
    `          const allowed = new Set(Object.values(pkg.tokens.colors).map(c => c.toLowerCase()));`,
    `          let m: RegExpExecArray | null;`,
    `          while ((m = hexRe.exec(html)) !== null) {`,
    `            if (!allowed.has(m[0].toLowerCase())) {`,
    `              return { ruleId: 'colors-from-tokens', message: \`Unauthorized color: \${m[0]}\`, severity: 'block' as const };`,
    `            }`,
    `          }`,
    `          return null;`,
    `        },`,
    `      },`,
    `      {`,
    `        id: 'fonts-from-declaration',`,
    `        description: 'Fonts must match declared font families',`,
    `        check: (html, pkg) => {`,
    `          const fontRe = /font-family\\s*:\\s*([^;}]+)/g;`,
    `          const declared = pkg.tokens.typography.fontFamily.heading.toLowerCase();`,
    `          let m: RegExpExecArray | null;`,
    `          while ((m = fontRe.exec(html)) !== null) {`,
    `            const val = m[1].toLowerCase();`,
    `            if (!val.includes('var(') && !declared.includes(val.split(',')[0].trim().replace(/['"]/g, ''))) {`,
    `              return { ruleId: 'fonts-from-declaration', message: \`Unauthorized font: \${m[1].trim()}\`, severity: 'block' as const };`,
    `            }`,
    `          }`,
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

function toConstName(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_PACKAGE';
}

function formatObject(obj: Record<string, string>, indent: number): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  const pad = ' '.repeat(indent);
  const inner = entries.map(([k, v]) => `${pad}  '${k}': '${v}',`).join('\n');
  return `{\n${inner}\n${pad}}`;
}

// ─── Main Conversion ────────────────────────────────────────────────────────

async function convertFile(mdPath: string): Promise<ConversionResult> {
  const errors: string[] = [];

  try {
    const content = await readFile(mdPath, 'utf-8');
    const dir = dirname(mdPath);
    const packageId = basename(dir);
    const packageName = packageId.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

    const tokens: ExtractedTokens = {
      colors: extractColors(content),
      typography: extractTypography(content),
      spacing: extractSpacing(content),
      radius: extractRadius(content),
      shadows: {},
      opacity: {},
      components: extractComponents(content),
    };

    // Validate minimum extraction
    if (Object.keys(tokens.colors).length === 0) {
      errors.push('No colors extracted from Color Palette section');
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

/** FR-H02 AC4: Batch mode — process directory */
async function convertBatch(dirPath: string): Promise<void> {
  const entries = await readdir(dirPath);
  const results: ConversionResult[] = [];

  for (const entry of entries) {
    const subdir = join(dirPath, entry);
    const s = await stat(subdir);
    if (!s.isDirectory()) continue;

    const mdPath = join(subdir, 'design.md');
    const hasMd = await stat(mdPath).then(() => true).catch(() => false);
    if (!hasMd) continue;

    const result = await convertFile(mdPath);
    results.push(result);
    const status = result.success ? '✓' : '✗';
    console.log(`  ${status} ${entry}: ${result.success ? 'OK' : result.errors.join(', ')}`);
  }

  // Summary
  const succeeded = results.filter(r => r.success).length;
  const failed = results.length - succeeded;
  console.log(`\nBatch complete: ${succeeded} succeeded, ${failed} failed out of ${results.length} total`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

// ─── CLI Entry ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const batch = args.includes('--batch');
  const input = args.find(a => !a.startsWith('--'));

  if (!input) {
    console.error('Usage: npx tsx scripts/convert-design-md.ts <path> [--batch]');
    console.error('  <path>: path to a design.md file, or directory containing brand packages');
    console.error('  --batch: process all subdirectories containing design.md');
    process.exit(1);
  }

  const resolved = resolve(input);
  const s = await stat(resolved);

  if (batch || s.isDirectory()) {
    console.log(`Batch converting packages in: ${resolved}`);
    await convertBatch(resolved);
  } else {
    console.log(`Converting: ${resolved}`);
    const result = await convertFile(resolved);
    if (result.success) {
      console.log(`✓ Output: ${result.outputPath}`);
    } else {
      console.error(`✗ Errors: ${result.errors.join(', ')}`);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});