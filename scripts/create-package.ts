#!/usr/bin/env node
/**
 * FR-H06 AC2: Create a new brand package scaffold.
 * Usage: npx tsx scripts/create-package.ts <brand-name>
 *
 * Generates the three-file structure:
 *   packages/<brand-name>/design.md   — template
 *   packages/<brand-name>/index.ts    — skeleton
 *   packages/<brand-name>/reference.html — template
 */

import { writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const PACKAGES_DIR = resolve(import.meta.dirname, '..', 'src', 'design-system', 'packages');

function toConstName(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') + '_PACKAGE';
}

function toPascalName(id: string): string {
  return id.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateDesignMdTemplate(name: string): string {
  return `# Design System Inspired by ${name}

> Category: [Category]
> [Brief description of the brand's design language]

## 1. Visual Theme & Atmosphere

[Describe the overall visual feel, mood, and design philosophy]

## 2. Color Palette & Roles

### Primary
- **Primary** (\`#000000\`): [Role description]
- **Background** (\`#ffffff\`): [Role description]

### Secondary
- **Accent** (\`#0066ff\`): [Role description]

### Text & Content
- **Body Text** (\`#333333\`): [Role description]
- **Muted** (\`#666666\`): [Role description]

## 3. Typography Rules

### Font Family
- **Headline / Display**: \`Inter, system-ui, sans-serif\`
- **Body / UI**: \`Inter, system-ui, sans-serif\`

### Hierarchy

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| Display | Inter | 48px | 700 | 1.1 |
| Heading | Inter | 32px | 700 | 1.2 |
| Body | Inter | 16px | 400 | 1.5 |
| Small | Inter | 14px | 400 | 1.4 |

## 4. Component Stylings

### Buttons
**Primary**
- Background: \`#000000\`
- Text: \`#ffffff\`
- Padding: 12px 24px
- Radius: 8px

### Cards & Containers
- Background: \`#ffffff\`
- Radius: 12px
- Shadow: \`0 4px 6px rgba(0,0,0,0.1)\`

### Inputs & Forms
- Border: 1px solid \`#cccccc\`
- Radius: 6px
- Padding: 10px 14px

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 4px, 8px, 16px, 24px, 32px, 48px

### Border Radius Scale
- Small: 4px
- Medium: 8px
- Large: 12px
- Full: 999px

## 6. Depth & Elevation

- Level 1: \`0 1px 2px rgba(0,0,0,0.05)\`
- Level 2: \`0 4px 6px rgba(0,0,0,0.1)\`
- Level 3: \`0 10px 15px rgba(0,0,0,0.15)\`

## 7. Imagery & Illustration

[Describe image treatment, illustration style, photography direction]

## 8. Accessibility Notes

- Minimum contrast ratio: 4.5:1 for body text
- Focus indicators: visible outline on all interactive elements
- Touch targets: minimum 44x44px

## 9. Brand Voice in UI

[Describe the tone of microcopy, button labels, error messages]
`;
}

function generateIndexTsTemplate(id: string, name: string): string {
  const constName = toConstName(id);
  return `// FR-H05: Brand package — ${name}
import type { DesignSystemPackage } from '../../types.js';

export const ${constName}: DesignSystemPackage = {
  id: '${id}',
  name: '${name}',
  version: '1.0.0',
  description: '',

  tokens: {
    colors: {
      'primary': '#000000',
      'background': '#ffffff',
      'accent': '#0066ff',
      'text': '#333333',
      'muted': '#666666',
    },
    spacing: {
      unit: '8px',
      values: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
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
      'sm': '4px',
      'md': '8px',
      'lg': '12px',
      'full': '999px',
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

  components: [
    {
      name: 'button',
      selector: '.btn-primary',
      properties: {
        'background': '#000000',
        'color': '#ffffff',
        'border-radius': '8px',
        'padding': '12px 24px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '600',
        'border': 'none',
        'cursor': 'pointer',
      },
    },
    {
      name: 'card',
      selector: '.card',
      properties: {
        'background': '#ffffff',
        'border-radius': '12px',
        'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
        'padding': '24px',
        'border': 'none',
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #cccccc',
        'border-radius': '6px',
        'padding': '10px 14px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#333333',
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#000000',
        'line-height': '1.2',
        'margin': '0 0 16px 0',
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#0066ff',
        'text-decoration': 'underline',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '500',
        'cursor': 'pointer',
      },
    },
  ],

  reference: {
    html: 'reference.html',
  },

  constraints: {
    enforce: [
      {
        id: 'colorPalette',
        description: 'Only use brand-defined colors',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale values',
        check: (_html, _pkg) => null,
      },
    ],
    forbid: [
      {
        id: 'noArbitraryColors',
        description: 'Do not use colors outside the defined palette',
        check: (_html, _pkg) => null,
      },
      {
        id: 'noSystemFonts',
        description: 'Do not use system fonts directly; use the brand font stack',
        check: (_html, _pkg) => null,
      },
    ],
  },
};
`;
}

function generateReferenceHtmlTemplate(id: string, name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Design System Reference</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #fafafa; color: #222; padding: 40px 24px; max-width: 960px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin: 32px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .meta { color: #666; margin-bottom: 32px; }
    .swatches { display: flex; flex-wrap: wrap; gap: 12px; }
    .swatch { width: 100px; height: 80px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding: 6px; border: 1px solid #e0e0e0; }
    .swatch span { font-size: 10px; color: #666; }
    .swatch code { font-size: 10px; color: #999; }
    .component-demo { margin: 12px 0; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #eee; }
    .btn-demo { display: inline-block; background: #000; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; cursor: pointer; }
    .card-demo { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 24px; margin: 12px 0; max-width: 320px; }
    .card-demo h3 { font-size: 18px; margin-bottom: 8px; }
    .card-demo p { font-size: 14px; color: #555; }
    .input-demo { border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px; font-size: 14px; width: 260px; outline: none; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p class="meta">Design System Reference — Package ID: ${id}</p>

  <h2>Color Palette</h2>
  <div class="swatches">
    <div class="swatch" style="background:#000000"><span>primary</span><code>#000000</code></div>
    <div class="swatch" style="background:#ffffff"><span>background</span><code>#ffffff</code></div>
    <div class="swatch" style="background:#0066ff"><span>accent</span><code>#0066ff</code></div>
    <div class="swatch" style="background:#333333"><span>text</span><code>#333333</code></div>
    <div class="swatch" style="background:#666666"><span>muted</span><code>#666666</code></div>
  </div>

  <h2>Components</h2>
  <div class="component-demo">
    <p style="margin-bottom:12px"><strong>Button</strong></p>
    <button class="btn-demo">Primary Action</button>
  </div>
  <div class="component-demo">
    <p style="margin-bottom:12px"><strong>Card</strong></p>
    <div class="card-demo">
      <h3>Card Title</h3>
      <p>Card content with brand typography and spacing.</p>
    </div>
  </div>
  <div class="component-demo">
    <p style="margin-bottom:12px"><strong>Input</strong></p>
    <input class="input-demo" type="text" placeholder="Text input..." />
  </div>
</body>
</html>`;
}

// --- Main ---

async function main(): Promise<void> {
  const brandName = process.argv[2];

  if (!brandName) {
    console.error('Usage: npx tsx scripts/create-package.ts <brand-name>');
    console.error('');
    console.error('  <brand-name>: lowercase kebab-case brand identifier (e.g., "my-brand")');
    console.error('');
    console.error('Creates a new brand package with three files:');
    console.error('  src/design-system/packages/<brand-name>/design.md');
    console.error('  src/design-system/packages/<brand-name>/index.ts');
    console.error('  src/design-system/packages/<brand-name>/reference.html');
    process.exit(1);
  }

  // Validate brand name
  if (!/^[a-z][a-z0-9-]*$/.test(brandName)) {
    console.error(`Error: Brand name must be lowercase kebab-case (e.g., "my-brand"). Got: "${brandName}"`);
    process.exit(1);
  }

  const packageDir = join(PACKAGES_DIR, brandName);

  // Check if already exists
  const exists = await stat(packageDir).then(() => true).catch(() => false);
  if (exists) {
    console.error(`Error: Package "${brandName}" already exists at ${packageDir}`);
    process.exit(1);
  }

  const displayName = toPascalName(brandName);

  // Create directory
  await mkdir(packageDir, { recursive: true });

  // Generate files
  await writeFile(join(packageDir, 'design.md'), generateDesignMdTemplate(displayName));
  await writeFile(join(packageDir, 'index.ts'), generateIndexTsTemplate(brandName, displayName));
  await writeFile(join(packageDir, 'reference.html'), generateReferenceHtmlTemplate(brandName, displayName));

  console.log(`✓ Created brand package: ${brandName}`);
  console.log(`  ${packageDir}/design.md`);
  console.log(`  ${packageDir}/index.ts`);
  console.log(`  ${packageDir}/reference.html`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Edit design.md with the brand\'s design language');
  console.log('  2. Run the converter to regenerate index.ts from design.md');
  console.log('  3. Update packages/index.ts to export the new package');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
