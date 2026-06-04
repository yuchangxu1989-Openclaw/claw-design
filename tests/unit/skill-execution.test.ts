import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { DesignAssetLibrary } from '../../src/design-system/design-assets.js';
import { SkillExecutor, buildArtifact, DEFAULT_THEME } from '../../src/execution/skill-executor.js';
import { discoverSkillsFromDir } from '../../src/execution/skill-registry.js';
import { IntentRouter } from '../../src/routing/intent-router.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import type { Artifact, DesignSkill, IntentPacket } from '../../src/types.js';

function makeSkill(name: string): DesignSkill {
  return {
    contract: {
      name,
      artifactType: 'slides',
      description: `${name} description`,
      triggerKeywords: ['slides'],
    },
    async generate(input, _theme, context): Promise<Artifact> {
      return {
        taskId: String(context.taskId),
        type: 'slides',
        status: 'ready',
        html: `<html><body>${input}</body></html>`,
        pages: 1,
        metadata: { context },
      };
    },
  };
}

function makeIntent(overrides: Partial<IntentPacket> = {}): IntentPacket {
  return {
    taskId: 'task-skill',
    primaryType: 'slides',
    secondaryTypes: [],
    confidence: 1,
    gaps: [],
    context: { locale: 'zh-CN' },
    matchedSkill: 'slides-skill',
    ...overrides,
  };
}

describe('Skill executor and registry', () => {
  it('executes the matched skill with taskId injected into context', async () => {
    const router = new IntentRouter();
    router.register(makeSkill('slides-skill'));
    const executor = new SkillExecutor(router);

    const artifact = await executor.execute(makeIntent(), 'Build this', DEFAULT_THEME);

    expect(artifact.taskId).toBe('task-skill');
    expect(artifact.metadata).toEqual({
      context: expect.objectContaining({
        locale: 'zh-CN',
        taskId: 'task-skill',
        designSystemId: 'general',
        designSystemName: 'General Purpose Design System',
        designMdContext: expect.stringContaining('DESIGN.md Asset Context'),
      }),
      designSystem: expect.objectContaining({
        id: 'general',
        promptContext: expect.stringContaining('General Purpose Design System'),
      }),
      designSystemQualityReport: expect.objectContaining({
        taskId: 'task-skill',
      }),
    });
  });

  it('injects custom DESIGN.md context into the skill prompt context and theme', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claw-design-assets-'));
    const library = new DesignAssetLibrary({ userAssetsDir: dir });
    await library.create('custom', `# Custom System

## Design System Name
Custom System

## Applicable Scenarios
- General generated artifacts.

## Brand Colors / Palette
- Canvas: #ffffff
- Surface: #f8fafc
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
- Use .cd-card components.

## Layout Constraints
- Use an 8px spacing rhythm.

## Reference Examples
- A clean blue and green page.

## Forbidden Rules
- Do not use colors outside the palette.
`);

    const skill: DesignSkill = {
      contract: {
        name: 'slides-skill',
        artifactType: 'slides',
        description: 'slides',
        triggerKeywords: ['slides'],
      },
      async generate(_input, theme, context): Promise<Artifact> {
        return {
          taskId: String(context.taskId),
          type: 'slides',
          status: 'ready',
          html: `<html><body style="color:${theme.colorPrimary}">${context.designMdContext}</body></html>`,
          pages: 1,
          metadata: { context, theme },
        };
      },
    };
    const router = new IntentRouter();
    router.register(skill);
    const executor = new SkillExecutor(router, library);

    const artifact = await executor.execute(
      makeIntent({ context: { designSystemId: 'custom' } }),
      'Build this',
      DEFAULT_THEME,
    );

    expect(artifact.metadata.context).toEqual(expect.objectContaining({
      designSystemId: 'custom',
      designMdContext: expect.stringContaining('Custom System'),
    }));
    expect(artifact.metadata.theme).toEqual(expect.objectContaining({
      colorPrimary: '#0ea5e9',
      baselineLabel: 'Custom System',
    }));
    expect(artifact.metadata.designSystemQualityReport).toEqual(expect.objectContaining({
      conclusion: 'pass',
    }));
  });

  it('throws when no matched skill is present on the intent packet', async () => {
    const executor = new SkillExecutor(new IntentRouter());

    await expect(executor.execute(makeIntent({ matchedSkill: null }), 'noop')).rejects.toThrow(
      'No skill matched for task task-skill',
    );
  });

  it('throws when the matched skill is not registered', async () => {
    const executor = new SkillExecutor(new IntentRouter());

    await expect(executor.execute(makeIntent(), 'noop')).rejects.toThrow(
      'Skill "slides-skill" not found in registry',
    );
  });

  it('registers skills by name and artifact type', () => {
    const registry = new SkillRegistry();
    const slides = makeSkill('slides-skill');

    registry.register(slides);

    expect(registry.getByName('slides-skill')).toBe(slides);
    expect(registry.getByArtifactType('slides')).toEqual([slides]);
    expect(registry.listNames()).toEqual(['slides-skill']);
  });

  it('buildArtifact returns a ready artifact with generated metadata', () => {
    const artifact = buildArtifact('task-42', 'chart', '<html></html>', 3, { source: 'unit-test' });

    expect(artifact).toMatchObject({
      taskId: 'task-42',
      type: 'chart',
      status: 'ready',
      pages: 3,
      metadata: { source: 'unit-test' },
    });
    expect(typeof artifact.metadata.generatedAt).toBe('string');
  });

  it('discovers default-exported skill instances from a directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claw-design-skills-'));
    await writeFile(
      join(dir, 'slides-skill.mjs'),
      `export default {
        contract: { name: 'slides-file', artifactType: 'slides', description: 'file skill', triggerKeywords: ['deck'] },
        async generate() { return { taskId: 't', type: 'slides', status: 'ready', html: '<html></html>', pages: 1, metadata: {} }; }
      };`,
      'utf-8',
    );

    const skills = await discoverSkillsFromDir(dir);

    expect(skills.map(skill => skill.contract.name)).toEqual(['slides-file']);
  });

  it('discovers skill classes and skips invalid modules', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claw-design-skills-'));
    await writeFile(
      join(dir, 'class-skill.mjs'),
      `export default class {
        constructor() {
          this.contract = { name: 'class-skill', artifactType: 'slides', description: 'class', triggerKeywords: ['deck'] };
        }
        async generate() { return { taskId: 't', type: 'slides', status: 'ready', html: '<html></html>', pages: 1, metadata: {} }; }
      }`,
      'utf-8',
    );
    await writeFile(join(dir, 'invalid.mjs'), 'export default { nope: true };', 'utf-8');

    const skills = await discoverSkillsFromDir(dir);

    expect(skills.map(skill => skill.contract.name)).toEqual(['class-skill']);
  });
});
