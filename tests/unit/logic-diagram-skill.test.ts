import { describe, expect, it } from 'vitest';
import logicDiagramSkill, { LogicDiagramSkill } from '../../src/skills/logic-diagram-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import { renderLogicDiagramHtml } from '../../src/skills/logic-diagram-renderer.js';
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

describe('LogicDiagramSkill', () => {
  it('publishes contract metadata', () => {
    const skill = new LogicDiagramSkill();
    expect(skill.contract.supportedTypes).toEqual(['logic-diagram']);
    expect(skill.contract.supportedOutputs).toEqual(['svg', 'html']);
  });

  it('generates progressive diagram by default', async () => {
    const artifact = await logicDiagramSkill.generate(
      '需求分析→方案设计→开发实现→测试验证→上线发布',
      theme,
      { taskId: 'logic-1' },
    );
    expect(artifact.type).toBe('logic-diagram');
    expect(artifact.html).toContain('data-relation="progressive"');
    expect(artifact.html).toContain('logic-svg');
    expect(artifact.metadata).toMatchObject({ relationType: 'progressive' });
  });

  it('generates hierarchy diagram', async () => {
    const artifact = await logicDiagramSkill.generate(
      '层级关系：公司→部门→团队→个人',
      theme,
      { taskId: 'logic-hierarchy' },
    );
    expect(artifact.html).toContain('data-relation="hierarchy"');
    expect(artifact.metadata).toMatchObject({ relationType: 'hierarchy' });
  });

  it('generates cycle diagram', async () => {
    const artifact = await logicDiagramSkill.generate(
      '循环流程：计划→执行→检查→改进',
      theme,
      { taskId: 'logic-cycle' },
    );
    expect(artifact.html).toContain('data-relation="cycle"');
    expect(artifact.metadata).toMatchObject({ relationType: 'cycle' });
  });

  it('supports all six relation types', async () => {
    const types = ['progressive', 'parallel', 'comparison', 'cycle', 'hierarchy', 'matrix'] as const;
    for (const relationType of types) {
      const artifact = await logicDiagramSkill.generate('概念图', theme, {
        taskId: `logic-${relationType}`,
        logicDiagramConfig: {
          relationType,
          nodes: [
            { id: 'a', label: 'A', level: 0 },
            { id: 'b', label: 'B', level: 1 },
            { id: 'c', label: 'C', level: 1 },
          ],
          edges: [
            { from: 'a', to: 'b', relation: relationType },
            { from: 'a', to: 'c', relation: relationType },
          ],
        },
      });
      expect(artifact.html).toContain(`data-relation="${relationType}"`);
    }
  });

  it('renders SVG with nodes and edges', async () => {
    const artifact = await logicDiagramSkill.generate(
      '概念A，概念B，概念C',
      theme,
      { taskId: 'logic-svg' },
    );
    expect(artifact.html).toContain('data-node=');
    expect(artifact.html).toContain('marker-end="url(#logic-arrow)"');
  });

  it('supports dark theme', async () => {
    const artifact = await logicDiagramSkill.generate('关系图', theme, {
      taskId: 'logic-dark',
      logicDiagramConfig: { theme: 'dark' },
    });
    expect(artifact.html).toContain('data-theme="dark"');
  });

  it('allows registry lookup', () => {
    const registry = new SkillRegistry();
    registry.register(new LogicDiagramSkill());
    expect(registry.getByArtifactType('logic-diagram').map(s => s.contract.name)).toEqual(['logic-diagram']);
  });
});
