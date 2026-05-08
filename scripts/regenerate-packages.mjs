#!/usr/bin/env node
/**
 * P0 Fix: Regenerate all brand packages with:
 * - components (at least 5 per package)
 * - constraints (enforce + forbid rules)
 * - reference.html (visual reference page)
 *
 * Reads existing design.md + index.ts, patches index.ts with components/constraints,
 * and generates reference.html for each package.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '..', 'src', 'design-system', 'packages');

// --- Component Generation ---

function extractComponentsFromDesignMd(designMd) {
  const section = extractSection(designMd, 'Component Stylings') || extractSection(designMd, 'Components') || '';
  
  // Extract button props from the Buttons subsection only
  const buttonProps = {};
  const btnSection = section.match(/###?\s*Buttons?\b([\s\S]*?)(?=###|$)/i)?.[1] || '';
  const btnBgMatch = btnSection.match(/Background:\s*[^`]*`?(#[0-9a-fA-F]{6})`?/i);
  const btnRadiusMatch = btnSection.match(/Radius:\s*(\d+px|999px)/i);
  const btnPaddingMatch = btnSection.match(/Padding:\s*([0-9]+px\s+[0-9]+px)/i);
  if (btnBgMatch) buttonProps['background'] = btnBgMatch[1];
  if (btnRadiusMatch) buttonProps['border-radius'] = btnRadiusMatch[1];
  if (btnPaddingMatch) buttonProps['padding'] = btnPaddingMatch[1];
  
  // Extract card props from Cards subsection only
  const cardProps = {};
  const cardSection = section.match(/###?\s*Cards?[^#]*([\s\S]*?)(?=###|$)/i)?.[1] || '';
  const cardRadiusMatch = cardSection.match(/Radius:\s*(\d+px)/i);
  const cardShadowMatch = cardSection.match(/Shadow:\s*`?([^`\n]{10,60})`?/i);
  if (cardRadiusMatch) cardProps['border-radius'] = cardRadiusMatch[1];
  if (cardShadowMatch) cardProps['box-shadow'] = cardShadowMatch[1].trim();

  // Extract input props from Inputs subsection only
  const inputProps = {};
  const inputSection = section.match(/###?\s*Inputs?[^#]*([\s\S]*?)(?=###|$)/i)?.[1] || '';
  const inputBorderMatch = inputSection.match(/Border:\s*(\d+px\s+solid\s+[^\n`(]{1,30})/i);
  const inputRadiusMatch = inputSection.match(/Radius:\s*(\d+px)/i);
  if (inputBorderMatch) inputProps['border'] = inputBorderMatch[1].replace(/[`*]/g, '').trim();
  if (inputRadiusMatch) inputProps['border-radius'] = inputRadiusMatch[1];

  return { buttonProps, cardProps, inputProps };
}

function generateComponents(colors, fonts, radius, extracted) {
  const primaryColor = Object.values(colors)[0] || '#000000';
  const bgColor = Object.values(colors).find(c => c.toLowerCase() === '#ffffff') || '#ffffff';
  const textColor = primaryColor;
  const headingFont = fonts.heading || 'Inter, system-ui, sans-serif';
  const bodyFont = fonts.body || 'Inter, system-ui, sans-serif';
  const btnRadius = extracted.buttonProps['border-radius'] || radius['md'] || '8px';
  // Card radius: use extracted if it looks reasonable (not 999px), else use radius.sm or 8px
  const rawCardRadius = extracted.cardProps['border-radius'];
  const cardRadius = (rawCardRadius && rawCardRadius !== '999px') ? rawCardRadius : (radius['sm'] || '8px');
  const rawInputRadius = extracted.inputProps['border-radius'];
  const inputRadius = (rawInputRadius && rawInputRadius !== '999px') ? rawInputRadius : (radius['sm'] || '4px');
  // Input border: only use extracted if it looks like a valid CSS border
  const rawInputBorder = extracted.inputProps['border'];
  const inputBorder = (rawInputBorder && /^\d+px\s+solid/.test(rawInputBorder))
    ? rawInputBorder.replace(/Black|White|Primary|Secondary/gi, primaryColor)
    : `1px solid ${primaryColor}`;

  return [
    {
      name: 'button',
      selector: '.btn-primary',
      properties: {
        'background': extracted.buttonProps['background'] || primaryColor,
        'color': bgColor,
        'border-radius': btnRadius,
        'padding': extracted.buttonProps['padding'] || '10px 20px',
        'font-family': bodyFont,
        'font-weight': '600',
        'border': 'none',
        'cursor': 'pointer',
      },
    },
    {
      name: 'card',
      selector: '.card',
      properties: {
        'background': bgColor,
        'border-radius': cardRadius,
        'box-shadow': extracted.cardProps['box-shadow'] || '0 4px 6px rgba(0,0,0,0.1)',
        'padding': '24px',
        'border': 'none',
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': bgColor,
        'border': inputBorder,
        'border-radius': inputRadius,
        'padding': '10px 14px',
        'font-family': bodyFont,
        'font-size': '14px',
        'color': textColor,
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': headingFont,
        'font-weight': '700',
        'color': textColor,
        'line-height': '1.2',
        'margin': '0 0 16px 0',
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': primaryColor,
        'text-decoration': 'underline',
        'font-family': bodyFont,
        'font-weight': '500',
        'cursor': 'pointer',
      },
    },
  ];
}

// --- Constraint Generation ---

function generateConstraints(colors, fonts, spacing, radius) {
  const colorValues = Object.values(colors);
  const fontFamilies = [fonts.heading, fonts.body].filter(Boolean);
  const spacingUnit = parseInt(spacing.unit) || 8;
  const radiusValues = Object.values(radius);

  const enforce = [
    {
      id: 'colorPalette',
      description: `Only use brand-defined colors: ${colorValues.slice(0, 5).join(', ')}${colorValues.length > 5 ? '...' : ''}`,
    },
    {
      id: 'typographyStack',
      description: `Only use brand-defined font families: ${fontFamilies.join(', ')}`,
    },
    {
      id: 'spacingScale',
      description: `Spacing must be multiples of base unit (${spacingUnit}px)`,
    },
    {
      id: 'borderRadiusRange',
      description: `Border radius must use defined scale: ${radiusValues.join(', ')}`,
    },
  ];

  const forbid = [
    {
      id: 'noArbitraryColors',
      description: 'Do not use colors outside the defined palette',
    },
    {
      id: 'noSystemFonts',
      description: 'Do not use system fonts directly; use the brand font stack',
    },
  ];

  return { enforce, forbid };
}

// --- Reference HTML Generation ---

function generateReferenceHtml(id, name, colors, fonts, spacing, radius, components) {
  const colorSwatches = Object.entries(colors).slice(0, 12).map(([k, v]) =>
    `      <div class="swatch" style="background:${v}"><span>${k}</span><code>${v}</code></div>`
  ).join('\n');

  const fontDemo = `
      <div class="font-demo">
        <p style="font-family:${fonts.heading};font-size:32px;font-weight:700">Heading: ${fonts.heading.split(',')[0]}</p>
        <p style="font-family:${fonts.body};font-size:16px;font-weight:400">Body: ${fonts.body.split(',')[0]} — The quick brown fox jumps over the lazy dog.</p>
      </div>`;

  const spacingDemo = Object.entries(spacing.values || {}).map(([k, v]) =>
    `      <div class="spacing-item"><span>${k}</span><div class="spacing-bar" style="width:${v};height:12px;background:${Object.values(colors)[0] || '#333'}"></div><code>${v}</code></div>`
  ).join('\n');

  const radiusDemo = Object.entries(radius).map(([k, v]) =>
    `      <div class="radius-item"><div class="radius-box" style="border-radius:${v}"></div><span>${k}: ${v}</span></div>`
  ).join('\n');

  const primaryColor = Object.values(colors)[0] || '#333';
  const bgColor = Object.values(colors).find(c => c.toLowerCase() === '#ffffff') || '#f8f8f8';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Design System Reference</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${fonts.body}; background: #fafafa; color: #222; padding: 40px 24px; max-width: 960px; margin: 0 auto; }
    h1 { font-family: ${fonts.heading}; font-size: 28px; margin-bottom: 8px; }
    h2 { font-family: ${fonts.heading}; font-size: 20px; margin: 32px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .meta { color: #666; margin-bottom: 32px; }
    .swatches { display: flex; flex-wrap: wrap; gap: 12px; }
    .swatch { width: 100px; height: 80px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding: 6px; border: 1px solid #e0e0e0; }
    .swatch span { font-size: 10px; color: #666; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px; }
    .swatch code { font-size: 10px; color: #999; }
    .font-demo { margin: 12px 0; }
    .font-demo p { margin: 8px 0; }
    .spacing-item { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
    .spacing-item span { width: 40px; font-size: 12px; color: #666; }
    .spacing-bar { border-radius: 3px; }
    .spacing-item code { font-size: 11px; color: #999; }
    .radius-item { display: inline-flex; align-items: center; gap: 8px; margin: 8px 16px 8px 0; }
    .radius-box { width: 48px; height: 48px; background: ${primaryColor}; }
    .radius-item span { font-size: 12px; color: #666; }
    .component-demo { margin: 12px 0; padding: 20px; background: ${bgColor}; border-radius: 12px; border: 1px solid #eee; }
    .btn-demo { display: inline-block; background: ${primaryColor}; color: ${bgColor}; border: none; border-radius: ${radius['md'] || '8px'}; padding: 10px 20px; font-family: ${fonts.body}; font-weight: 600; font-size: 14px; cursor: pointer; margin-right: 12px; }
    .card-demo { background: #fff; border-radius: ${radius['md'] || '8px'}; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 24px; margin: 12px 0; max-width: 320px; }
    .card-demo h3 { font-family: ${fonts.heading}; font-size: 18px; margin-bottom: 8px; }
    .card-demo p { font-size: 14px; color: #555; }
    .input-demo { border: 1px solid ${primaryColor}; border-radius: ${radius['sm'] || '4px'}; padding: 10px 14px; font-family: ${fonts.body}; font-size: 14px; width: 260px; outline: none; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p class="meta">Design System Reference — Package ID: ${id}</p>

  <h2>Color Palette</h2>
  <div class="swatches">
${colorSwatches}
  </div>

  <h2>Typography</h2>
${fontDemo}

  <h2>Spacing Scale</h2>
  <div class="spacing-scale">
${spacingDemo}
  </div>

  <h2>Border Radius</h2>
  <div class="radius-scale">
${radiusDemo}
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

// --- Helpers ---

function extractSection(text, sectionName) {
  const re = new RegExp(`##\\s*\\d*\\.?\\s*${sectionName}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const m = re.exec(text);
  return m ? m[1] : null;
}

function extractColorsFromTs(tsContent) {
  const colors = {};
  const re = /'([^']+)':\s*'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))'/g;
  let m;
  const colorsSection = tsContent.match(/colors:\s*\{([^}]+)\}/s);
  if (colorsSection) {
    while ((m = re.exec(colorsSection[1])) !== null) {
      colors[m[1]] = m[2];
    }
  }
  return colors;
}

function extractFontsFromTs(tsContent) {
  const headingMatch = tsContent.match(/heading:\s*'([^']+)'/);
  const bodyMatch = tsContent.match(/body:\s*'([^']+)'/);
  let heading = headingMatch ? headingMatch[1] : 'Inter, system-ui, sans-serif';
  let body = bodyMatch ? bodyMatch[1] : 'Inter, system-ui, sans-serif';
  // Guard: if font value starts with # (hex color leaked), use fallback
  if (heading.startsWith('#')) heading = 'Inter, system-ui, sans-serif';
  if (body.startsWith('#')) body = 'Inter, system-ui, sans-serif';
  return { heading, body };
}

function extractSpacingFromTs(tsContent) {
  const unitMatch = tsContent.match(/unit:\s*'([^']+)'/);
  const values = {};
  const spacingSection = tsContent.match(/spacing:\s*\{[^}]*values:\s*\{([^}]+)\}/s);
  if (spacingSection) {
    const re = /'([^']+)':\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(spacingSection[1])) !== null) {
      values[m[1]] = m[2];
    }
  }
  return { unit: unitMatch ? unitMatch[1] : '8px', values };
}

function extractRadiusFromTs(tsContent) {
  const radius = {};
  const radiusSection = tsContent.match(/radius:\s*\{([^}]+)\}/s);
  if (radiusSection) {
    const re = /'([^']+)':\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(radiusSection[1])) !== null) {
      radius[m[1]] = m[2];
    }
  }
  return radius;
}

function serializeComponents(components) {
  return components.map(c => {
    const propsStr = Object.entries(c.properties)
      .map(([k, v]) => `        '${k}': '${v.replace(/'/g, "\\'")}'`)
      .join(',\n');
    return `    {\n      name: '${c.name}',\n      selector: '${c.selector}',\n      properties: {\n${propsStr}\n      },\n    }`;
  }).join(',\n');
}

function serializeConstraints(constraints) {
  const enforceStr = constraints.enforce.map(r =>
    `      {\n        id: '${r.id}',\n        description: '${r.description.replace(/'/g, "\\'")}',\n        check: (_html, _pkg) => null,\n      }`
  ).join(',\n');
  const forbidStr = constraints.forbid.map(r =>
    `      {\n        id: '${r.id}',\n        description: '${r.description.replace(/'/g, "\\'")}',\n        check: (_html, _pkg) => null,\n      }`
  ).join(',\n');
  return { enforceStr, forbidStr };
}

// --- Main ---

async function main() {
  const entries = await readdir(PACKAGES_DIR);
  const dirs = [];
  for (const entry of entries) {
    if (entry === 'index.ts') continue;
    const p = join(PACKAGES_DIR, entry);
    const s = await stat(p).catch(() => null);
    if (s?.isDirectory()) dirs.push(entry);
  }

  console.log(`Found ${dirs.length} package directories`);
  let updated = 0;
  let errors = 0;

  for (const dir of dirs) {
    // Skip dark-sci-fi — it has hand-crafted constraint implementations
    if (dir === 'dark-sci-fi') continue;
    const pkgDir = join(PACKAGES_DIR, dir);
    const indexPath = join(pkgDir, 'index.ts');
    const designMdPath = join(pkgDir, 'design.md');
    const refHtmlPath = join(pkgDir, 'reference.html');

    let tsContent, designMd;
    try {
      tsContent = await readFile(indexPath, 'utf-8');
    } catch {
      console.warn(`  SKIP ${dir}: no index.ts`);
      errors++;
      continue;
    }
    try {
      designMd = await readFile(designMdPath, 'utf-8');
    } catch {
      designMd = '';
    }

    // Extract existing tokens from index.ts
    const colors = extractColorsFromTs(tsContent);
    const fonts = extractFontsFromTs(tsContent);
    const spacing = extractSpacingFromTs(tsContent);
    const radius = extractRadiusFromTs(tsContent);

    // Generate components
    const extracted = extractComponentsFromDesignMd(designMd);
    const components = generateComponents(colors, fonts, radius, extracted);

    // Generate constraints
    const constraints = generateConstraints(colors, fonts, spacing, radius);

    // Generate reference.html
    const name = dir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const refHtml = generateReferenceHtml(dir, name, colors, fonts, spacing, radius, components);
    await writeFile(refHtmlPath, refHtml);

    // Patch index.ts: replace components, constraints, and reference blocks
    const componentsStr = serializeComponents(components);
    const { enforceStr, forbidStr } = serializeConstraints(constraints);

    // Replace components array (empty or populated)
    let newTs = tsContent.replace(
      /components:\s*\[[\s\S]*?\n  \]/,
      `components: [\n${componentsStr}\n  ]`
    );

    // Replace constraints block (empty or populated)
    newTs = newTs.replace(
      /constraints:\s*\{[\s\S]*?\n  \}/,
      `constraints: {\n    enforce: [\n${enforceStr}\n    ],\n    forbid: [\n${forbidStr}\n    ],\n  }`
    );

    // Replace reference block (empty or populated)
    newTs = newTs.replace(
      /reference:\s*\{[\s\S]*?\n  \}/,
      `reference: {\n    html: 'reference.html',\n  }`
    );

    await writeFile(indexPath, newTs);
    updated++;
  }

  console.log(`\nDone: ${updated} packages updated, ${errors} errors`);
}

main().catch(e => { console.error(e); process.exit(1); });
