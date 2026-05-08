import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
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
      context: { locale: 'zh-CN', taskId: 'task-skill' },
    });
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
