#!/usr/bin/env node
/**
 * FR-H05: Batch generate brand packages from Open Design DESIGN.md files.
 * Reads /tmp/open-design/design-systems/*, extracts tokens, generates index.ts for each.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE_DIR = '/tmp/open-design/design-systems';
const TARGET_DIR = join(import.meta.dirname, '..', 'src', 'design-system', 'packages');

// --- Extraction helpers ---

function extractHexColors(text) {
  const colors = {};

  // Strategy 1: Lines like "- **Short Name** (`#hex`)" or "- **Short Name**: `#hex`"
  const namedRe = /[-*]\s*\*\*([^*]{1,40})\*\*[^`\n]{0,30}`(#[0-9a-fA-F]{3,8})`/g;
  let m;
  while ((m = namedRe.exec(text)) !== null) {
    const rawName = m[1].trim();
    // Skip if name is too long or looks like a sentence
    if (rawName.length > 35 || rawName.split(' ').length > 4) continue;
    const name = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (name && name.length >= 2 && name.length <= 30 && !colors[name]) {
      colors[name] = m[2];
    }
  }

  // Strategy 2: CSS variable patterns like `--color-name: #hex`
  const cssVarRe = /--([a-z][a-z0-9-]{1,30}):\s*(#[0-9a-fA-F]{3,8})/g;
  while ((m = cssVarRe.exec(text)) !== null) {
    const name = m[1];
    if (!colors[name]) colors[name] = m[2];
  }

  // Strategy 3: "**Name** (`#hex`)" inline — shorter variant
  const inlineRe = /\*\*([A-Z][a-zA-Z0-9 ]{1,25})\*\*\s*\(`(#[0-9a-fA-F]{3,8})`\)/g;
  while ((m = inlineRe.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (name && name.length >= 2 && name.length <= 25 && !colors[name]) {
      colors[name] = m[2];
    }
  }

  // Strategy 4: Simple "Name: #hex" or "Name (#hex)" patterns
  const simpleRe = /(?:^|\n)\s*[-*]?\s*(?:\*\*)?([A-Z][a-zA-Z0-9 ]{1,20})(?:\*\*)?\s*(?:[:(])\s*`?(#[0-9a-fA-F]{6})`?\)?/g;
  while ((m = simpleRe.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (name && name.length >= 2 && name.length <= 20 && !colors[name]) {
      colors[name] = m[2];
    }
  }

  // Fallback: just grab first 8 unique hex colors from the document
  if (Object.keys(colors).length < 3) {
    const allHex = [...new Set([...text.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(m => m[0]))];
    const fallbackNames = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'muted', 'border'];
    allHex.slice(0, 8).forEach((hex, i) => {
      if (!Object.values(colors).includes(hex)) {
        colors[fallbackNames[i] || `color-${i}`] = hex;
      }
    });
  }

  // Limit to 20 colors
  return Object.fromEntries(Object.entries(colors).slice(0, 20));
}

function extractFonts(text) {
  let heading = 'Inter, system-ui, sans-serif';
  let body = 'Inter, system-ui, sans-serif';

  // Pattern: **Primary**: `FontName`, fallback...
  const primaryFontRe = /\*\*Primary\*\*[^`]*`([^`]+)`/i;
  const monoFontRe = /\*\*Monospace\*\*[^`]*`([^`]+)`/i;

  let m;
  if ((m = primaryFontRe.exec(text))) {
    const font = m[1].split(',')[0].trim();
    heading = `${font}, system-ui, sans-serif`;
    body = heading;
  }

  // Pattern: families: primary=X, display=Y, mono=Z
  const familyPrimaryRe = /primary=([^,\n]+)/i;
  const familyDisplayRe = /display=([^,\n]+)/i;
  if ((m = familyDisplayRe.exec(text))) {
    heading = `${m[1].trim()}, system-ui, sans-serif`;
  }
  if ((m = familyPrimaryRe.exec(text))) {
    body = `${m[1].trim()}, system-ui, sans-serif`;
  }

  // Pattern: font-family: 'FontName', fallback
  const ffRe = /font-family\s*[:{]\s*['"]?([A-Za-z][A-Za-z0-9 -]+)['"]?/g;
  const foundFonts = [];
  while ((m = ffRe.exec(text)) !== null) {
    const f = m[1].trim();
    if (f.length > 2 && f.length < 40 && !f.includes('inherit')) {
      foundFonts.push(f);
    }
  }
  if (foundFonts.length >= 1 && !primaryFontRe.test(text) && !familyDisplayRe.test(text)) {
    heading = `${foundFonts[0]}, system-ui, sans-serif`;
    body = foundFonts.length >= 2 ? `${foundFonts[1]}, system-ui, sans-serif` : heading;
  }

  return { heading, body };
}

function extractSpacing(text) {
  // Pattern: spacing scale: 4/8/12/16/24/32
  const scaleRe = /spacing\s*(?:scale)?[:\s]*(\d+)\s*[/,]\s*(\d+)\s*[/,]\s*(\d+)\s*[/,]\s*(\d+)/i;
  const m = scaleRe.exec(text);
  if (m) {
    return {
      unit: m[1] + 'px',
      values: {
        'xs': m[1] + 'px',
        'sm': m[2] + 'px',
        'md': m[3] + 'px',
        'lg': m[4] + 'px',
        'xl': (parseInt(m[4]) * 2) + 'px',
      }
    };
  }

  // Pattern: unit: Xpx or base: Xpx
  const unitRe = /(?:base|unit)[:\s]*(\d+)\s*px/i;
  const um = unitRe.exec(text);
  const base = um ? parseInt(um[1]) : 8;

  return {
    unit: base + 'px',
    values: {
      'xs': (base / 2) + 'px',
      'sm': base + 'px',
      'md': (base * 2) + 'px',
      'lg': (base * 3) + 'px',
      'xl': (base * 4) + 'px',
      '2xl': (base * 6) + 'px',
    }
  };
}

function extractRadius(text) {
  // Look for border-radius or radius values in px
  const radiusRe = /(?:border-)?radius[:\s]*(\d+)\s*px/gi;
  const values = new Set();
  let m;
  while ((m = radiusRe.exec(text)) !== null) {
    values.add(parseInt(m[1]));
  }

  // Also look for Radius: Xpx patterns
  const radiusLineRe = /(\d+)px\s*(?:[-–]|for|:)\s*(?:sm|md|lg|xl|small|medium|large|button|card|input)/gi;
  while ((m = radiusLineRe.exec(text)) !== null) {
    values.add(parseInt(m[1]));
  }

  if (values.size >= 2) {
    const sorted = [...values].sort((a, b) => a - b);
    const result = {};
    const names = ['sm', 'md', 'lg', 'xl', '2xl'];
    sorted.slice(0, 5).forEach((v, i) => {
      result[names[i]] = v + 'px';
    });
    result['full'] = '999px';
    return result;
  }

  return { 'sm': '4px', 'md': '8px', 'lg': '12px', 'xl': '16px', 'full': '999px' };
}

function extractDescription(text) {
  // > Category: X\n> Description line
  const lines = text.split('\n');
  let category = '';
  let desc = '';
  for (const line of lines.slice(0, 10)) {
    const catM = line.match(/>\s*Category:\s*(.+)/);
    if (catM) { category = catM[1].trim(); continue; }
    const descM = line.match(/>\s*([^>].{5,})/);
    if (descM && !desc) { desc = descM[1].trim(); }
  }
  if (category && desc) return `${category}. ${desc}`;
  if (category) return category;
  if (desc) return desc;
  return '';
}

function toConstName(id) {
  return id.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') + '_PACKAGE';
}

function toPascalName(id) {
  return id.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateIndexTs(id, designMd) {
  const colors = extractHexColors(designMd);
  const fonts = extractFonts(designMd);
  const spacing = extractSpacing(designMd);
  const radius = extractRadius(designMd);
  const description = extractDescription(designMd);
  const constName = toConstName(id);
  const displayName = toPascalName(id);

  const colorsStr = Object.entries(colors)
    .map(([k, v]) => `      '${k}': '${v}'`)
    .join(',\n');

  const spacingStr = Object.entries(spacing.values)
    .map(([k, v]) => `      '${k}': '${v}'`)
    .join(',\n');

  const radiusStr = Object.entries(radius)
    .map(([k, v]) => `      '${k}': '${v}'`)
    .join(',\n');

  return `// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const ${constName}: DesignSystemPackage = {
  id: '${id}',
  name: '${displayName}',
  version: '1.0.0',
  description: '${description.replace(/'/g, "\\'")}',

  tokens: {
    colors: {
${colorsStr}
    },
    spacing: {
      unit: '${spacing.unit}',
      values: {
${spacingStr}
      },
    },
    typography: {
      fontFamily: {
        heading: '${fonts.heading.replace(/'/g, "\\'")}',
        body: '${fonts.body.replace(/'/g, "\\'")}',
      },
      sizes: {
        'xs': '11px',
        'sm': '12px',
        'base': '14px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
      },
      weights: {
        'normal': '400',
        'medium': '500',
        'bold': '700',
      },
      lineHeights: {
        'tight': '1.1',
        'normal': '1.5',
        'relaxed': '1.75',
      },
    },
    radius: {
${radiusStr}
    },
    shadows: {
      'sm': '0 1px 2px rgba(0,0,0,0.05)',
      'md': '0 4px 6px rgba(0,0,0,0.1)',
      'lg': '0 10px 15px rgba(0,0,0,0.15)',
    },
    opacity: {
      'subtle': '0.05',
      'light': '0.1',
      'medium': '0.2',
      'strong': '0.4',
    },
  },

  components: [],

  reference: {
    html: '',
  },

  constraints: {
    enforce: [],
    forbid: [],
  },
};
`;
}

// --- Main ---
async function main() {
  const entries = (await readdir(SOURCE_DIR)).filter(e => e !== 'README.md').sort();
  console.log(`Found ${entries.length} brand directories in Open Design`);

  let success = 0;
  let failed = 0;
  const generated = [];

  for (const entry of entries) {
    const srcDir = join(SOURCE_DIR, entry);
    const srcStat = await stat(srcDir).catch(() => null);
    if (!srcStat?.isDirectory()) continue;

    const designMdPath = join(srcDir, 'DESIGN.md');
    let designMd;
    try {
      designMd = await readFile(designMdPath, 'utf-8');
    } catch {
      console.warn(`  SKIP ${entry}: no DESIGN.md`);
      failed++;
      continue;
    }

    // Skip dark-sci-fi — already exists as built-in
    if (entry === 'dark-sci-fi') {
      console.log(`  SKIP ${entry}: already exists as built-in`);
      continue;
    }

    const targetDir = join(TARGET_DIR, entry);
    await mkdir(targetDir, { recursive: true });

    // Copy DESIGN.md as design.md
    await writeFile(join(targetDir, 'design.md'), designMd);

    // Generate index.ts
    const indexTs = generateIndexTs(entry, designMd);
    await writeFile(join(targetDir, 'index.ts'), indexTs);

    generated.push(entry);
    success++;
  }

  console.log(`\nGenerated: ${success}, Failed: ${failed}, Total dirs: ${entries.length}`);

  // Generate packages/index.ts that re-exports all
  const exports = ['dark-sci-fi', ...generated].sort().map(id => {
    const constName = toConstName(id);
    return `export { ${constName} } from './${id}/index.js';`;
  }).join('\n');

  const indexContent = `// FR-H05: Auto-generated package index — all brand packages\n${exports}\n`;
  await writeFile(join(TARGET_DIR, 'index.ts'), indexContent);
  console.log(`Updated packages/index.ts with ${generated.length + 1} exports`);

  // Print sample for verification
  console.log('\n--- Sample: stripe colors ---');
  const stripeMd = await readFile(join(SOURCE_DIR, 'stripe', 'DESIGN.md'), 'utf-8');
  const stripeColors = extractHexColors(stripeMd);
  console.log(JSON.stringify(stripeColors, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
