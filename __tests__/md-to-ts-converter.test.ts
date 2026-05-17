import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  extractTokens,
  extractColors,
  extractTypography,
  extractSpacing,
  extractComponents,
  convertFile,
} from '../src/tools/md-to-ts-converter.js';

// ─── extractSection / extractTokens P0 fix verification ─────────────────────

describe('extractTokens (P0: section body extraction)', () => {
  it('extracts non-empty colors from real design.md with "## 2. Color" heading', () => {
    const md = `# Design System

## 1. Visual Theme

Some theme description.

## 2. Color

- **Primary:** \`#3B82F6\` — Main brand color.
- **Secondary:** \`#8B5CF6\` — Accent color.
- **Surface:** \`#FFFFFF\` — Background.

## 3. Typography

- Scale: 12/14/16/20/24/32
`;
    const tokens = extractTokens(md);
    expect(Object.keys(tokens.colors).length).toBeGreaterThanOrEqual(3);
    expect(tokens.colors['primary']).toBe('#3B82F6');
    expect(tokens.colors['secondary']).toBe('#8B5CF6');
  });

  it('extracts section body (not just heading line)', () => {
    const md = `## 2. Color Palette & Roles

- **Meta Blue** (\`#0064E0\`): Primary CTA background
- **Meta Blue Hover** (\`#0143B5\`): Darkened blue for hover
- **Ray-Ban Red** (\`#D6311F\`): Product accent

## 3. Typography
`;
    const colors = extractColors(md);
    expect(Object.keys(colors).length).toBe(3);
    expect(colors['meta-blue']).toBe('#0064E0');
    expect(colors['meta-blue-hover']).toBe('#0143B5');
    expect(colors['ray-ban-red']).toBe('#D6311F');
  });
});

// ─── P1-1: Section alias matching ───────────────────────────────────────────

describe('section alias matching (P1-1)', () => {
  it('matches "## 2. Color" variant', () => {
    const md = `## 2. Color\n\n- **Red:** \`#FF0000\` — danger\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['red']).toBe('#FF0000');
  });

  it('matches "## 2. Color Palette" variant', () => {
    const md = `## 2. Color Palette\n\n- **Blue:** \`#0000FF\` — info\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['blue']).toBe('#0000FF');
  });

  it('matches "## Color Palette & Roles" without number prefix', () => {
    const md = `## Color Palette & Roles\n\n- **Green:** \`#00FF00\` — success\n\n## Typography\n`;
    const colors = extractColors(md);
    expect(colors['green']).toBe('#00FF00');
  });

  it('matches "## 6. Components" variant', () => {
    const md = `## 6. Components\n\n### Button\n\n- background: #3B82F6\n\n## 7. Motion\n`;
    const components = extractComponents(md);
    expect(components.length).toBeGreaterThanOrEqual(1);
    expect(components[0].name).toBe('button');
  });

  it('matches "## 4. Component Stylings" variant', () => {
    const md = `## 4. Component Stylings\n\n### Card\n\n- border-radius: 8px\n\n## 5. Layout\n`;
    const components = extractComponents(md);
    expect(components.length).toBeGreaterThanOrEqual(1);
    expect(components[0].name).toBe('card');
  });

  it('matches layout aliases for spacing extraction', () => {
    const md = `## 5. Layout & Composition\n\n- Spacing scale: 4/8/12/16/24/32\n\n## 6. Components\n`;
    const spacing = extractSpacing(md);
    expect(Object.keys(spacing.values).length).toBeGreaterThan(0);
  });
});

// ─── P1-2: Color format variations ─────────────────────────────────────────

describe('color format parsing (P1-2)', () => {
  it('parses **Name** (`#hex`): description format', () => {
    const md = `## 2. Color\n\n- **Rausch** (\`#ff385c\`): Primary brand\n- **Canvas White** (\`#ffffff\`): Background\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['rausch']).toBe('#ff385c');
    expect(colors['canvas-white']).toBe('#ffffff');
  });

  it('parses **Name:** `#hex` — description format', () => {
    const md = `## 2. Color\n\n- **Primary:** \`#3B82F6\` — Main brand color.\n- **Danger:** \`#DC2626\` — Error states.\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['primary']).toBe('#3B82F6');
    expect(colors['danger']).toBe('#DC2626');
  });

  it('parses Name: #hex format', () => {
    const md = `## 2. Color\n\n- Primary: #3B82F6\n- Secondary: #8B5CF6\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['primary']).toBe('#3B82F6');
    expect(colors['secondary']).toBe('#8B5CF6');
  });

  it('parses rgba format', () => {
    const md = `## 2. Color\n\n- Overlay: rgba(0, 0, 0, 0.5)\n\n## 3. Typography\n`;
    const colors = extractColors(md);
    expect(colors['overlay']).toBe('rgba(0, 0, 0, 0.5)');
  });
});

// ─── P1-3: Batch error isolation ────────────────────────────────────────────

describe('batch error isolation (P1-3)', () => {
  it('convertFile returns failure for empty file without throwing', async () => {
    const { writeFile: wf, mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'converter-test-'));
    const mdPath = join(dir, 'design.md');
    await wf(mdPath, '', 'utf-8');

    const result = await convertFile(mdPath);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    await rm(dir, { recursive: true });
  });

  it('convertFile returns failure for malformed markdown without writing index.ts', async () => {
    const { writeFile: wf, mkdtemp, rm, stat: fsStat } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'converter-test-'));
    const mdPath = join(dir, 'design.md');
    // Content with no recognizable sections
    await wf(mdPath, 'This is just random text without any design system sections or color definitions at all.', 'utf-8');

    const result = await convertFile(mdPath);
    expect(result.success).toBe(false);

    // Should NOT have written index.ts
    const indexExists = await fsStat(join(dir, 'index.ts')).then(() => true).catch(() => false);
    expect(indexExists).toBe(false);

    await rm(dir, { recursive: true });
  });
});

// ─── Real design.md integration test ────────────────────────────────────────

describe('real design.md extraction', () => {
  const packagesDir = join(__dirname, '..', 'src', 'design-system', 'packages');

  it('extracts non-empty tokens from refined/design.md', async () => {
    const content = await readFile(join(packagesDir, 'refined', 'design.md'), 'utf-8');
    const tokens = extractTokens(content);
    expect(Object.keys(tokens.colors).length).toBeGreaterThan(0);
    expect(tokens.typography.fontFamily.heading).not.toBe('Inter, system-ui, sans-serif');
  });

  it('extracts non-empty tokens from meta/design.md', async () => {
    const content = await readFile(join(packagesDir, 'meta', 'design.md'), 'utf-8');
    const tokens = extractTokens(content);
    expect(Object.keys(tokens.colors).length).toBeGreaterThan(3);
    expect(tokens.colors['meta-blue']).toBe('#0064E0');
  });

  it('extracts typography with Families: format', async () => {
    const content = await readFile(join(packagesDir, 'refined', 'design.md'), 'utf-8');
    const tokens = extractTokens(content);
    // refined uses "Families: primary=Playfair Display, ..."
    expect(tokens.typography.fontFamily.heading).toContain('Playfair Display');
  });

  it('extracts spacing scale from "Spacing scale: 4/8/12/16/24/32" format', async () => {
    const content = await readFile(join(packagesDir, 'refined', 'design.md'), 'utf-8');
    const tokens = extractTokens(content);
    expect(Object.keys(tokens.spacing.values).length).toBeGreaterThan(0);
  });
});
