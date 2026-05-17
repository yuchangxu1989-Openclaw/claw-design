import { describe, expect, it } from 'vitest';
import infographicSkill, { InfographicSkill } from '../../src/skills/infographic-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#4f46e5',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '12px',
  cssVariables: {
    '--cd-color-primary': '#4f46e5',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '12px',
  },
};

describe('InfographicSkill', () => {
  it('publishes contract metadata', () => {
    const skill = new InfographicSkill();
    expect(skill.contract.supportedTypes).toEqual(['infographic']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
  });

  it('generates vertical infographic by default', async () => {
    const artifact = await infographicSkill.generate(
      '做一张信息图，展示产品开发的三个阶段',
      theme,
      { taskId: 'info-1' },
    );
    expect(artifact.type).toBe('infographic');
    expect(artifact.html).toContain('data-orientation="vertical"');
    expect(artifact.html).toContain('info-block');
    expect(artifact.metadata).toMatchObject({ orientation: 'vertical' });
  });

  it('generates horizontal infographic when input mentions horizontal', async () => {
    const artifact = await infographicSkill.generate(
      '做一张横向信息图，对比三种方案',
      theme,
      { taskId: 'info-h' },
    );
    expect(artifact.html).toContain('data-orientation="horizontal"');
    expect(artifact.metadata).toMatchObject({ orientation: 'horizontal' });
  });

  it('renders stats, steps and comparison blocks', async () => {
    const artifact = await infographicSkill.generate(
      '信息图',
      theme,
      {
        taskId: 'info-blocks',
        infographicConfig: {
          blocks: [
            { id: 'b1', type: 'stats', title: '数字', stats: [{ label: 'Users', value: '10K' }] },
            { id: 'b2', type: 'steps', title: '步骤', steps: [{ number: 1, title: 'Step 1', description: 'Do this' }] },
            { id: 'b3', type: 'comparison', title: '对比', comparisons: [{ label: 'A vs B', left: 'A', right: 'B' }] },
          ],
        },
      },
    );
    expect(artifact.html).toContain('info-stat__value');
    expect(artifact.html).toContain('info-step__num');
    expect(artifact.html).toContain('info-cmp__vs');
  });

  it('supports both themes', async () => {
    const dark = await infographicSkill.generate('信息图', theme, {
      taskId: 'info-dark',
      infographicConfig: { theme: 'dark' },
    });
    expect(dark.html).toContain('data-theme="dark"');
  });

  it('allows registry lookup', () => {
    const registry = new SkillRegistry();
    registry.register(new InfographicSkill());
    expect(registry.getByArtifactType('infographic').map(s => s.contract.name)).toEqual(['infographic']);
  });
});
