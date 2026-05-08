import { describe, expect, it } from 'vitest';
import { ArchDiagramSkill } from '../../src/execution/arch-diagram-skill.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#3366ff',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '12px',
  cssVariables: {
    '--cd-color-primary': '#3366ff',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '12px',
  },
};

describe('ArchDiagramSkill', () => {
  it('renders a Chinese architecture diagram without leaking prompt or internal path', async () => {
    const skill = new ArchDiagramSkill();
    const input = '画一个微服务架构图，包含 API 网关、用户服务、订单服务、数据库';
    const artifact = await skill.generate(input, theme, { taskId: 'task-arch-1' });

    expect(artifact.type).toBe('arch-diagram');
    expect(artifact.html).toContain('系统架构图');
    expect(artifact.html).toContain('API 网关');
    expect(artifact.html).toContain('用户服务');
    expect(artifact.html).toContain('订单服务');
    expect(artifact.html).toContain('数据库');
    expect(artifact.html).not.toContain(input);
    expect(artifact.html).not.toContain('/root/.openclaw/workspace');
    expect(String(artifact.metadata?.title ?? '')).toBe('系统架构图');
    expect(artifact.metadata).not.toHaveProperty('skillPath');
  });
});
