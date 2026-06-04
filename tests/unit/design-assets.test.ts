import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DESIGN_SYSTEM_ID,
  DesignAssetLibrary,
} from '../../src/design-system/design-assets.js';

const customDesignMd = `# Focused Design System

## Design System Name
Focused Design System

## Applicable Scenarios
- Focused product artifacts and operational views.

## Brand Colors / Palette
- Canvas: #fafafa
- Surface: #ffffff
- Primary: #0ea5e9
- Accent: #22c55e
- Text: #111827

## Font Stack
- Heading: Inter, ui-sans-serif, system-ui, sans-serif
- Body: Inter, ui-sans-serif, system-ui, sans-serif

## Type Scale
- Body: 16px / 24px
- Page title: 40px / 48px

## Spacing System
- Base unit: 8px
- Standard gap: 16px
- Radius medium: 8px

## Component Library Path or Component Description
- Use .cd-card and .cd-button components.

## Layout Constraints
- Use an 8px spacing rhythm.
- Keep card radius at 8px or less.

## Reference Examples
- A neutral page using blue actions and green highlights.

## Forbidden Rules
- Do not use colors outside the palette.
- Do not scale fonts with viewport width.
`;

describe('DesignAssetLibrary (FR-H09)', () => {
  it('AC1+AC2: exposes a built-in default DESIGN.md with the required format', async () => {
    const library = new DesignAssetLibrary();
    const asset = await library.get(DEFAULT_DESIGN_SYSTEM_ID);

    expect(asset).not.toBeNull();
    expect(asset?.source).toBe('built-in');
    expect(asset?.content).toContain('## Brand Colors / Palette');
    expect(asset?.content).toContain('## Forbidden Rules');
    expect(library.validate(asset?.content ?? '').valid).toBe(true);
  });

  it('AC3: creates, saves, lists, selects, and switches custom DESIGN.md assets', async () => {
    const userAssetsDir = await mkdtemp(join(tmpdir(), 'claw-design-assets-'));
    const library = new DesignAssetLibrary({ userAssetsDir });

    const saved = await library.create('focused', customDesignMd);
    const selected = await library.select('focused');
    const listed = await library.list();
    const persisted = await readFile(join(userAssetsDir, 'focused', 'DESIGN.md'), 'utf-8');

    expect(saved.id).toBe('focused');
    expect(selected.name).toBe('Focused Design System');
    expect(listed.map(asset => asset.id)).toContain('focused');
    expect((await library.getActive()).id).toBe('focused');
    expect(persisted).toContain('Focused Design System');

    await library.select(DEFAULT_DESIGN_SYSTEM_ID);
    expect((await library.getActive()).id).toBe(DEFAULT_DESIGN_SYSTEM_ID);
  });

  it('P1-1: rejects asset ids that can escape the custom asset directory', async () => {
    const userAssetsDir = await mkdtemp(join(tmpdir(), 'claw-design-assets-'));
    const library = new DesignAssetLibrary({ userAssetsDir });
    const unsafeIds = ['../escape', 'a/../../escape', '/tmp/escape', 'nested/asset', 'nested\\asset', '..hidden', 'bad id'];

    for (const id of unsafeIds) {
      await expect(library.create(id, customDesignMd)).rejects.toThrow(/Invalid DESIGN\.md asset id/);
      await expect(library.get(id)).rejects.toThrow(/Invalid DESIGN\.md asset id/);
      await expect(library.select(id)).rejects.toThrow(/Invalid DESIGN\.md asset id/);
    }
  });

  it('AC4: converts DESIGN.md into prompt context, generation constraints, quality rules, and delivery notes', async () => {
    const userAssetsDir = await mkdtemp(join(tmpdir(), 'claw-design-assets-'));
    const library = new DesignAssetLibrary({ userAssetsDir });
    await library.create('focused', customDesignMd);

    const resolved = await library.resolveForSkill('slides', { designSystemId: 'focused' });

    expect(resolved.promptContext).toContain('## DESIGN.md Asset Context');
    expect(resolved.promptContext).toContain('Focused Design System');
    expect(resolved.generationConstraints.join('\n')).toContain('#0ea5e9');
    expect(resolved.qualityRules.some(rule => rule.rule === 'design-md:loaded')).toBe(true);
    expect(resolved.deliveryNotes.join('\n')).toContain('Focused Design System');
  });

  it('AC5: loads the DESIGN.md declared by SKILL.md and falls back with a clear gap when missing', async () => {
    const library = new DesignAssetLibrary();

    const fromSkill = await library.resolveForSkill('slides');
    const missing = await library.resolveForSkill('slides', { designSystemId: 'missing-system' });

    expect(fromSkill.asset.id).toBe(DEFAULT_DESIGN_SYSTEM_ID);
    expect(missing.asset.id).toBe(DEFAULT_DESIGN_SYSTEM_ID);
    expect(missing.gapMessage).toContain('missing-system');
    expect(missing.qualityRules.some(rule => rule.rule === 'design-md:fallback')).toBe(true);
  });

  it('AC6: checks DESIGN.md compliance across colors, fonts, spacing, components, and layout constraints', async () => {
    const library = new DesignAssetLibrary();
    const asset = await library.getActive();

    const html = `
      <section class="cd-card" style="color:#ff00ff; font-family: Papyrus; margin: 13px; border-radius: 24px; font-size: 5vw; background: linear-gradient(red, blue)">
        <div class="cd-card"><button class="cd-fancy">bad</button></div>
      </section>
    `;
    const items = library.checkHtml(html, asset, 'task-design');
    const failedRules = items.filter(item => !item.passed).map(item => item.rule);

    expect(failedRules).toEqual(expect.arrayContaining([
      'design-md:color-palette',
      'design-md:font-stack',
      'design-md:spacing-rhythm',
      'design-md:component-library',
      'design-md:layout-constraints',
    ]));
    expect(new Set(items.map(item => item.rule)).size).toBeGreaterThanOrEqual(5);
  });
});
